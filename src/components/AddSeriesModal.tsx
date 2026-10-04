import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { ManhwaItem } from '../types';
import { toSlug } from '../utils/chapterUrl';

interface AddSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Partial<ManhwaItem>) => void;
}

export const AddSeriesModal: React.FC<AddSeriesModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [latestCh, setLatestCh] = useState(1);
  const [readCh, setReadCh] = useState(0);
  const [seriesUrl, setSeriesUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const slug = toSlug(title);
    const latest = Math.max(1, Number(latestCh) || 1);
    const read = Math.max(0, Number(readCh) || 0);
    const arenaChapterUrl = `https://arenascan.com/${slug}-${latest}/`;

    const item: Partial<ManhwaItem> = {
      id: slug,
      title: title.trim(),
      canonical_slug: slug,
      latest_chapter: latest,
      last_read_chapter: read,
      fastest_source_id: 'arenascan',
      latest_chapter_text: `Chapter ${latest}`,
      latest_chapter_url: arenaChapterUrl,
      series_url: seriesUrl.trim() || `https://arenascan.com/manga/${slug}/`,
      cover_url: coverUrl.trim(),
      has_unread: latest > read,
      sources: {
        arenascan: {
          chapter: latest,
          chapter_text: `Chapter ${latest}`,
          series_url: `https://arenascan.com/manga/${slug}/`,
          updated_at: new Date().toISOString(),
          status: 'active',
        },
      },
    };

    onAdd(item);
    onClose();
    setTitle(''); setLatestCh(1); setReadCh(0); setSeriesUrl(''); setCoverUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <Plus className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-lg text-white">Add Series Manually</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-zinc-300 mb-1">Series Title *</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Solo Leveling: Ragnarok" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Latest Chapter</label>
              <input type="number" step="any" required value={latestCh} onChange={(e) => setLatestCh(Number(e.target.value))} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 font-mono focus:outline-none focus:border-rose-500" />
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Your Last Read</label>
              <input type="number" step="any" value={readCh} onChange={(e) => setReadCh(Number(e.target.value))} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 font-mono focus:outline-none focus:border-rose-500" />
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1">Series URL (optional)</label>
            <input type="url" value={seriesUrl} onChange={(e) => setSeriesUrl(e.target.value)} placeholder="https://arenascan.com/manga/solo-leveling-ragnarok/" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-rose-500" />
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1">Cover Image URL (optional)</label>
            <input type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-rose-500" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800">Cancel</button>
            <button type="submit" className="px-5 py-2 font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg transition-all">Add Series</button>
          </div>
        </form>
      </div>
    </div>
  );
};
