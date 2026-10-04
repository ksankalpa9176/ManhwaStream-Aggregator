import React from 'react';
import { ManhwaItem, SourceId } from '../types';
import { calculateCatchUpInfo } from '../utils/chapterUrl';
import { ExternalLink, Trash2, CheckCircle, Sparkles } from 'lucide-react';

interface ManhwaRowItemProps {
  item: ManhwaItem;
  preferredSource: SourceId;
  sequentialMode: boolean;
  onReadChapter: (item: ManhwaItem, chapterNum: number, targetSourceId?: SourceId) => void;
  onStepChapter: (id: string, delta: number) => void;
  onEditReadChapter: (item: ManhwaItem) => void;
  onDelete: (id: string, title: string) => void;
  onCaughtUp: (item: ManhwaItem) => void;
  onReadLatest: (item: ManhwaItem) => void;
  isDarkMode?: boolean;
}

export const ManhwaRowItem: React.FC<ManhwaRowItemProps> = ({
  item, preferredSource, sequentialMode, onReadChapter, onStepChapter, onEditReadChapter, onDelete, onCaughtUp, onReadLatest, isDarkMode = true
}) => {
  const catchUp = calculateCatchUpInfo(item, preferredSource);
  const isUnread = catchUp.isUnread;
  const chaptersBehind = catchUp.chaptersBehind;
  const currentRead = Number(item.last_read_chapter) || 0;
  const latestCh = catchUp.latestChapter;
  const primaryChapter = sequentialMode ? catchUp.nextChapter : latestCh;
  const progressPercent = latestCh > 0 ? Math.min(100, Math.round((currentRead / latestCh) * 100)) : 0;
  const fallbackCover = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80';
  const coverSrc = item.cover_url || fallbackCover;

  return (
    <article className={`group relative rounded-xl p-3.5 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5 transition-all border shadow-sm ${
      isDarkMode ? 'bg-[#12141c] hover:bg-[#151722] border-[#222536] hover:border-[#383d54]' : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300'
    }`}>

      <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <div
          onClick={() => onReadLatest(item)}
          className={`relative w-14 h-20 sm:w-16 sm:h-24 rounded-lg overflow-hidden border shrink-0 cursor-pointer shadow-md ${
            isDarkMode ? 'bg-zinc-900 border-[#2b2f42] group-hover:border-[#ff4655]' : 'bg-slate-100 border-slate-300 group-hover:border-[#ff4655]'
          }`}
          title={`Open ${catchUp.activeSourceName} series page`}
        >
          <img
            src={coverSrc}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackCover; }}
          />
          {isUnread ? (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#ff4655] ring-2 ring-zinc-950 animate-pulse shadow-sm" />
          ) : (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500/90 text-white flex items-center justify-center text-[9px] shadow-sm">✓</span>
          )}
          <div className="absolute bottom-0 inset-x-0 bg-black/85 backdrop-blur-sm py-0.5 text-center">
            <span className="text-[8.5px] sm:text-[9px] font-mono font-bold text-zinc-200">{currentRead}/{latestCh}</span>
          </div>
        </div>

        <div className="min-w-0 space-y-1 sm:space-y-1.5 flex-1">
          <h3
            onClick={() => onReadLatest(item)}
            className={`font-bold text-sm sm:text-lg leading-snug line-clamp-2 cursor-pointer transition-colors ${
              isDarkMode ? 'text-white hover:text-[#ff4655]' : 'text-slate-900 hover:text-[#ff4655]'
            }`}
            title={item.title}
          >
            {item.title}
          </h3>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
            {isUnread ? (
              <span className="text-[#ff4655] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff4655] shrink-0" />
                <span className="truncate">{chaptersBehind} unread (Ch. {catchUp.nextChapter}–{catchUp.latestChapter}) · on {catchUp.activeSourceName}</span>
              </span>
            ) : (
              <span className={`flex items-center gap-1 font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Caught up at ch. {currentRead}</span>
              </span>
            )}

            {catchUp.isSeriesPageDirect && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-amber-500 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 sm:px-2 py-0.5 rounded-md">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>RoliaScan: Opens series page</span>
              </span>
            )}
          </div>

          {chaptersBehind > 1 && (
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <span className={`text-[10px] font-mono ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Queue:</span>
              {catchUp.unreadChaptersList.slice(0, 4).map((ch) => (
                <button
                  key={ch}
                  onClick={() => onReadChapter(item, ch, catchUp.activeSourceId)}
                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-semibold transition-all ${
                    ch === catchUp.nextChapter
                      ? 'bg-[#ff4655] text-white shadow-sm ring-1 ring-rose-400'
                      : isDarkMode ? 'bg-[#1c1e28] hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title={`Open Chapter ${ch}`}
                >
                  Ch. {ch} {ch === catchUp.nextChapter ? '★' : ''}
                </button>
              ))}
              {catchUp.unreadChaptersList.length > 4 && (
                <span className={`text-[10px] font-mono ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                  +{catchUp.unreadChaptersList.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`flex items-center justify-between lg:justify-end gap-2.5 sm:gap-4 shrink-0 pt-2.5 lg:pt-0 border-t lg:border-t-0 w-full lg:w-auto ${
        isDarkMode ? 'border-[#222536]' : 'border-slate-200'
      }`}>

        <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial lg:w-40 min-w-0">
          <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#1e202b]' : 'bg-slate-200'}`}>
            <div className="h-full bg-gradient-to-r from-rose-600 via-[#ff4655] to-amber-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className={`text-[11px] sm:text-xs font-mono tabular-nums font-semibold shrink-0 ${isDarkMode ? 'text-[#8a8f9f]' : 'text-slate-600'}`}>
            {currentRead}/{latestCh}
          </span>
        </div>

        <div className="flex items-center gap-1 font-mono text-xs shrink-0">
          <button onClick={() => onStepChapter(item.id, -1)} title="Step -1" className={`w-7 h-7 flex items-center justify-center rounded-md font-bold active:scale-90 transition-all cursor-pointer ${
            isDarkMode ? 'bg-[#1c1e28] hover:bg-[#252837] border border-[#2b2f42] text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700'
          }`}>-</button>
          <button onClick={() => onStepChapter(item.id, 1)} title="Step +1" className={`w-7 h-7 flex items-center justify-center rounded-md font-bold active:scale-90 transition-all cursor-pointer ${
            isDarkMode ? 'bg-[#1c1e28] hover:bg-[#252837] border border-[#2b2f42] text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700'
          }`}>+</button>
          <button onClick={() => onEditReadChapter(item)} title="Edit chapter" className={`px-2 h-7 flex items-center justify-center rounded-md font-medium text-[11px] sm:text-xs transition-colors cursor-pointer ${
            isDarkMode ? 'bg-[#1c1e28] hover:bg-[#252837] border border-[#2b2f42] text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700'
          }`}>Edit</button>
        </div>

        {isUnread && (
          <button
            onClick={() => onReadLatest(item)}
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3.5 h-7 rounded-md text-[11px] sm:text-xs font-semibold bg-[#ff4655] hover:bg-[#e03847] text-white shadow-sm active:scale-95 whitespace-nowrap transition-colors cursor-pointer shrink-0"
            title={`Open ${catchUp.activeSourceName} series page (sets progress to latest)`}
          >
            <span>Read Latest</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}

        {isUnread && (
          <button
            onClick={() => onCaughtUp(item)}
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3 h-7 rounded-md text-[11px] sm:text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm active:scale-95 whitespace-nowrap transition-colors cursor-pointer shrink-0"
            title="Mark all chapters as read"
          >
            <CheckCircle className="w-3 h-3" />
            <span className="hidden sm:inline">Caught Up</span>
          </button>
        )}

        <button
          onClick={() => onDelete(item.id, item.title)}
          className={`p-1.5 transition-colors rounded-md cursor-pointer shrink-0 ${
            isDarkMode ? 'text-zinc-600 hover:text-[#ff4655] hover:bg-zinc-800' : 'text-slate-400 hover:text-[#ff4655] hover:bg-slate-100'
          }`}
          title="Remove"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
};
