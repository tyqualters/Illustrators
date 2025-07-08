'use client';

import { useEffect, useRef } from 'react';
import * as fabric from 'fabric';

type GameCanvasProps = {
  className?: string;
  socket?: any;
};

export default function GameCanvas({ className, socket }: GameCanvasProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !parentRef.current) return;

    let parentRect = parentRef.current?.getBoundingClientRect();

    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      width: parentRect.width,
      height: parentRect.height
    });

    canvas.setDimensions({}, { backstoreOnly: true });

    fabric.Object.prototype.transparentCorners = false;

    const resizeCanvas = () => {
      let parentRect = parentRef.current?.getBoundingClientRect();

    // Resize Fabric canvas and underlying DOM canvas
    if(parentRect) {
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
      if (socket) {
        socket.emit('canvas-update', canvas.toJSON());
      }
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      fabricCanvasRef.current?.dispose();
      fabricCanvasRef.current = null;
    };
  }, [socket]);
  
  return (
    <div ref={parentRef} className={className}>
    <canvas
      ref={canvasRef}
      style={{ border: '1px solid #000', display: 'block', background: '#fff' }}
    /></div>
  );
}