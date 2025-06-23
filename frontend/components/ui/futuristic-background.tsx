'use client';
import { useEffect, useRef } from 'react';

export function FuturisticBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const drawDots = () => {
            const spacing = 40;
            const dotSize = 1.5;
            const width = window.innerWidth;
            const height = window.innerHeight;

            canvas.width = width;
            canvas.height = height;

            // Optional: Fill dark background, comment if using CSS background
            ctx.fillStyle = '#0e0f23'; // deep dark blue
            ctx.fillRect(0, 0, width, height);

            // Dot style
            ctx.fillStyle = 'rgba(173, 216, 230, 0.8)'; // lightblue
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(100, 149, 237, 0.8)'; // cornflower blue glow

            for (let x = 0; x < width; x += spacing) {
                for (let y = 0; y < height; y += spacing) {
                    ctx.beginPath();
                    ctx.arc(x, y, dotSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Reset shadow after drawing
            ctx.shadowBlur = 0;
        };

        window.addEventListener('resize', drawDots);
        drawDots();

        return () => {
            window.removeEventListener('resize', drawDots);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full -z-10"
        />
    );
}
