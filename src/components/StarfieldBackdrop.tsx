"use client";

import { useEffect, useRef } from "react";

interface StarSeed {
  angle: number;
  radiusNorm: number;
  size: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  tint: "bone" | "amber" | "blue";
  hasHalo: boolean;
}

const STAR_COUNT = 145;

function createDeterministicStars(): StarSeed[] {
  const stars: StarSeed[] = [];
  for (let i = 0; i < STAR_COUNT; i += 1) {
    const angle = i * 2.39996323;
    const radiusNorm = Math.sqrt((i + 0.5) / STAR_COUNT);
    const isBright = i % 13 === 0;
    const isMedium = i % 4 === 0;
    const size = isBright ? 1.9 : isMedium ? 1.25 : 0.8;
    const baseAlpha = isBright ? 0.72 : isMedium ? 0.45 : 0.24;
    const tint: StarSeed["tint"] = i % 19 === 0 ? "amber" : i % 11 === 0 ? "blue" : "bone";

    stars.push({
      angle,
      radiusNorm,
      size,
      baseAlpha,
      twinklePhase: (i * 1.7) % (Math.PI * 2),
      twinkleSpeed: 0.6 + (i % 5) * 0.25,
      tint,
      hasHalo: isBright,
    });
  }
  return stars;
}

const STARS = createDeterministicStars();

function getStarRgb(tint: StarSeed["tint"]): string {
  if (tint === "amber") return "229, 152, 56";
  if (tint === "blue") return "138, 180, 232";
  return "230, 235, 242";
}

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
        rotationRad += dt * 0.008;
      }

      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.42;
      const maxR = Math.hypot(width, height) * 0.64;

      if (!isLight) {
        // Banda galáctica sutil (Vía Láctea en diagonal)
        const nebulaGrad = ctx.createRadialGradient(
          width * 0.28,
          height * 0.24,
          20,
          width * 0.45,
          height * 0.45,
          maxR * 0.9
        );
        nebulaGrad.addColorStop(0, "rgba(59, 130, 166, 0.11)");
        nebulaGrad.addColorStop(0.45, "rgba(30, 48, 82, 0.08)");
        nebulaGrad.addColorStop(0.8, "rgba(229, 152, 56, 0.03)");
        nebulaGrad.addColorStop(1, "rgba(11, 14, 20, 0)");
        ctx.fillStyle = nebulaGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Retícula celeste (arcos de declinación y meridianos suaves)
      ctx.strokeStyle = isLight ? "rgba(17, 24, 39, 0.05)" : "rgba(153, 165, 184, 0.075)";
      ctx.lineWidth = 1;
      for (const ratio of [0.24, 0.46, 0.68, 0.9]) {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * ratio, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let m = 0; m < 6; m += 1) {
        const theta = (m * Math.PI) / 3 + rotationRad * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(theta) * (maxR * 0.12), cy + Math.sin(theta) * (maxR * 0.12));
        ctx.lineTo(cx + Math.cos(theta) * maxR, cy + Math.sin(theta) * maxR);
        ctx.stroke();
      }

      if (!isLight) {
        const timeSec = now * 0.001;
        for (const star of STARS) {
          const theta = star.angle + rotationRad;
          const r = star.radiusNorm * maxR;
          const x = cx + Math.cos(theta) * r;
          const y = cy + Math.sin(theta) * r;

          const twinkle = reduced
            ? 1
            : 0.78 + 0.22 * Math.sin(timeSec * star.twinkleSpeed + star.twinklePhase);
          const alpha = Number((star.baseAlpha * twinkle).toFixed(3));
          const rgb = getStarRgb(star.tint);

          if (star.hasHalo) {
            ctx.fillStyle = `rgba(${rgb}, ${(alpha * 0.16).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(x, y, star.size * 3.4, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
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
