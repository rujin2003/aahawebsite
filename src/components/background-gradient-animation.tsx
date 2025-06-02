"use client";

import { useEffect, useRef } from "react";

export function MissionGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || 500;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const colors = [
      { r: 255, g: 20, b: 147 }, // Deep Pink
      { r: 30, g: 144, b: 255 }, // Dodger Blue
      { r: 255, g: 69, b: 0 },   // Vivid Red-Orange
      { r: 0, g: 250, b: 154 },  // Medium Spring Green
    ];

    class Blob {
      x: number;
      y: number;
      radius: number;
      color: { r: number; g: number; b: number };
      originalX: number;
      originalY: number;
      speed: number;
      angle: number;
      range: number;

      constructor() {
        this.originalX = Math.random() * canvas.width;
        this.originalY = Math.random() * canvas.height;
        this.x = this.originalX;
        this.y = this.originalY;
        this.radius = Math.random() * 100 + 70;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.speed = 0.5 + Math.random() * 0.3; 
        this.angle = Math.random() * Math.PI * 2;
        this.range = 80 + Math.random() * 40;
      }

      update() {
        this.angle += this.speed * 0.016; // Use a fixed time step (≈ 16ms per frame)
        this.x = this.originalX + Math.cos(this.angle) * this.range;
        this.y = this.originalY + Math.sin(this.angle) * this.range;
      }

      draw() {
        if (!ctx) return;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.8)`;
        ctx.fill();

        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius
        );

        gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.9)`);
        gradient.addColorStop(0.8, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.6)`);
        gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    const blobs = Array.from({ length: 7 }, () => new Blob());

    const animate = () => {
      if (!ctx) return;

      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = "screen";

      blobs.forEach((blob) => {
        blob.update();
        blob.draw();
      });

      ctx.globalCompositeOperation = "source-over";

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
