import React, { useState } from 'react';
import { X, Link2, Check, AlertCircle } from 'lucide-react';
import { ManhwaItem, SourceId } from '../types';
import { toCanonicalSlug } from '../utils/chapterUrl';

interface AddCustomUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Partial<ManhwaItem>) => Promise<void> | void;
}

interface ParsedUrl {
  sourceId: SourceId;
  sourceName: string;
  slug: string;
  seriesUrl: string;
  suggestedChapterUrl: string;
}

function parseSourceUrl(rawUrl: string): ParsedUrl | null {
  const url = rawUrl.trim();
  if (!url) return null;

  if (url.includes('arenascan.com')) {
    const mangaMatch = url.match(/arenascan\.com\/manga\/([^/?#]+)/);
    if (mangaMatch) {
      const slug = mangaMatch[1];
      return { sourceId: 'arenascan', sourceName: 'ArenaScan', slug, seriesUrl: `https://arenascan.com/manga/${slug}/`, suggestedChapterUrl: `https://arenascan.com/${slug}-1/` };
    }
    const chapterMatch = url.match(/arenascan\.com\/([^/?#]+?)-(\d+(?:\.\d+)?)\/?$/);
    if (chapterMatch) {
      const slug = chapterMatch[1];
      return { sourceId: 'arenascan', sourceName: 'ArenaScan', slug, seriesUrl: `https://arenascan.com/manga/${slug}/`, suggestedChapterUrl: `https://arenascan.com/${slug}-${chapterMatch[2]}/` };
    }
  }

  if (url.includes('kingofshojo.com')) {
    const mangaMatch = url.match(/kingofshojo\.com\/manga\/([^/?#]+)/);
    if (mangaMatch) {
      const slug = mangaMatch[1];
      return { sourceId: 'kingofshojo', sourceName: 'King of Shojo', slug, seriesUrl: `https://kingofshojo.com/manga/${slug}/`, suggestedChapterUrl: `https://kingofshojo.com/${slug}-chapter-1/` };
    }
    const chapterMatch = url.match(/kingofshojo\.com\/([^/?#]+?)-chapter-(\d+(?:\.\d+)?)\/?$/);
    if (chapterMatch) {
      const slug = chapterMatch[1];
      return { sourceId: 'kingofshojo', sourceName: 'King of Shojo', slug, seriesUrl: `https://kingofshojo.com/manga/${slug}/`, suggestedChapterUrl: `https://kingofshojo.com/${slug}-chapter-${chapterMatch[2]}/` };
    }
  }

  if (url.includes('roliascan.com')) {
    const mangaMatch = url.match(/roliascan\.com\/manga\/([^/?#]+)/);
    if (mangaMatch) {
      const slug = mangaMatch[1];
      return { sourceId: 'roliascan', sourceName: 'RoliaScan', slug, seriesUrl: `https://roliascan.com/manga/${slug}/`, suggestedChapterUrl: `https://roliascan.com/manga/${slug}/` };
    }
  }

  return null;
}

export const AddCustomUrlModal: React.FC<AddCustomUrlModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [latestChapter, setLatestChapter] = useState(1);
  const [readChapter, setReadChapter] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const parsed = parseSourceUrl(url);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedUrl = parseSourceUrl(url);
    if (!parsedUrl) {
      setError("Could not recognize this URL. Must be from ArenaScan, King of Shojo, or RoliaScan.");
      return;
    }

    const finalTitle = title.trim() || parsedUrl.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const canonicalSlug = toCanonicalSlug(finalTitle);
    const latest = Math.max(1, Number(latestChapter) || 1);
    const read = Math.max(0, Number(readChapter) || 0);

    const item: Partial<ManhwaItem> = {
      id: canonicalSlug,
      title: finalTitle,
      canonical_slug: canonicalSlug,
      latest_chapter: latest,
      last_read_chapter: read,
      fastest_source_id: parsedUrl.sourceId,
      latest_chapter_text: `Chapter ${latest}`,
      latest_chapter_url: parsedUrl.suggestedChapterUrl,
      series_url: parsedUrl.seriesUrl,
      has_unread: latest > read,
      sources: {
        [parsedUrl.sourceId]: {
          chapter: latest,
          chapter_text: `Chapter ${latest}`,
          url: parsedUrl.suggestedChapterUrl,
          updated_at: new Date().toISOString(),
          status: 'active',
        },
      },
    };

    setSaving(true);
    try {
      await onAdd(item);
      onClose();
      setUrl(''); setTitle(''); setLatestChapter(1); setReadChapter(0);
    } catch {
      setError('Failed to add. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <Link2 className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-lg text-white">Track Any Title by URL</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          Paste a series URL from ArenaScan, King of Shojo, or RoliaScan. If the scraper hasn't found it yet, you can still track it manually.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-zinc-300 mb-1">Series URL *</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://arenascan.com/manga/omniscient-readers-viewpoint/"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          {parsed && (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Recognized: {parsed.sourceName}</span>
              </div>
              <p className="text-zinc-400 font-mono text-[11px] break-all">Series: {parsed.seriesUrl}</p>
              <p className="text-zinc-400 font-mono text-[11px] break-all">Chapter: {parsed.suggestedChapterUrl}</p>
            </div>
          )}

          {url && !parsed && (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="text-rose-300">Unknown URL. Must be from ArenaScan, King of Shojo, or RoliaScan.</span>
            </div>
          )}

          <div>
            <label className="block font-medium text-zinc-300 mb-1">Display Title (optional)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Leave blank to auto-generate" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Latest Chapter</label>
              <input type="number" step="any" min="1" value={latestChapter} onChange={(e) => setLatestChapter(Number(e.target.value))} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 font-mono focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Your Last Read</label>
              <input type="number" step="any" min="0" value={readChapter} onChange={(e) => setReadChapter(Number(e.target.value))} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 font-mono focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          {error && <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs">{error}</div>}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800">Cancel</button>
            <button type="submit" disabled={!parsed || saving} className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? 'Adding...' : 'Add to My Shelf'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
