'use client';



import { useEffect, useRef, useState } from 'react';

import * as fabric from 'fabric';

import { Socket } from "socket.io-client";


// OLD (Ty's)

type LocalGameCanvasProps = {

  className?: string;

};

export function LocalGameCanvas({ className }: LocalGameCanvasProps) {

  const parentRef = useRef<HTMLDivElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);



  useEffect(() => {

    if (!canvasRef.current || !parentRef.current) return;



    const parentRect = parentRef.current?.getBoundingClientRect();



    const canvas = new fabric.Canvas(canvasRef.current, {

      isDrawingMode: true,

      width: parentRect.width,

      height: parentRect.height

    });



    canvas.setDimensions({}, { backstoreOnly: true });

    fabric.FabricObject.prototype.transparentCorners = false;


    const resizeCanvas = () => {

      const parentRect = parentRef.current?.getBoundingClientRect();

      // Resize Fabric canvas and underlying DOM canvas

      if (parentRect) {

        const width = Math.floor(parentRect.width), height = Math.floor(parentRect.height);

        console.log('resize')

        canvas.setDimensions(parentRect);

        // Resize the DOM canvas element too

        const lowerCanvas = canvas.lowerCanvasEl;

        lowerCanvas.width = width;

        lowerCanvas.height = height;

        lowerCanvas.style.width = `${width}px`;

        lowerCanvas.style.height = `${height}px`;



        // Also style the wrapper div

        const wrapper = canvas.wrapperEl;

        wrapper.style.width = `${width}px`;

        wrapper.style.height = `${height}px`;



        canvas.renderAll();

      }

    };



    // Set initial size

    resizeCanvas();



    // Set up resize listener

    window.addEventListener('resize', resizeCanvas);



    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);

    canvas.freeDrawingBrush.color = 'black';

    canvas.freeDrawingBrush.width = 1;

    canvas.freeDrawingBrush.shadow = null;



    fabricCanvasRef.current = canvas;



    canvas.on('path:created', () => {

      console.log('User drew something');

      console.table(canvas.toJSON());

      // if (socket) {

      //   socket.emit('canvas-update', canvas.toJSON());

      // }

    });



    return () => {

      window.removeEventListener('resize', resizeCanvas);

      fabricCanvasRef.current?.dispose();

      fabricCanvasRef.current = null;

    };

  }, [/*socket*/]);



  return (

    <div ref={parentRef} className={className}>

      <canvas

        ref={canvasRef}

        style={{ border: '1px solid #000', display: 'block' }}

      /></div>

  );

}

// NEW (Tara's)

type GameCanvasToolMenuProps = {
  canvas: fabric.Canvas | null;
  isDrawing: boolean
};

export function GameCanvasToolMenu({ canvas, isDrawing }: GameCanvasToolMenuProps) {
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(1);

  const updateWidth = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setBrushWidth(value);
    if (canvas?.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = value;
    }
  };

  const updateColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBrushColor(value);
    if (canvas?.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = value;
    }
  };

  useEffect(() => {
    if (canvas?.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushWidth;
    }
  }, [canvas, brushColor, brushWidth]);

  return (
    <>
      <div className='absolute top-1 right-1 bg-gray-700 rounded border-2 border-black shadow-md p-3 space-y-2 text-white' style={{ visibility: isDrawing ? 'visible' : 'hidden', zIndex: 1 }}>
        <label htmlFor='drawing-line-width'>
          <p>Line width:<span className="info">{brushWidth}</span></p>
          <input
            type="range"
            min="1"
            max="150"
            id="drawing-line-width"
            value={brushWidth}
            onChange={updateWidth}
          />
        </label>
        <label htmlFor='drawing-color'>
          <p>Line color:</p>
          <input
            type="color"
            id="drawing-color"
            value={brushColor}
            onChange={updateColor}
          />
        </label>
        <button onClick={() => canvas?.clear()} className="block m-auto w-auto h-auto p-2 text-center text-2xl text-white bg-blue-500 hover:bg-blue-700 cursor-pointer">Reset</button>
      </div>
    </>
  )
}

type GameCanvasProps = {
  className?: string;
  socket?: Socket;
  isDrawing?: boolean;
  loadCanvasData?: object | string;
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
  const toolRef = useRef<HTMLDivElement>(null);

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

    const handleCanvasUpdate = (data: object) => {
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
      if (isDrawing) {
        if (toolRef.current)
          toolRef.current!.style.visibility = isDrawing ? 'visible' : 'hidden';
      }
    }
  }, [isDrawing]);

  return (
    <div ref={parentRef} className={className} style={{ position: 'relative', zIndex: 0 }}>
      <GameCanvasToolMenu isDrawing={isDrawing} canvas={fabricCanvasRef.current} />
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid #000', display: 'block' }}
      />
    </div>
  );
}