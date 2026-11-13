'use client';

import React, { useEffect, useRef } from 'react';

const TOTAL_FRAMES = 240;

function getFramePath(index: number): string {
  const pad = String(index + 1).padStart(3, '0');
  return `/frames/ezgif-frame-${pad}.jpg`;
}

interface ScrollHeroAnimationProps {
  compact?: boolean;
}

export function ScrollHeroAnimation({ compact = false }: ScrollHeroAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const lastDrawnFrameRef = useRef(-1);
  const isUserScrollingRef = useRef(false);
  const scrollIdleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let isDestroyed = false;

    // Helper to draw a specific frame (or closest loaded fallback)
    const drawFrame = (frameIndex: number): boolean => {
      const idx = ((frameIndex % TOTAL_FRAMES) + TOTAL_FRAMES) % TOTAL_FRAMES;
      const img = imagesRef.current[idx];

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, 1280, 720);
        lastDrawnFrameRef.current = idx;
        return true;
      }

      // Fallback: search backwards for closest loaded frame
      for (let i = idx - 1; i >= 0; i--) {
        const fallback = imagesRef.current[i];
        if (fallback && fallback.complete && fallback.naturalWidth > 0) {
          ctx.drawImage(fallback, 0, 0, 1280, 720);
          lastDrawnFrameRef.current = i;
          return true;
        }
      }

      // If no earlier frame, search forwards
      for (let i = idx + 1; i < TOTAL_FRAMES; i++) {
        const fallback = imagesRef.current[i];
        if (fallback && fallback.complete && fallback.naturalWidth > 0) {
          ctx.drawImage(fallback, 0, 0, 1280, 720);
          lastDrawnFrameRef.current = i;
          return true;
        }
      }

      return false;
    };

    // 1. Preload frame 0 immediately and register reference first
    const img0 = new Image();
    imagesRef.current[0] = img0;
    img0.onload = () => {
      if (!isDestroyed && lastDrawnFrameRef.current === -1) {
        drawFrame(0);
      }
    };
    img0.src = getFramePath(0);
    if (img0.complete && img0.naturalWidth > 0) {
      drawFrame(0);
    }

    // 2. Preload all remaining frames concurrently
    for (let i = 1; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      imagesRef.current[i] = img;
      img.onload = () => {
        if (!isDestroyed && lastDrawnFrameRef.current === -1) {
          drawFrame(i);
        }
      };
      img.src = getFramePath(i);
    }

    // 3. Time-driven auto-play loop at 24 fps (never blocks or deadlocks)
    let lastTick = performance.now();
    const frameInterval = 1000 / 24; // 24 fps (~41.67ms)

    const playLoop = (now: number) => {
      if (isDestroyed) return;

      if (!isUserScrollingRef.current) {
        const delta = now - lastTick;
        if (delta >= frameInterval) {
          const advance = Math.max(1, Math.floor(delta / frameInterval));
          lastTick = now - (delta % frameInterval);
          currentFrameRef.current = (currentFrameRef.current + advance) % TOTAL_FRAMES;
          drawFrame(currentFrameRef.current);
        }
      }

      rafIdRef.current = requestAnimationFrame(playLoop);
    };

    rafIdRef.current = requestAnimationFrame(playLoop);

    // 4. Scroll handler: seamlessly scrubs animation with page scroll
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 800;

      // Check if container is visible in viewport
      if (rect.bottom > 0 && rect.top < viewportHeight) {
        isUserScrollingRef.current = true;

        if (scrollIdleTimerRef.current) {
          clearTimeout(scrollIdleTimerRef.current);
        }

        // Resume auto-play 600ms after user pauses scrolling
        scrollIdleTimerRef.current = setTimeout(() => {
          isUserScrollingRef.current = false;
          lastTick = performance.now();
        }, 600);

        if (compact) {
          // In compact banner mode: scrub based on element's transit across viewport
          const elementProgress = Math.max(
            0,
            Math.min(1, (viewportHeight - rect.top) / (viewportHeight + rect.height))
          );
          const frame = Math.min(
            TOTAL_FRAMES - 1,
            Math.max(0, Math.floor(elementProgress * (TOTAL_FRAMES - 1)))
          );
          currentFrameRef.current = frame;
          drawFrame(frame);
        } else {
          // In full hero mode: scrub across the full 300vh track
          const totalScrollable = rect.height - viewportHeight;
          if (totalScrollable > 0) {
            const rawProgress = -rect.top / totalScrollable;
            const clamped = Math.max(0, Math.min(1, rawProgress));
            const frame = Math.min(
              TOTAL_FRAMES - 1,
              Math.max(0, Math.floor(clamped * (TOTAL_FRAMES - 1)))
            );
            currentFrameRef.current = frame;
            drawFrame(frame);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger initial check
    handleScroll();

    return () => {
      isDestroyed = true;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [compact]);

  if (compact) {
    return (
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/9] max-h-[380px] rounded-3xl overflow-hidden shadow-brand-md border border-[#E8E5DE] bg-[#071322]"
      >
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-cover select-none pointer-events-none block"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[300vh] bg-[#071322]"
    >
      <div className="sticky top-16 h-[calc(100vh-4rem)] w-full overflow-hidden flex items-center justify-center bg-[#071322]">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-cover select-none pointer-events-none block"
        />
      </div>
    </div>
  );
}
