'use client';

import { useEffect, useRef } from 'react';
import * as fabric from 'fabric';

type GameCanvasProps = {
  className?: string;
  socket?: any;
  isDrawing?: boolean;
  loadCanvasData?: any;
  onCanvasReady?: () => void;
};

export default function GameCanvas({
  className,
  socket,
  isDrawing = false,
  loadCanvasData,
  onCanvasReady,
}: GameCanvasProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  /**
   * Store cleanup function safely using useRef
   */
  const cleanupRef = useRef<(() => void) | null>(null);


  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !parentRef.current || !socket) return;

    const rafId = requestAnimationFrame(() => {
      const parentRect = parentRef.current!.getBoundingClientRect();

      const canvas = new fabric.Canvas(canvasRef.current!, {
        isDrawingMode: isDrawing,
        width: parentRect.width,
        height: parentRect.height,
      });

      // ensures that the guessers cant move objects or select paths
      // only the drawer has full control
      canvas.selection = false;
      canvas.forEachObject(obj => {
        obj.selectable = isDrawing;
      });

      // prevent editing by mistake
      canvas.skipTargetFind = !isDrawing;

      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = 'black';
      canvas.freeDrawingBrush.width = 1;

      fabricCanvasRef.current = canvas;

      // Notify parent that canvas is ready (for guessers to safely emit request-canvas)
      if (typeof onCanvasReady === 'function') {
        onCanvasReady();
      }

      const resizeCanvas = () => {
        const rect = parentRef.current?.getBoundingClientRect();
        if (!rect) return;

        const { width, height } = rect;
        canvas.setDimensions(rect);
        const lowerCanvas = canvas.lowerCanvasEl;
        if (!lowerCanvas) return;

        lowerCanvas.width = width;
        lowerCanvas.height = height;
        lowerCanvas.style.width = `${width}px`;
        lowerCanvas.style.height = `${height}px`;

        const wrapper = canvas.wrapperEl;
        wrapper.style.width = `${width}px`;
        wrapper.style.height = `${height}px`;

        canvas.renderAll();
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      // ensures that only the drawer emits updates
      canvas.on('path:created', () => {
        if (isDrawing && socket) {
          const json = canvas.toJSON();
          socket.emit('canvas-update', json);
        }
      });

      // Store cleanup in ref
      cleanupRef.current = () => {
        window.removeEventListener('resize', resizeCanvas);
        canvas.dispose();
        fabricCanvasRef.current = null;
      };
    });

    // cleanup ref here
    return () => {
      cancelAnimationFrame(rafId);
      cleanupRef.current?.();
    };


  }, [socket, isDrawing]); // ensures that when the drawer starts drawing, the canvas will initialize with both isDrawing: true

  // Listen for canvas updates from drawer
  // edit: removed || isDrawing since we don't need to check, we should always receive updstes
  useEffect(() => {
    if (!socket) return;

    const handleCanvasUpdate = (data: any) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      console.log('[GUESSER] received canvas-update');

      try {
        canvas.loadFromJSON(data, () => {
          canvas.requestRenderAll();
        });
      } catch (err) {
        console.error('Failed to sync canvas-update:', err);
      }
    };

    socket.on('canvas-update', handleCanvasUpdate);

    return () => {
      socket.off('canvas-update', handleCanvasUpdate);
    };
  }, [socket, isDrawing]);

  // load initial canvas passed from parent
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !loadCanvasData) return;

    // even for drawer, always load canvas on mount (e.g. after refresh)
    try {
      canvas.loadFromJSON(loadCanvasData, () => {
        canvas.requestRenderAll();
      });
    } catch (err) {
      console.error('Failed to load canvas from JSON (on refresh):', err);
    }
  }, [loadCanvasData]);



  // Update drawing mode when "isDrawing" changes
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.isDrawingMode = isDrawing;
    }
  }, [isDrawing]);

  return (
    <div ref={parentRef} className={className}>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid #000', display: 'block' }}
      />
    </div>
  );
}
