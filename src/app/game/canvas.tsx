'use client';



import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';

import * as fabric from 'fabric';


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

type GameCanvasProps = {
  className?: string;
  socket?: Socket | undefined;
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
  }, [isDrawing, socket]);

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
