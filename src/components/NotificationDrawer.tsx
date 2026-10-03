import React from 'react';
import { X, CheckCheck, Bell, ArrowRight } from 'lucide-react';
import { ManhwaItem } from '../types';
import { calculateCatchUpInfo } from '../utils/chapterUrl';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: ManhwaItem[];
  onReadChapter: (item: ManhwaItem, chapterNum: number) => void;
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, items, onReadChapter, onMarkAllRead }) => {
  if (!isOpen) return null;

  const unreadItems = items
    .map((item) => ({ item, catchUp: calculateCatchUpInfo(item) }))
    .filter(({ catchUp }) => catchUp.isUnread);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col shadow-2xl">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Release Notifications</h3>
              <p className="text-xs text-zinc-400">{unreadItems.length} series pending catch-up</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadItems.length > 0 && (
              <button onClick={onMarkAllRead} className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 flex items-center gap-1" title="Mark all caught up">
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {unreadItems.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <p className="text-sm font-semibold text-zinc-300">All caught up!</p>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">No unread releases. New chapters will appear here.</p>
            </div>
          ) : (
            unreadItems.map(({ item, catchUp }) => {
              const fallbackCover = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80';
              return (
                <div key={item.id} className="p-3.5 rounded-2xl border border-rose-900/30 bg-zinc-900/70 hover:bg-zinc-900 transition-colors flex gap-3 items-center group">
                  <img src={item.cover_url || fallbackCover} alt={item.title} onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackCover; }} className="w-12 h-16 object-cover rounded-xl bg-zinc-950 shrink-0 border border-zinc-800" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs text-white truncate" title={item.title}>{item.title}</h4>
                      <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-900/50 shrink-0">{catchUp.chaptersBehind} Behind</span>
                    </div>
                    <p className="text-[11px] font-mono text-zinc-400 mt-1">Latest: Ch. {catchUp.latestChapter} · Read: Ch. {item.last_read_chapter || 0}</p>
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-zinc-800/60">
                      <button onClick={() => onReadChapter(item, catchUp.nextChapter)} className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1">
                        <span>Read Next: Ch. {catchUp.nextChapter}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      {catchUp.chaptersBehind > 1 && (
                        <button onClick={() => onReadChapter(item, catchUp.latestChapter)} className="text-[11px] text-zinc-500 hover:text-zinc-300">Jump to Ch. {catchUp.latestChapter}</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span className="font-mono text-[11px]">Sequential reading enabled</span>
          <button onClick={onClose} className="text-zinc-400 hover:text-white font-medium">Close</button>
        </div>
      </aside>
    </>
  );
};
