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
  // Discoveries = recent updates from the latest scrape, filtered to fresh titles (<= 10 chapters)
  const colRef = collection(scraperDb, 'manhwa');
  const q = query(colRef, orderBy('updated_at', 'desc'), limit(500));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: DiscoveryItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();

        // Only include titles marked recent by the last scrape
        if (data.is_recent !== true) return;

        const latest = Number(data.latest_chapter) || 0;
        if (latest < 1 || latest > 10) return;

        const sources = data.sources || {};
        const sourceKeys = Object.keys(sources);
        const primarySource = (data.fastest_source_id || sourceKeys[0] || 'arenascan') as SourceId;

        const sourceNames: Record<string, string> = {
          arenascan: 'ArenaScan',
          kingofshojo: 'King of Shojo',
          roliascan: 'RoliaScan',
        };

        items.push({
          id: doc.id,
          title: data.title || doc.id,
          source_id: primarySource,
          source_name: sourceNames[primarySource] || primarySource,
          latest_chapter: latest,
          total_chapters: latest,
          latest_chapter_text: data.latest_chapter_text || `Chapter ${latest}`,
          latest_chapter_url: data.series_url || '',
          series_url: data.series_url || '',
          cover_url: data.cover_url || '',
          is_new: true,
          created_at: data.updated_at,
        });

        if (items.length >= 50) return;
      });
      onUpdate(items);
    },
    (err) => {
      console.warn('Discoveries subscription failed:', err);
      onUpdate([]);
    }
  );
}
