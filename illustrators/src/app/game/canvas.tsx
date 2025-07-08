'use client';

import { useEffect, useRef } from 'react';
import * as fabric from 'fabric';

type GameCanvasProps = {
  className?: string;
  socket?: any;
  isDrawing?: boolean;
};

export default function GameCanvas({ className, socket, isDrawing = false }: GameCanvasProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !parentRef.current) return;

    const parentRect = parentRef.current.getBoundingClientRect();

    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: isDrawing,
      width: parentRect.width,
      height: parentRect.height,
    });

    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = 'black';
    canvas.freeDrawingBrush.width = 1;

    fabricCanvasRef.current = canvas;

    const resizeCanvas = () => {
      const rect = parentRef.current?.getBoundingClientRect();
      if (!rect) return;

      const { width, height } = rect;
      canvas.setDimensions(rect);
      const lowerCanvas = canvas.lowerCanvasEl;
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

    canvas.on('path:created', () => {
      if (socket) {
        socket.emit('canvas-update', canvas.toJSON());
      }
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [socket]);

  // Update drawing mode when 'isDrawing' changes
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.isDrawingMode = isDrawing;
    }
  }, [isDrawing]);

  return (
    <div ref={parentRef} className={className}>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid #000', display: 'block', background: '#fff' }}
      />
    </div>
  );
}
