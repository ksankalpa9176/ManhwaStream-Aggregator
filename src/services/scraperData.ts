import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { scraperDb } from './firebase';
import { ManhwaItem, DiscoveryItem, SourceId } from '../types';

export function subscribeToScrapedManhwa(
  onUpdate: (items: ManhwaItem[]) => void
): () => void {
  const colRef = collection(scraperDb, 'manhwa');
  const q = query(colRef, orderBy('updated_at', 'desc'), limit(500));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ManhwaItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let computedLatest = Number(data.latest_chapter) || 0;
        const sources = data.sources || {};
        Object.values(sources).forEach((s: any) => {
          if (s && typeof s.chapter === 'number' && s.chapter > computedLatest) {
            computedLatest = s.chapter;
          }
        });
        if (!computedLatest || computedLatest < 1) computedLatest = 1;

        items.push({
          id: doc.id,
          title: data.title || doc.id,
          canonical_slug: data.canonical_slug || doc.id,
          latest_chapter: computedLatest,
          last_read_chapter: 0,
          fastest_source_id: (data.fastest_source_id as SourceId) || 'arenascan',
          latest_chapter_text: data.latest_chapter_text || `Chapter ${computedLatest}`,
          latest_chapter_url: data.latest_chapter_url || '',
          series_url: data.series_url,
          cover_url: data.cover_url,
          has_unread: false,
          sources,
          total_chapters: data.total_chapters,
          updated_at: data.updated_at,
        });
      });
      onUpdate(items);
    },
    (err) => {
      console.warn('Firestore subscription failed:', err);
      onUpdate([]);
    }
  );
}

export function subscribeToDiscoveries(
  onUpdate: (items: DiscoveryItem[]) => void
): () => void {
  const colRef = collection(scraperDb, 'discoveries');
  const q = query(colRef, orderBy('created_at', 'desc'), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: DiscoveryItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const total = Number(data.total_chapters) || Number(data.latest_chapter) || 1;
        if (total > 10) return;

        items.push({
          id: doc.id,
          title: data.title || doc.id,
          source_id: (data.source_id as SourceId) || 'arenascan',
          source_name: data.source_name || 'ArenaScan',
          latest_chapter: Number(data.latest_chapter) || 1,
          total_chapters: total,
          latest_chapter_text: data.latest_chapter_text,
          latest_chapter_url: data.latest_chapter_url,
          series_url: data.series_url,
          cover_url: data.cover_url,
          is_new: data.is_new ?? true,
          created_at: data.created_at,
        });
      });
      onUpdate(items);
    },
    (err) => {
      console.warn('Discoveries subscription failed:', err);
      onUpdate([]);
    }
  );
}
