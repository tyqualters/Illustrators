// REFERENCE: https://www.w3schools.com/html/html5_canvas.asp

'use client';

import { useRef, useEffect } from 'react';

export default function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        let boxX: number = 100, boxY: number = 100;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // This is the loop (Beginning)

            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'red';
            ctx.fillRect(boxX++, boxY++, 50, 50);

            if(boxX >= canvas.width) boxX = 0;
            if(boxY >= canvas.height) boxY = 0;

            // This is the loop (End)
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return <canvas ref={canvasRef} width={800} height={600} className="border border-white" />;
}