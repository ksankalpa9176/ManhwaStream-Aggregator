import { supabase } from './supabase';
import { ManhwaItem, SourceId } from '../types';

const CACHE_KEY = (uid: string) => `manhwa_tracker_watchlist_${uid}`;

export function loadCachedWatchlist(uid: string): ManhwaItem[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY(uid));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(e);
  }
  return [];
}

export function saveCachedWatchlist(uid: string, items: ManhwaItem[]): void {
  try {
    localStorage.setItem(CACHE_KEY(uid), JSON.stringify(items));
  } catch (e) {
    console.warn(e);
  }
}

function rowToManhwa(row: any): ManhwaItem {
  let computedLatest = Number(row.latest_chapter) || 0;
  const sources = row.sources || {};
  Object.values(sources).forEach((s: any) => {
    if (s && typeof s.chapter === 'number' && s.chapter > computedLatest) {
      computedLatest = s.chapter;
    }
  });
  if (!computedLatest || computedLatest < 1) computedLatest = 1;

  return {
    id: row.id,
    title: row.title,
    canonical_slug: row.canonical_slug,
    latest_chapter: computedLatest,
    last_read_chapter: Number(row.last_read_chapter) || 0,
    fastest_source_id: (row.fastest_source_id as SourceId) || 'arenascan',
    latest_chapter_text: row.latest_chapter_text || `Chapter ${computedLatest}`,
    latest_chapter_url: row.latest_chapter_url || '',
    series_url: row.series_url,
    cover_url: row.cover_url,
    has_unread: row.has_unread ?? true,
    sources,
    total_chapters: row.total_chapters,
    updated_at: row.updated_at,
    created_at: row.created_at,
  };
}

export async function fetchWatchlist(uid: string): Promise<ManhwaItem[]> {
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', uid)
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn('Watchlist fetch failed:', error.message);
    return loadCachedWatchlist(uid);
  }

  const items = (data || []).map(rowToManhwa);
  saveCachedWatchlist(uid, items);
  return items;
}

export async function upsertWatchlistItem(
  uid: string,
  item: Partial<ManhwaItem>
): Promise<ManhwaItem | null> {
  const id = item.id || (item.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'series');
  const safeLatest = Math.max(1, Number(item.latest_chapter) || 1);

  const row = {
    user_id: uid,
    id,
    title: item.title || 'Untitled',
    canonical_slug: item.canonical_slug || id,
    latest_chapter: safeLatest,
    last_read_chapter: Number(item.last_read_chapter) || 0,
    fastest_source_id: item.fastest_source_id || 'arenascan',
    latest_chapter_text: item.latest_chapter_text || `Chapter ${safeLatest}`,
    latest_chapter_url: item.latest_chapter_url || '',
    series_url: item.series_url || '',
    cover_url: item.cover_url || '',
    has_unread: item.has_unread ?? true,
    sources: item.sources || {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('watchlist')
    .upsert(row, { onConflict: 'user_id,id' })
    .select()
    .single();

  if (error) {
    console.warn('Upsert failed:', error.message);
    return null;
  }
  return rowToManhwa(data);
}

export async function updateReadProgress(
  uid: string,
  manhwaId: string,
  chapterNum: number,
  latestChapter: number
): Promise<void> {
  const { error } = await supabase
    .from('watchlist')
    .update({
      last_read_chapter: chapterNum,
      has_unread: latestChapter > chapterNum,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', uid)
    .eq('id', manhwaId);

  if (error) console.warn('Update progress failed:', error.message);
}

export async function deleteWatchlistItem(uid: string, manhwaId: string): Promise<void> {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', uid)
    .eq('id', manhwaId);

  if (error) console.warn('Delete failed:', error.message);
}
