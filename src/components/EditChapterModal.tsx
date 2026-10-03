import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { ManhwaItem } from '../types';

interface EditChapterModalProps {
  item: ManhwaItem | null;
  onClose: () => void;
  onSave: (id: string, chapterNum: number, latestChapter: number) => void;
}

export const EditChapterModal: React.FC<EditChapterModalProps> = ({ item, onClose, onSave }) => {
  const [val, setVal] = useState<number>(0);

  useEffect(() => { if (item) setVal(Number(item.last_read_chapter) || 0); }, [item]);

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(item.id, Number(val), Number(item.latest_chapter) || 1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="font-bold text-base text-white">Set Read Chapter</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <p className="text-xs text-zinc-400">Updating read progress for <strong className="text-white">{item.title}</strong></p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Chapter Number:</span>
              <span className="font-mono">Latest: Ch. {item.latest_chapter}</span>
            </div>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={val}
              onChange={(e) => setVal(Number(e.target.value))}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 font-mono text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          <button type="button" onClick={() => setVal(Number(item.latest_chapter) || 1)} className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 font-mono">
            Set to Latest (Ch. {item.latest_chapter})
          </button>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white">Cancel</button>
            <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md">
              <Check className="w-4 h-4" />
              <span>Save Progress</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
