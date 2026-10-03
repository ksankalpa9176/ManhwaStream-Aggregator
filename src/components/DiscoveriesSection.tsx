import React, { useState } from 'react';
import { DiscoveryItem } from '../types';
import { Plus, X, ExternalLink, RotateCcw, Sparkles } from 'lucide-react';
import { KNOWN_SOURCES } from '../utils/chapterUrl';

interface DiscoveriesSectionProps {
  discoveries: DiscoveryItem[];
  onAddDiscovery: (item: DiscoveryItem) => void;
  onRemoveDiscovery: (id: string, title: string) => void;
  onRestoreAllDismissed: () => void;
  isDarkMode?: boolean;
}

export const DiscoveriesSection: React.FC<DiscoveriesSectionProps> = ({
  discoveries, onAddDiscovery, onRemoveDiscovery, onRestoreAllDismissed, isDarkMode = true
}) => {
  const [isResetting, setIsResetting] = useState(false);

  const handleResetClick = () => {
    setIsResetting(true);
    onRestoreAllDismissed();
    setTimeout(() => setIsResetting(false), 500);
  };

  return (
    <section className={`border-t pt-8 sm:pt-10 space-y-4 sm:space-y-5 transition-colors ${isDarkMode ? 'border-[#1c1f2e]' : 'border-slate-200'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`font-comic text-xl sm:text-2xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              FRESH DROPS & DISCOVERIES (&lt; 10 CHAPTERS)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/15 text-[#ff4655] border border-rose-500/30 flex items-center gap-1 font-semibold shrink-0">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Mixed Sites</span>
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
            Newly launched titles. Click <strong>Track</strong> to add to your shelf.
          </p>
        </div>

        <button
          onClick={handleResetClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 cursor-pointer shadow-sm ${
            isDarkMode ? 'text-zinc-300 hover:text-white bg-[#12141c] hover:bg-[#1a1c26] border-[#222536]' : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border-slate-200'
          }`}
          title="Restore all dismissed discoveries"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-[#ff4655]' : 'text-rose-500'}`} />
          <span>{isResetting ? 'Restoring...' : 'Reset Dismissed'}</span>
        </button>
      </div>

      {discoveries.length === 0 ? (
        <div className={`py-12 px-4 text-center text-xs rounded-xl space-y-3 border shadow-sm ${
          isDarkMode ? 'text-zinc-500 bg-[#12141c] border-[#222536]' : 'text-slate-400 bg-white border-slate-200'
        }`}>
          <p className={`font-medium text-sm ${isDarkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
            No fresh drops right now. Check back after the next scrape cycle.
          </p>
          <button
            onClick={handleResetClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ff4655] hover:bg-[#e03847] text-white text-xs font-semibold shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore All Dismissed</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {discoveries.map((d) => {
            const fallbackCover = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80';
            const coverSrc = d.cover_url || fallbackCover;
            const sourceColor = KNOWN_SOURCES[d.source_id]?.defaultColor || 'text-zinc-300 bg-zinc-800';

            return (
              <div
                key={d.id}
                className={`group relative rounded-xl p-3.5 flex gap-3.5 items-center justify-between transition-all border shadow-sm ${
                  isDarkMode ? 'bg-[#12141c] hover:bg-[#161824] border-[#222536] hover:border-[#33374d]' : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => onRemoveDiscovery(d.id, d.title)}
                  className={`absolute top-2 right-2 p-1.5 rounded-md transition-colors cursor-pointer ${
                    isDarkMode ? 'text-zinc-500 hover:text-[#ff4655] hover:bg-[#1a1c26]' : 'text-slate-400 hover:text-[#ff4655] hover:bg-slate-100'
                  }`}
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <img
                  src={coverSrc}
                  alt={d.title}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackCover; }}
                  className={`w-14 h-20 object-cover rounded-lg shrink-0 border shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                    isDarkMode ? 'bg-zinc-900 border-[#262938]' : 'bg-slate-100 border-slate-200'
                  }`}
                />

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border font-semibold ${sourceColor}`}>
                      {d.source_name}
                    </span>
                    <span className={`text-[11px] font-mono ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {d.total_chapters || d.latest_chapter} Ch.
                    </span>
                  </div>

                  <h4 className={`font-bold text-xs sm:text-sm truncate mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`} title={d.title}>
                    {d.title}
                  </h4>

                  <div className="flex items-center gap-2.5 mt-2">
                    <button
                      onClick={() => onAddDiscovery(d)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#ff4655] hover:bg-[#e03847] text-white flex items-center gap-1 whitespace-nowrap active:scale-95 cursor-pointer shadow-sm transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Track</span>
                    </button>
                    {d.latest_chapter_url && (
                      <a
                        href={d.latest_chapter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-[11px] flex items-center gap-0.5 whitespace-nowrap ${
                          isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <span>{d.source_id === 'roliascan' ? 'Series Hub' : `Ch. ${d.latest_chapter}`}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
