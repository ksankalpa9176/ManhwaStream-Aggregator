export type SourceId = 'all' | 'arenascan' | 'kingofshojo' | 'roliascan';

export interface SourceReleaseData {
  chapter: number;
  chapter_text?: string;
  url: string;
  updated_at: string;
  status?: 'active' | 'stale';
  is_series_direct?: boolean;
}

export interface ManhwaItem {
  id: string;
  title: string;
  canonical_slug: string;
  alternate_titles?: string[];
  cover_url?: string;
  last_read_chapter: number;
  has_unread?: boolean;
  total_chapters?: number;
  sources: Partial<Record<SourceId, SourceReleaseData>>;
  latest_chapter: number;
  fastest_source_id: SourceId;
  latest_chapter_url: string;
  latest_chapter_text?: string;
  series_url?: string;
  updated_at?: string;
  created_at?: string;
}

export interface DiscoveryItem {
  id: string;
  title: string;
  source_id: SourceId;
  source_name: string;
  latest_chapter: number;
  total_chapters: number;
  latest_chapter_text?: string;
  latest_chapter_url?: string;
  series_url?: string;
  cover_url?: string;
  is_new?: boolean;
  created_at?: string;
}

export interface UserAccount {
  uid: string;
  username: string;
  email: string;
  preferredSource: SourceId;
  sequentialCatchUp: boolean;
  createdAt: string;
}

export interface CatchUpInfo {
  isUnread: boolean;
  chaptersBehind: number;
  nextChapter: number;
  latestChapter: number;
  nextChapterUrl: string;
  latestChapterUrl: string;
  activeSourceId: SourceId;
  activeSourceName: string;
  isSeriesPageDirect?: boolean;
  unreadChaptersList: number[];
  availableSources: {
    sourceId: SourceId;
    sourceName: string;
    chapter: number;
    url: string;
    isFastest: boolean;
  }[];
}
