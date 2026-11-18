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

interface CometTrack {
  periodSec: number;
  durationSec: number;
  offsetSec: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  tailLength: number;
  tint: "amber" | "blue";
}

const STAR_COUNT = 145;

const COMET_TRACKS: readonly CometTrack[] = [
  {
    periodSec: 9,
    durationSec: 2.2,
    offsetSec: 1.5,
    startX: 0.08,
    startY: 0.14,
    endX: 0.44,
    endY: 0.38,
    tailLength: 110,
    tint: "amber",
  },
  {
    periodSec: 13,
    durationSec: 2.4,
    offsetSec: 6.2,
    startX: 0.88,
    startY: 0.1,
    endX: 0.56,
    endY: 0.34,
    tailLength: 125,
    tint: "blue",
  },
  {
    periodSec: 17,
    durationSec: 2.0,
    offsetSec: 11.0,
    startX: 0.15,
    startY: 0.72,
    endX: 0.48,
    endY: 0.52,
    tailLength: 95,
    tint: "blue",
  },
];

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

function drawComets(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeSec: number
): void {
  for (const track of COMET_TRACKS) {
    const cyclePos = (timeSec + track.offsetSec) % track.periodSec;
    if (cyclePos > track.durationSec) continue;

    const progress = cyclePos / track.durationSec;
    const fade = Math.sin(progress * Math.PI);
    const sx = track.startX * width;
    const sy = track.startY * height;
    const ex = track.endX * width;
    const ey = track.endY * height;

    const headX = sx + (ex - sx) * progress;
    const headY = sy + (ey - sy) * progress;

    const dx = ex - sx;
    const dy = ey - sy;
    const dist = Math.hypot(dx, dy) || 1;
    const tailX = headX - (dx / dist) * track.tailLength;
    const tailY = headY - (dy / dist) * track.tailLength;

    const rgb = track.tint === "amber" ? "229, 152, 56" : "138, 180, 232";
    const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
    grad.addColorStop(0, `rgba(${rgb}, 0)`);
    grad.addColorStop(0.65, `rgba(${rgb}, ${(0.22 * fade).toFixed(3)})`);
    grad.addColorStop(1, `rgba(230, 235, 242, ${(0.85 * fade).toFixed(3)})`);

    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(headX, headY);
    ctx.stroke();

    ctx.fillStyle = `rgba(${rgb}, ${(0.28 * fade).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(headX, headY, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(230, 235, 242, ${(0.9 * fade).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(headX, headY, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
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

        if (!reduced) {
          drawComets(ctx, width, height, timeSec);
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
