// REFERENCE: https://www.w3schools.com/html/html5_canvas.asp
// CONSIDERATIONS:
//  USE THREE.JS AND PIXI.JS ??

'use client';

import { useRef, useEffect, useState } from 'react';

export default function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);


    const [points, setPoints] = useState<{ x: number; y: number }[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setPoints((prev) => [...prev, { x, y }]);
        };

        canvas.addEventListener('click', handleClick);

        return () => {
            canvas.removeEventListener('click', handleClick);
        };
    }, []);


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

            // Draw Strokes
            ctx.strokeStyle = 'lime';
            ctx.lineWidth = 2;
            ctx.beginPath();

            points.forEach((point, i) => {
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });

            ctx.stroke();
            // End Strokes

            ctx.fillStyle = 'red';
            ctx.fillRect(boxX++, boxY++, 50, 50);

            if(boxX >= canvas.width) boxX = 0;
            if(boxY >= canvas.height) boxY = 0;

            // This is the loop (End)
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, [points]);

    return <canvas ref={canvasRef} width={800} height={600} className="border border-white" />;
}