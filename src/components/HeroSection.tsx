import React, { useState, useEffect, useRef } from 'react';
import { ManhwaItem } from '../types';
import { ChevronLeft, ChevronRight, Play, Pause, BookOpen } from 'lucide-react';

interface HeroSectionProps {
  trackedCount: number;
  unreadChaptersCount: number;
  newDiscoveriesCount: number;
  items: ManhwaItem[];
  isDarkMode?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  trackedCount,
  unreadChaptersCount,
  newDiscoveriesCount,
  items,
  isDarkMode = true,
}) => {
  const isCaughtUp = unreadChaptersCount === 0;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const totalCount = items.length;
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAutoPlaying || totalCount <= 1) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }
    autoPlayTimerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalCount);
    }, 4500);
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying, totalCount]);

  const handleNext = () => { if (totalCount > 1) setActiveIndex((prev) => (prev + 1) % totalCount); };
  const handlePrev = () => { if (totalCount > 1) setActiveIndex((prev) => (prev - 1 + totalCount) % totalCount); };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > 40) {
      if (distance > 0) handleNext(); else handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const displayItems = items.length > 0 ? items : [
    { id: 'demo-1', title: 'Add your first manhwa', cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80', latest_chapter: 1, last_read_chapter: 0 } as ManhwaItem,
  ];

  return (
    <section className="pt-4 pb-8 sm:pt-10 sm:pb-12 select-none overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 sm:gap-10">

        <div className="space-y-3 sm:space-y-4 max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-banner tracking-wider bg-rose-500/15 text-[#ff4655] border border-rose-500/30">
            <BookOpen className="w-3.5 h-3.5" />
            <span>MANHWA VIP SHELF</span>
          </div>

          <h1 className={`font-comic text-4xl sm:text-5xl lg:text-[74px] tracking-tight leading-[1] sm:leading-[0.96] ${
            isDarkMode ? 'text-white comic-shadow-dark' : 'text-slate-950'
          }`}>
            {isCaughtUp ? (
              <span>YOU'RE ALL<br /><span className="text-[#ff4655]">CAUGHT UP.</span></span>
            ) : (
              <span>CATCH UP<br /><span className="text-[#ff4655]">{unreadChaptersCount} CHAPTERS</span></span>
            )}
          </h1>

          <p className={`text-xs sm:text-base font-medium ${isDarkMode ? 'text-[#8a8f9f]' : 'text-slate-600'}`}>
            {trackedCount} series tracked, {newDiscoveriesCount} new titles to look at.
          </p>
        </div>

        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full max-w-[320px] sm:max-w-none sm:w-96 h-64 sm:h-80 shrink-0 mx-auto lg:mx-0 flex items-center justify-center carousel-stage touch-pan-y"
        >
          <div className="relative w-36 h-52 sm:w-48 sm:h-64 flex items-center justify-center">
            {displayItems.slice(0, 8).map((item, idx) => {
              let offset = (idx - activeIndex) % displayItems.length;
              if (offset < -Math.floor(displayItems.length / 2)) offset += displayItems.length;
              else if (offset > Math.floor(displayItems.length / 2)) offset -= displayItems.length;

              const isActive = offset === 0;
              const isLeft = offset === -1;
              const isRight = offset === 1;
              const isVisible = Math.abs(offset) <= 1;

              let transformStyle = '';
              let zIndex = 10;
              let opacity = 0;
              let filter = 'blur(1px) brightness(0.65)';

              if (isActive) {
                transformStyle = 'translate3d(0, 0, 40px) scale(1.06) rotateZ(1deg)';
                zIndex = 30; opacity = 1; filter = 'none';
              } else if (isLeft) {
                transformStyle = 'translate3d(-60%, 4%, -30px) scale(0.86) rotateY(15deg) rotateZ(-8deg)';
                zIndex = 20; opacity = 0.8; filter = 'brightness(0.75)';
              } else if (isRight) {
                transformStyle = 'translate3d(60%, 4%, -30px) scale(0.86) rotateY(-15deg) rotateZ(8deg)';
                zIndex = 20; opacity = 0.8; filter = 'brightness(0.75)';
              } else {
                transformStyle = `translate3d(${offset > 0 ? 100 : -100}%, 10%, -100px) scale(0.6)`;
                zIndex = 5; opacity = 0;
              }

              return (
                <div
                  key={item.id}
                  onClick={() => { if (isLeft) handlePrev(); if (isRight) handleNext(); }}
                  style={{ transform: transformStyle, zIndex, opacity, filter, pointerEvents: isVisible ? 'auto' : 'none' }}
                  className={`absolute inset-0 rounded-xl overflow-hidden carousel-card-smooth cursor-pointer shadow-2xl ${
                    isActive ? 'border-[2px] sm:border-[2.5px] border-white ring-4 ring-[#ff4655]/50 shadow-rose-950/70' : 'border-2 border-white/70 shadow-black/80'
                  }`}
                  title={item.title}
                >
                  <img
                    src={item.cover_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  {isActive && (
                    <div className="absolute bottom-1.5 inset-x-1.5 sm:bottom-2 sm:inset-x-2 bg-black/85 backdrop-blur-sm rounded-lg py-1 px-1.5 text-center">
                      <p className="text-[10px] sm:text-[11px] font-bold text-white truncate font-sans">{item.title}</p>
                      <p className="text-[9px] sm:text-[10px] font-mono text-rose-400 font-semibold">Ch. {item.last_read_chapter}/{item.latest_chapter}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="absolute -bottom-6 inset-x-0 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2">
              <button onClick={handlePrev} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                isDarkMode ? 'bg-[#181a24] text-zinc-300 hover:bg-[#ff4655] hover:text-white border border-[#2b2f42]' : 'bg-white text-slate-700 hover:bg-[#ff4655] hover:text-white border border-slate-300'
              }`} aria-label="Previous">
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                {displayItems.slice(0, 6).map((_, i) => (
                  <button key={i} onClick={() => setActiveIndex(i)} className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === activeIndex ? 'w-5 bg-[#ff4655]' : isDarkMode ? 'w-1.5 bg-zinc-700 hover:bg-zinc-500' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                  }`} aria-label={`Slide ${i + 1}`} />
                ))}
              </div>

              <button onClick={handleNext} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                isDarkMode ? 'bg-[#181a24] text-zinc-300 hover:bg-[#ff4655] hover:text-white border border-[#2b2f42]' : 'bg-white text-slate-700 hover:bg-[#ff4655] hover:text-white border border-slate-300'
              }`} aria-label="Next">
                <ChevronRight className="w-4 h-4" />
              </button>

              <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} className={`p-1 rounded-md cursor-pointer ml-1 ${isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-700'}`} title={isAutoPlaying ? 'Pause' : 'Play'}>
                {isAutoPlaying ? <Pause className="w-3 h-3 text-[#ff4655]" /> : <Play className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
