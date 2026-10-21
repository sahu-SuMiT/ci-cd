'use client';

import React, { useEffect, useRef } from 'react';

interface SparkleCanvasProps {
  burstTrigger: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  color: string;
  isBurst?: boolean;
  decay?: number;
}

export default function SparkleCanvas({ burstTrigger }: SparkleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const colors = [
    'rgba(251, 191, 36, ', // Amber
    'rgba(244, 114, 182, ', // Pink
    'rgba(147, 197, 253, ', // Sky
    'rgba(167, 139, 250, ', // Violet
    'rgba(52, 211, 153, ', // Emerald
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Initial ambient particles
    particlesRef.current = [];
    const ambientCount = Math.min(55, Math.floor((width * height) / 25000));
    for (let i = 0; i < ambientCount; i++) {
      particlesRef.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.4,
        size: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.7,
        maxAlpha: Math.random() * 0.6 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw and update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.isBurst) {
          p.alpha -= p.decay || 0.015;
          p.size *= 0.985;
          if (p.alpha <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }
        } else {
          // Ambient particle cycling
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0, p.alpha)})`;
        ctx.shadowColor = `${p.color}0.8)`;
        ctx.shadowBlur = p.isBurst ? 12 : 6;
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Burst effect when burstTrigger changes
  useEffect(() => {
    if (burstTrigger === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const burstCount = 48;
    for (let i = 0; i < burstCount; i++) {
      const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 5 + 2.5;
      particlesRef.current.push({
        x: centerX + (Math.random() - 0.5) * 40,
        y: centerY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: Math.random() * 4 + 2,
        alpha: 1,
        maxAlpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        isBurst: true,
        decay: Math.random() * 0.015 + 0.01,
      });
    }
  }, [burstTrigger]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-70"
      aria-hidden="true"
    />
  );
}
