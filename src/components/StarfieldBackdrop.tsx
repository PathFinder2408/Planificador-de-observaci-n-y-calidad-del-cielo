"use client";

import { useEffect, useRef } from "react";

interface StarSeed {
  angle: number;
  radiusNorm: number;
  size: number;
  alpha: number;
  isAmber: boolean;
}

const STAR_COUNT = 85;

function createDeterministicStars(): StarSeed[] {
  const stars: StarSeed[] = [];
  for (let i = 0; i < STAR_COUNT; i += 1) {
    // Secuencia determinista (golden angle) para distribución uniforme sin clustering
    const angle = i * 2.39996323;
    const radiusNorm = Math.sqrt((i + 0.5) / STAR_COUNT);
    const size = i % 11 === 0 ? 1.6 : i % 4 === 0 ? 1.1 : 0.75;
    const alpha = i % 11 === 0 ? 0.55 : i % 3 === 0 ? 0.35 : 0.2;
    stars.push({
      angle,
      radiusNorm,
      size,
      alpha,
      isAmber: i % 17 === 0,
    });
  }
  return stars;
}

const STARS = createDeterministicStars();

export function StarfieldBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lightSchemeQuery = window.matchMedia("(prefers-color-scheme: light)");

    let animationId = 0;
    let rotationRad = 0;
    let lastTime = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawFrame = (now: number) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLight = lightSchemeQuery.matches;
      const reduced = reducedMotionQuery.matches;

      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (!reduced && !document.hidden) {
        // Deriva sideral sutil (~0.006 rad/s)
        rotationRad += dt * 0.006;
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.42;
      const maxR = Math.hypot(width, height) * 0.62;

      // Retícula celeste sutil (arcos de declinación)
      ctx.strokeStyle = isLight ? "rgba(17, 24, 39, 0.045)" : "rgba(153, 165, 184, 0.045)";
      ctx.lineWidth = 1;
      for (const ratio of [0.28, 0.52, 0.78]) {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * ratio, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (!isLight) {
        for (const star of STARS) {
          const theta = star.angle + rotationRad;
          const r = star.radiusNorm * maxR;
          const x = cx + Math.cos(theta) * r;
          const y = cy + Math.sin(theta) * r;

          ctx.fillStyle = star.isAmber
            ? `rgba(229, 152, 56, ${star.alpha})`
            : `rgba(230, 235, 242, ${star.alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reduced) {
        animationId = window.requestAnimationFrame(drawFrame);
      }
    };

    resize();
    animationId = window.requestAnimationFrame(drawFrame);

    window.addEventListener("resize", resize);
    const handleMotionChange = () => {
      window.cancelAnimationFrame(animationId);
      lastTime = performance.now();
      animationId = window.requestAnimationFrame(drawFrame);
    };
    reducedMotionQuery.addEventListener("change", handleMotionChange);
    lightSchemeQuery.addEventListener("change", handleMotionChange);

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      reducedMotionQuery.removeEventListener("change", handleMotionChange);
      lightSchemeQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
