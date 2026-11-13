'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ArrowDown, ShieldCheck, CheckCircle2, ChevronDown, BedDouble, PartyPopper } from 'lucide-react';

const TOTAL_FRAMES = 240;

// Format frame number to 3-digit zero padded (e.g. 1 -> "001")
function getFramePath(index: number): string {
  const pad = String(index + 1).padStart(3, '0');
  return `/frames/ezgif-frame-${pad}.jpg`;
}

interface StageInfo {
  tag: string;
  tagIcon: React.ReactNode;
  heading: string;
  highlightText: string;
  description: string;
  badge?: string;
}

export function ScrollHeroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const [loadedCount, setLoadedCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const rafId = useRef<number | null>(null);

  // Draw a given image onto the canvas with crisp aspect-ratio cover
  const drawFrame = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) return;

    // Aspect cover calculation
    const hRatio = width / img.naturalWidth;
    const vRatio = height / img.naturalHeight;
    const ratio = Math.max(hRatio, vRatio);

    const drawW = img.naturalWidth * ratio;
    const drawH = img.naturalHeight * ratio;
    const shiftX = (width - drawW) / 2;
    const shiftY = (height - drawH) / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, shiftX, shiftY, drawW, drawH);
  }, []);

  // Preload initial frames and stream remainder
  useEffect(() => {
    let isCancelled = false;

    // Canvas size adjustment
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Re-draw current frame
      const currentImg = imagesRef.current[currentFrameIndex];
      if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
        drawFrame(currentImg);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Frame 1 immediate load
    const firstImg = new Image();
    firstImg.src = getFramePath(0);
    firstImg.onload = () => {
      if (isCancelled) return;
      imagesRef.current[0] = firstImg;
      setLoadedCount((c) => c + 1);
      drawFrame(firstImg);
    };

    // Load first 30 frames with high priority
    const priorityLimit = 30;
    for (let i = 1; i < priorityLimit; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        if (isCancelled) return;
        imagesRef.current[i] = img;
        setLoadedCount((c) => c + 1);
      };
    }

    // Load remaining frames asynchronously in staggered batches
    const loadRemaining = () => {
      let idx = priorityLimit;
      const batchSize = 10;

      const loadNextBatch = () => {
        if (isCancelled || idx >= TOTAL_FRAMES) return;
        const end = Math.min(idx + batchSize, TOTAL_FRAMES);
        for (let i = idx; i < end; i++) {
          const img = new Image();
          img.src = getFramePath(i);
          img.onload = () => {
            if (isCancelled) return;
            imagesRef.current[i] = img;
            setLoadedCount((c) => c + 1);
          };
        }
        idx = end;
        if (idx < TOTAL_FRAMES) {
          setTimeout(loadNextBatch, 50);
        }
      };

      setTimeout(loadNextBatch, 200);
    };

    loadRemaining();

    return () => {
      isCancelled = true;
      window.removeEventListener('resize', handleResize);
    };
  }, [drawFrame, currentFrameIndex]);

  // Handle scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;

      if (totalScrollable <= 0) return;

      // Progress is how much of container has been scrolled past top of viewport
      const rawProgress = -rect.top / totalScrollable;
      const clampedProgress = Math.max(0, Math.min(1, rawProgress));

      setProgress(clampedProgress);

      const targetFrame = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.floor(clampedProgress * (TOTAL_FRAMES - 1)))
      );

      if (targetFrame !== currentFrameIndex) {
        setCurrentFrameIndex(targetFrame);

        // Find current or closest loaded frame
        let imgToDraw = imagesRef.current[targetFrame];
        if (!imgToDraw || !imgToDraw.complete || imgToDraw.naturalWidth === 0) {
          // Search backwards for closest loaded frame
          for (let b = targetFrame - 1; b >= 0; b--) {
            if (imagesRef.current[b] && imagesRef.current[b]!.complete) {
              imgToDraw = imagesRef.current[b];
              break;
            }
          }
        }

        if (imgToDraw && imgToDraw.complete && imgToDraw.naturalWidth > 0) {
          if (rafId.current) cancelAnimationFrame(rafId.current);
          rafId.current = requestAnimationFrame(() => drawFrame(imgToDraw!));
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [currentFrameIndex, drawFrame]);

  // Smooth scroll to explore stays
  const scrollToContent = () => {
    const target = document.getElementById('main-content-start');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Determine active stage based on scroll progress
  // 0.0 - 0.25: Discover & Search Stays
  // 0.25 - 0.55: Choose Exact Bed
  // 0.55 - 0.85: Booking Confirmed & Confetti
  // 0.85 - 1.00: Triumph & Start Staying
  const getStageInfo = (): { stage: number; info: StageInfo } => {
    if (progress < 0.25) {
      return {
        stage: 1,
        info: {
          tag: 'HAR SAHAR APNA GHAR • 100% VERIFIED',
          tagIcon: <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" />,
          heading: 'Find Your University Stay',
          highlightText: 'Without Brokers',
          description:
            'Every student hostel, PG, and flat is physically inspected and geo-audited before being listed.',
          badge: 'Step 1 • Discover',
        },
      };
    } else if (progress < 0.55) {
      return {
        stage: 2,
        info: {
          tag: 'ZERO DOUBLE-BOOKING • ATOMIC REDIS LOCK',
          tagIcon: <BedDouble className="w-3.5 h-3.5 text-[#21865B]" />,
          heading: 'Choose Your Exact',
          highlightText: 'Room & Bed',
          description:
            'Interactive 3D inventory. Lock your exact bed for 8 minutes to guarantee zero phantom vacancies.',
          badge: 'Step 2 • Select Bed',
        },
      };
    } else if (progress < 0.85) {
      return {
        stage: 3,
        info: {
          tag: 'INSTANT CONFIRMATION • ESCROW SECURITY',
          tagIcon: <PartyPopper className="w-3.5 h-3.5 text-[#F5A623]" />,
          heading: 'Instant Move-In Pass &',
          highlightText: 'Secure Receipt',
          description:
            'Complete transparent checkout with UPI, Card, or Net Banking. Official QR move-in pass issued instantly.',
          badge: 'Step 3 • Confirmed',
        },
      };
    } else {
      return {
        stage: 4,
        info: {
          tag: 'WELCOME TO YOUR NEW HOME',
          tagIcon: <ShieldCheck className="w-3.5 h-3.5 text-[#21865B]" />,
          heading: 'Live Confidently Near',
          highlightText: 'Your University',
          description:
            'Join thousands of happy students across Bhopal, Indore & Gwalior living in verified Apna Ghar stays.',
          badge: 'Step 4 • Move In',
        },
      };
    }
  };

  const { stage, info } = getStageInfo();

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[380vh] bg-[#071322] text-white"
    >
      {/* Sticky Fullscreen Canvas Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {/* HTML5 Canvas Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Cinematic Gradient Overlays to preserve legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#071322]/90 via-[#071322]/30 to-[#071322]/70 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071322]/85 via-transparent to-[#071322]/60 pointer-events-none" />

        {/* Top Controls Bar */}
        <div className="absolute top-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between pointer-events-auto z-20">
          {/* Logo Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-xs font-black text-white shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />
            <span>Interactive Stay Experience</span>
            {loadedCount < 30 && (
              <span className="text-[10px] text-white/50 font-medium">({Math.round((loadedCount / 30) * 100)}%)</span>
            )}
          </div>

          {/* Quick Skip to Search Button */}
          <button
            onClick={scrollToContent}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-extrabold text-white transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
          >
            <span>Skip to Stays</span>
            <ArrowDown className="w-3.5 h-3.5 text-[#F5A623]" />
          </button>
        </div>

        {/* Interactive Story Overlay Cards */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-between h-full pt-24 pb-14 pointer-events-none">
          {/* Main Story Content (Left-aligned for seamless view of 3D phone on right) */}
          <div className="max-w-xl space-y-4 pointer-events-auto transition-all duration-300">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#102B50]/90 backdrop-blur-md border border-[#F5A623]/30 text-xs font-bold text-white shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300">
              {info.tagIcon}
              <span className="tracking-wide text-[11px] sm:text-xs">{info.tag}</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] drop-shadow-md">
              {info.heading}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] via-[#FFD066] to-[#F5A623]">
                {info.highlightText}
              </span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-white/85 leading-relaxed drop-shadow font-medium max-w-lg">
              {info.description}
            </p>

            {/* Dynamic Action Buttons when near conclusion */}
            {stage === 4 ? (
              <div className="pt-4 flex flex-wrap items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                <button
                  onClick={scrollToContent}
                  className="px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-black text-[#102B50] bg-[#F5A623] hover:bg-[#E99A12] transition-all shadow-lg hover:shadow-xl flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Explore Stays Below</span>
                  <ArrowDown className="w-4 h-4" />
                </button>
                <Link
                  href="/search"
                  className="px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all flex items-center gap-2"
                >
                  <span>Browse All 60+ Stays</span>
                  <ArrowRight className="w-4 h-4 text-[#F5A623]" />
                </Link>
              </div>
            ) : (
              <div className="pt-2 flex items-center gap-3 text-xs text-white/70">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#21865B]" />
                  <span>{info.badge}</span>
                </div>
                <span>Scroll down to continue • {Math.round(progress * 100)}%</span>
              </div>
            )}
          </div>

          {/* Bottom Progress & Scroll Indicator Bar */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto">
            {/* Story Timeline Steps */}
            <div className="flex items-center gap-2 sm:gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/15">
              {[
                { num: 1, label: 'Search' },
                { num: 2, label: 'Select Bed' },
                { num: 3, label: 'Confirm' },
                { num: 4, label: 'Move In' },
              ].map((step) => {
                const isActive = stage === step.num;
                const isPassed = stage > step.num;
                return (
                  <div
                    key={step.num}
                    className="flex items-center gap-1.5 text-xs font-bold transition-all"
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                        isActive
                          ? 'bg-[#F5A623] text-[#102B50] scale-110 shadow-sm'
                          : isPassed
                          ? 'bg-[#21865B] text-white'
                          : 'bg-white/20 text-white/60'
                      }`}
                    >
                      {step.num}
                    </span>
                    <span
                      className={`hidden md:inline text-[11px] ${
                        isActive ? 'text-white' : isPassed ? 'text-white/80' : 'text-white/40'
                      }`}
                    >
                      {step.label}
                    </span>
                    {step.num < 4 && <span className="text-white/30 hidden md:inline ml-1.5">•</span>}
                  </div>
                );
              })}
            </div>

            {/* Scroll Down Prompt */}
            <button
              onClick={scrollToContent}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-xs font-semibold text-white/80 hover:text-white transition group cursor-pointer"
            >
              <span>Scroll down to continue</span>
              <ChevronDown className="w-4 h-4 text-[#F5A623] group-hover:translate-y-0.5 transition-transform animate-bounce" />
            </button>
          </div>
        </div>

        {/* Global Thin Top Scroll Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-30 pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-[#F5A623] to-[#21865B] transition-all duration-75"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

