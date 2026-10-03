import { ManhwaItem, CatchUpInfo, SourceId } from '../types';

export const KNOWN_SOURCES: Record<SourceId, { name: string; domain: string; defaultColor: string }> = {
  all: { name: 'All Sources (Fastest)', domain: 'Aggregated', defaultColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  arenascan: { name: 'ArenaScan', domain: 'arenascan.com', defaultColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  kingofshojo: { name: 'King of Shojo', domain: 'kingofshojo.com', defaultColor: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
  roliascan: { name: 'RoliaScan', domain: 'roliascan.com', defaultColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
};

export function toCanonicalSlug(str: string): string {
  if (!str) return 'manhwa';
  let t = str.toLowerCase();
  t = t.replace(/\[.*?\]|\(.*?\)/g, '');
  t = t.replace(/\b(season|part|vol|volume|chapter|ch)\s*\d+/gi, '');
  t = t.replace(/\b(official|manhwa|manhua|manga|webtoon)\b/gi, '');
  t = t.replace(/^(the|a|an)\s+/i, '');
  t = t.replace(/[''`]/g, '');
  t = t.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return t || 'manhwa';
}

export const toSlug = toCanonicalSlug;

export function formatSuffix(num: number): string {
  const val = Number(num) || 1;
  if (Number.isInteger(val)) return String(val);
  return String(val).replace('.', '-');
}

export function buildChapterUrlForSource(
  sourceId: SourceId,
  item: Partial<ManhwaItem>,
  chapterNum: number
): string {
  const suffix = formatSuffix(chapterNum);
  const slug = item.canonical_slug || toCanonicalSlug(item.title || 'manhwa');

  if (sourceId === 'roliascan') {
    if (item.series_url && item.series_url.includes('roliascan.com')) {
      return item.series_url.replace(/\/chapter-[\d.-]+\/?$/, '/');
    }
    const roliaSourceUrl = item.sources?.roliascan?.url;
    if (roliaSourceUrl) return roliaSourceUrl.replace(/\/chapter-[\d.-]+\/?$/, '/');
    return `https://roliascan.com/manga/${slug}/`;
  }

  if (sourceId === 'kingofshojo') {
    const existing = item.sources?.kingofshojo;
    if (existing?.url && existing.url.includes('-chapter-')) {
      return existing.url.replace(/-chapter-[\d.-]+\/?$/, `-chapter-${suffix}/`);
    }
    return `https://kingofshojo.com/${slug}-chapter-${suffix}/`;
  }

  const existing = item.sources?.arenascan;
  if (existing?.url && existing.url.includes('arenascan.com')) {
    const cleaned = existing.url.replace(/-chapter-/, '-');
    return cleaned.replace(/-[\d.-]+\/?$/, `-${suffix}/`);
  }
  if (item.latest_chapter_url && item.latest_chapter_url.includes('arenascan.com')) {
    const cleaned = item.latest_chapter_url.replace(/-chapter-/, '-');
    return cleaned.replace(/-[\d.-]+\/?$/, `-${suffix}/`);
  }
  return `https://arenascan.com/${slug}-${suffix}/`;
}

export function calculateCatchUpInfo(
  item: ManhwaItem,
  preferredSource: SourceId = 'all'
): CatchUpInfo {
  const read = Number(item.last_read_chapter) || 0;
  const sources = item.sources || {};

  const availableSources: CatchUpInfo['availableSources'] = [];
  let maxFoundChapter = 0;
  let fastestSourceId: SourceId = item.fastest_source_id || 'arenascan';

  (Object.keys(sources) as SourceId[]).forEach((srcId) => {
    const data = sources[srcId];
    if (data && typeof data.chapter === 'number' && data.chapter > 0) {
      if (data.chapter > maxFoundChapter) {
        maxFoundChapter = data.chapter;
        fastestSourceId = srcId;
      }
      availableSources.push({
        sourceId: srcId,
        sourceName: KNOWN_SOURCES[srcId]?.name || srcId,
        chapter: data.chapter,
        url: data.url,
        isFastest: false,
      });
    }
  });

  const legacyLatest = Math.max(Number(item.latest_chapter) || 0, maxFoundChapter, 1);

  if (availableSources.length === 0) {
    maxFoundChapter = legacyLatest;
    availableSources.push({
      sourceId: fastestSourceId,
      sourceName: KNOWN_SOURCES[fastestSourceId]?.name || 'ArenaScan',
      chapter: legacyLatest,
      url: item.latest_chapter_url || buildChapterUrlForSource(fastestSourceId, item, legacyLatest),
      isFastest: true,
    });
  } else {
    if (legacyLatest > maxFoundChapter) maxFoundChapter = legacyLatest;
    availableSources.forEach((s) => {
      s.isFastest = s.chapter === maxFoundChapter;
    });
  }

  let targetSourceId: SourceId = fastestSourceId;
  let targetLatestChapter = maxFoundChapter;

  if (preferredSource !== 'all') {
    const userSelected = sources[preferredSource];
    if (userSelected && userSelected.chapter > 0) {
      targetSourceId = preferredSource;
      targetLatestChapter = userSelected.chapter;
    } else {
      targetSourceId = preferredSource;
      targetLatestChapter = Math.max(sources.arenascan?.chapter || 0, legacyLatest, 1);
    }
  }

  const isUnread = Boolean(item.has_unread || targetLatestChapter > read);
  let nextChapter = targetLatestChapter;
  const unreadChaptersList: number[] = [];

  if (read < targetLatestChapter) {
    nextChapter = read <= 0 ? 1 : Math.floor(read) + 1;
    for (let ch = nextChapter; ch <= targetLatestChapter; ch++) {
      unreadChaptersList.push(ch);
      if (unreadChaptersList.length >= 100) break;
    }
  }

  const chaptersBehind = Math.max(0, Math.round(targetLatestChapter - read));
  const isSeriesPageDirect = targetSourceId === 'roliascan';

  return {
    isUnread,
    chaptersBehind,
    nextChapter: Math.min(nextChapter, targetLatestChapter),
    latestChapter: targetLatestChapter,
    nextChapterUrl: buildChapterUrlForSource(targetSourceId, item, Math.min(nextChapter, targetLatestChapter)),
    latestChapterUrl: buildChapterUrlForSource(targetSourceId, item, targetLatestChapter),
    activeSourceId: targetSourceId,
    activeSourceName: KNOWN_SOURCES[targetSourceId]?.name || targetSourceId,
    isSeriesPageDirect,
    unreadChaptersList,
    availableSources,
  };
}

export function buildChapterUrl(item: Partial<ManhwaItem>, chapterNum: number): string {
  const sourceId = item.fastest_source_id || 'arenascan';
  return buildChapterUrlForSource(sourceId, item, chapterNum);
}
