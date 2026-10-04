import React, { useState, useEffect } from 'react';
import { ManhwaItem, DiscoveryItem, UserAccount, SourceId } from './types';
import { fetchCurrentUser, onAuthStateChange, updatePreferredSource } from './services/auth';
import {
  fetchWatchlist,
  upsertWatchlistItem,
  updateReadProgress,
  deleteWatchlistItem,
  loadCachedWatchlist,
  saveCachedWatchlist,
} from './services/userWatchlist';
import { subscribeToDiscoveries } from './services/scraperData';
import { calculateCatchUpInfo, buildChapterUrlForSource, toCanonicalSlug, KNOWN_SOURCES } from './utils/chapterUrl';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ManhwaRowItem } from './components/ManhwaRowItem';
import { DiscoveriesSection } from './components/DiscoveriesSection';
import { AddSeriesModal } from './components/AddSeriesModal';
import { AddCustomUrlModal } from './components/AddCustomUrlModal';
import { EditChapterModal } from './components/EditChapterModal';
import { LoginModal } from './components/LoginModal';
import { UserGuideModal } from './components/UserGuideModal';
import { LayoutList, Bell, Sparkles } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceId>('all');
  const [watchlist, setWatchlist] = useState<ManhwaItem[]>([]);
  const [discoveries, setDiscoveries] = useState<DiscoveryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'caughtup'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sequentialMode] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('manhwa_tracker_theme');
      if (saved) return saved === 'dark';
    } catch (e) {
      console.warn(e);
    }
    return true;
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddUrlModalOpen, setIsAddUrlModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ManhwaItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingCaughtUp, setPendingCaughtUp] = useState<ManhwaItem | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(() => {
    try {
      return localStorage.getItem('manhwa_tracker_seen_guide') !== 'true';
    } catch {
      return true;
    }
  });

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Theme sync
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) { root.classList.add('dark'); root.classList.remove('light'); }
    else { root.classList.remove('dark'); root.classList.add('light'); }
    try { localStorage.setItem('manhwa_tracker_theme', isDarkMode ? 'dark' : 'light'); } catch {}
  }, [isDarkMode]);

  // Auth bootstrapping
  useEffect(() => {
    (async () => {
      const user = await fetchCurrentUser();
      setCurrentUser(user);
      setAuthReady(true);
      if (user) {
        setSelectedSource(user.preferredSource || 'all');
        const items = await fetchWatchlist(user.uid);
        setWatchlist(items);
      } else {
        setWatchlist(loadCachedWatchlist('guest'));
      }
    })();

    const unsub = onAuthStateChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        setSelectedSource(user.preferredSource || 'all');
        const items = await fetchWatchlist(user.uid);
        setWatchlist(items);
      } else {
        setWatchlist([]);
      }
    });

    return () => unsub();
  }, []);

  // Discoveries subscription
  useEffect(() => {
    const unsub = subscribeToDiscoveries((items) => setDiscoveries(items));
    return () => unsub();
  }, []);

  const handleUserChanged = async (user: UserAccount | null) => {
    setCurrentUser(user);
    if (user) {
      setSelectedSource(user.preferredSource || 'all');
      const items = await fetchWatchlist(user.uid);
      setWatchlist(items);
      showToast(`Welcome, @${user.username}!`);
    } else {
      setWatchlist([]);
      showToast('Signed out.');
    }
  };

  const handleSelectSource = async (src: SourceId) => {
    setSelectedSource(src);
    if (currentUser) {
      await updatePreferredSource(currentUser.uid, src);
      setCurrentUser({ ...currentUser, preferredSource: src });
    }
  };

  const handleReadChapter = async (item: ManhwaItem, chapterNum: number, targetSourceId?: SourceId) => {
    let sourceToUse: SourceId = 'arenascan';
    if (targetSourceId) {
      sourceToUse = targetSourceId;
    } else if (selectedSource !== 'all' && item.sources[selectedSource]) {
      sourceToUse = selectedSource;
    } else if (item.fastest_source_id && item.sources[item.fastest_source_id]) {
      sourceToUse = item.fastest_source_id;
    } else {
      const availableSource = (Object.keys(item.sources) as SourceId[])[0];
      sourceToUse = availableSource || 'arenascan';
    }
    const targetUrl = buildChapterUrlForSource(sourceToUse, item, chapterNum);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');

    if (!currentUser) {
      showToast('Sign in to save progress.');
      return;
    }

    setWatchlist((prev) => {
      const updated = prev.map((m) =>
        m.id === item.id
          ? { ...m, last_read_chapter: chapterNum, has_unread: (Number(m.latest_chapter) || 1) > chapterNum }
          : m
      );
      saveCachedWatchlist(currentUser.uid, updated);
      return updated;
    });

    const catchUp = calculateCatchUpInfo(item, selectedSource);
    const remaining = Math.max(0, Math.round(catchUp.latestChapter - chapterNum));
    if (sourceToUse === 'roliascan') {
      showToast(`Opening RoliaScan series hub. Pick Chapter ${chapterNum} there.`);
    } else if (remaining > 0) {
      showToast(`Opened Ch. ${chapterNum}. ${remaining} more to catch up.`);
    } else {
      showToast(`Caught up! Opened Ch. ${chapterNum}.`);
    }

    await updateReadProgress(currentUser.uid, item.id, chapterNum, catchUp.latestChapter);
  };

  const applyCaughtUp = async (item: ManhwaItem, latest: number) => {
    if (!currentUser) return;
    setWatchlist((prev) => {
      const updated = prev.map((m) =>
        m.id === item.id
          ? { ...m, last_read_chapter: latest, has_unread: false }
          : m
      );
      saveCachedWatchlist(currentUser.uid, updated);
      return updated;
    });
    await updateReadProgress(currentUser.uid, item.id, latest, latest);
    showToast(`Marked "${item.title}" as caught up (Ch. ${latest}).`);
  };

  const handleCaughtUp = async (item: ManhwaItem) => {
    if (!currentUser) {
      showToast('Sign in to save progress.');
      setIsLoginModalOpen(true);
      return;
    }
    const catchUp = calculateCatchUpInfo(item, selectedSource);
    const latest = catchUp.latestChapter;
    const current = Number(item.last_read_chapter) || 0;

    // If user is significantly behind, ask for confirmation
    if (current > 0 && latest - current > 5) {
      setPendingCaughtUp(item);
      return;
    }

    await applyCaughtUp(item, latest);
  };

  const handleReadLatest = async (item: ManhwaItem) => {
    const catchUp = calculateCatchUpInfo(item, selectedSource);
    const latest = catchUp.latestChapter;

    let sourceToUse: SourceId = item.fastest_source_id || 'arenascan';
    if (selectedSource !== 'all' && item.sources[selectedSource]) {
      sourceToUse = selectedSource;
    } else if (catchUp.activeSourceId) {
      sourceToUse = catchUp.activeSourceId;
    }

    const sourceData = item.sources[sourceToUse];
    let seriesUrl = sourceData?.series_url || item.series_url;

    if (!seriesUrl) {
      console.warn(
        `⚠ No stored series URL for "${item.title}" on ${sourceToUse}. ` +
        `Using constructed fallback. The scraper may not have populated this source yet.`
      );
      seriesUrl = buildChapterUrlForSource(sourceToUse, item, latest);
    }

    // Warn if user's filter isn't available for this title
    if (selectedSource !== 'all' && !item.sources[selectedSource]) {
      showToast(`${KNOWN_SOURCES[selectedSource]?.name} doesn't have this title. Opening ${KNOWN_SOURCES[sourceToUse]?.name}.`);
    }

    if (currentUser) {
      await applyCaughtUp(item, latest);
    } else {
      showToast('Sign in to save progress.');
    }

    const isMobile =
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
      (window.matchMedia('(max-width: 768px)').matches && 'ontouchstart' in window);

    if (isMobile) {
      window.location.href = seriesUrl;
    } else {
      window.open(seriesUrl, '_blank', 'noopener,noreferrer');
      showToast(`Opened ${KNOWN_SOURCES[sourceToUse]?.name}. Progress set to Ch. ${latest}.`);
    }
  };

  const handleStepChapter = async (id: string, delta: number) => {
    if (!currentUser) return;
    const item = watchlist.find((m) => m.id === id);
    if (!item) return;
    const current = Number(item.last_read_chapter) || 0;
    const catchUp = calculateCatchUpInfo(item, selectedSource);
    const updated = Math.max(0, current + delta);

    setWatchlist((prev) => {
      const next = prev.map((m) =>
        m.id === id ? { ...m, last_read_chapter: updated, has_unread: catchUp.latestChapter > updated } : m
      );
      saveCachedWatchlist(currentUser.uid, next);
      return next;
    });
    await updateReadProgress(currentUser.uid, id, updated, catchUp.latestChapter);
  };

  const handleDeleteSeries = async (id: string, title: string) => {
    if (!currentUser) {
      setWatchlist((prev) => prev.filter((m) => m.id !== id));
      return;
    }
    if (!confirm(`Remove "${title}" from your shelf?`)) return;
    setWatchlist((prev) => {
      const next = prev.filter((m) => m.id !== id);
      saveCachedWatchlist(currentUser.uid, next);
      return next;
    });
    await deleteWatchlistItem(currentUser.uid, id);
    showToast(`Removed "${title}".`);
  };

  const handleAddDiscovery = async (discovery: DiscoveryItem) => {
    if (!currentUser) {
      showToast('Sign in to track titles.');
      setIsLoginModalOpen(true);
      return;
    }
    const slug = toCanonicalSlug(discovery.title);
    const latest = Math.max(1, Number(discovery.latest_chapter) || 1);
    const chapterUrl =
      discovery.latest_chapter_url ||
      buildChapterUrlForSource(discovery.source_id, { canonical_slug: slug, title: discovery.title }, latest);

    const newManhwa: ManhwaItem = {
      id: discovery.id,
      title: discovery.title,
      canonical_slug: slug,
      latest_chapter: latest,
      last_read_chapter: 0,
      fastest_source_id: discovery.source_id,
      latest_chapter_text: discovery.latest_chapter_text || `Chapter ${latest}`,
      latest_chapter_url: chapterUrl,
      series_url: discovery.series_url || '',
      cover_url: discovery.cover_url || '',
      has_unread: true,
      sources: {
        [discovery.source_id]: {
          chapter: latest,
          chapter_text: discovery.latest_chapter_text || `Chapter ${latest}`,
          url: chapterUrl,
          updated_at: new Date().toISOString(),
          status: 'active',
        },
      },
    };

    setWatchlist((prev) => (prev.some((m) => m.id === newManhwa.id) ? prev : [newManhwa, ...prev]));
    setDiscoveries((prev) => prev.filter((d) => d.id !== discovery.id));
    await upsertWatchlistItem(currentUser.uid, newManhwa);
    showToast(`Added "${discovery.title}" to your shelf!`);
  };

  const handleRemoveDiscovery = (id: string) => {
    setDiscoveries((prev) => prev.filter((d) => d.id !== id));
  };

  const handleRestoreAllDismissed = () => {
    showToast('Discoveries will refresh from Firestore.');
  };

  const handleSaveEditChapter = async (id: string, chapterNum: number, latestChapter: number) => {
    if (!currentUser) return;
    setWatchlist((prev) => {
      const next = prev.map((m) =>
        m.id === id ? { ...m, last_read_chapter: chapterNum, has_unread: latestChapter > chapterNum } : m
      );
      saveCachedWatchlist(currentUser.uid, next);
      return next;
    });
    showToast(`Updated to Chapter ${chapterNum}.`);
    await updateReadProgress(currentUser.uid, id, chapterNum, latestChapter);
  };

  const handleAddSeries = async (item: Partial<ManhwaItem>) => {
    if (!currentUser) {
      showToast('Sign in to add series.');
      setIsLoginModalOpen(true);
      return;
    }
    const added = await upsertWatchlistItem(currentUser.uid, item);
    if (added) {
      setWatchlist((prev) => [added, ...prev.filter((m) => m.id !== added.id)]);
      showToast(`Added "${item.title}".`);
    } else {
      showToast('Failed to add series.');
    }
  };

  const handleAddCustomUrl = async (item: Partial<ManhwaItem>) => {
    try {
      const { collection, query, where, limit, getDocs, doc, getDoc } = await import('firebase/firestore');
      const { scraperDb } = await import('./services/firebase');
      const colRef = collection(scraperDb, 'manhwa');

      let firestoreData: any = null;

      // Lookup 1: by exact series_url
      if (item.series_url) {
        try {
          const q1 = query(colRef, where('series_url', '==', item.series_url), limit(1));
          const snap1 = await getDocs(q1);
          if (!snap1.empty) firestoreData = snap1.docs[0].data();
        } catch (e) { console.warn('Lookup 1 failed:', e); }
      }

      // Lookup 2: direct doc fetch by slug
      if (!firestoreData && item.canonical_slug) {
        try {
          const docRef = doc(scraperDb, 'manhwa', item.canonical_slug.replace(/-/g, '_'));
          const snap2 = await getDoc(docRef);
          if (snap2.exists()) firestoreData = snap2.data();
        } catch (e) { console.warn('Lookup 2 failed:', e); }
      }

      // Lookup 3: query by canonical_slug field
      if (!firestoreData && item.canonical_slug) {
        try {
          const q3 = query(colRef, where('canonical_slug', '==', item.canonical_slug), limit(1));
          const snap3 = await getDocs(q3);
          if (!snap3.empty) firestoreData = snap3.docs[0].data();
        } catch (e) { console.warn('Lookup 3 failed:', e); }
      }

      if (firestoreData) {
        if (!item.cover_url && firestoreData.cover_url) item.cover_url = firestoreData.cover_url;
        if (firestoreData.latest_chapter && (!item.latest_chapter || item.latest_chapter < firestoreData.latest_chapter)) {
          item.latest_chapter = firestoreData.latest_chapter;
          item.latest_chapter_text = firestoreData.latest_chapter_text || `Chapter ${firestoreData.latest_chapter}`;
        }
        if (firestoreData.series_url) item.series_url = firestoreData.series_url;
        if (firestoreData.sources) item.sources = firestoreData.sources;
        if (firestoreData.fastest_source_id) item.fastest_source_id = firestoreData.fastest_source_id;
      }
    } catch (e) {
      console.warn('Firestore enrich failed:', e);
    }

    await handleAddSeries(item);
  };

  const filteredWatchlist = watchlist.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const catchUp = calculateCatchUpInfo(item, selectedSource);
    if (!matchesSearch) return false;
    if (filter === 'unread') return catchUp.isUnread;
    if (filter === 'caughtup') return !catchUp.isUnread;
    return true;
  });

  const totalUnreadChapters = watchlist.reduce((acc, curr) => {
    const catchUp = calculateCatchUpInfo(curr, selectedSource);
    return acc + catchUp.chaptersBehind;
  }, 0);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0c10] text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-rose-500/30 border-t-rose-500 animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen dot-grid-pattern antialiased flex flex-col transition-colors overflow-x-hidden ${
      isDarkMode ? 'bg-[#0b0c10] text-[#f3f4f6]' : 'bg-[#f7f8fc] text-[#0f172a]'
    }`}>

      {toastMessage && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-[90vw]">
          <div className={`px-4 py-3 rounded-lg shadow-2xl border text-xs font-medium flex items-center gap-2.5 ${
            isDarkMode ? 'border-zinc-700 bg-[#12141c] text-white' : 'border-slate-300 bg-white text-slate-800'
          }`}>
            <span className="w-2 h-2 rounded-full bg-[#ff4655] animate-pulse shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        </div>
      )}

      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenAddUrlModal={() => setIsAddUrlModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenGuide={() => setShowGuide(true)}
        currentUser={currentUser}
        selectedSource={selectedSource}
        onSelectSource={handleSelectSource}
      />

      <main className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-8 sm:space-y-10 flex-1">

        <HeroSection
          trackedCount={watchlist.length}
          unreadChaptersCount={totalUnreadChapters}
          newDiscoveriesCount={discoveries.length}
          items={watchlist}
          isDarkMode={isDarkMode}
        />

        {!currentUser && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-400 dark:text-blue-300 text-sm">Sign in to sync your shelf</p>
                <p className="text-blue-200/80 dark:text-blue-100/70 mt-0.5">Your reading progress will be saved across devices.</p>
              </div>
            </div>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shrink-0 transition-colors"
            >
              Sign In / Register
            </button>
          </div>
        )}

        <section className="space-y-4">
          <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 border-b pb-3 transition-colors ${
            isDarkMode ? 'border-[#1c1f2e]' : 'border-slate-200'
          }`}>
            <div className="space-y-0.5">
              <div className="relative inline-block">
                <h2 className={`font-comic text-2xl sm:text-4xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>READING</h2>
                <div className="w-10 sm:w-12 h-1 bg-[#ff4655] rounded-full mt-1" />
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-[#8a8f9f]' : 'text-slate-500'}`}>{watchlist.length} series tracked</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <input
                type="text"
                placeholder="Search series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full sm:w-52 px-3 py-1.5 border rounded-md text-xs focus:outline-none focus:border-[#ff4655] ${
                  isDarkMode ? 'bg-[#12141c] border-[#222536] text-white placeholder-[#6c7285]' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />

              <div className="flex items-center gap-3.5 sm:gap-4 text-xs font-semibold pt-1 sm:pt-0">
                {(['all', 'unread', 'caughtup'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`pb-1 transition-colors relative cursor-pointer ${
                      filter === f
                        ? isDarkMode ? 'text-white font-bold' : 'text-slate-900 font-bold'
                        : isDarkMode ? 'text-[#8a8f9f] hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <span>{f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Caught up'}</span>
                    {filter === f && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff4655] rounded-full" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredWatchlist.length === 0 ? (
            <div className={`text-center py-12 sm:py-16 px-4 border rounded-xl space-y-2 ${
              isDarkMode ? 'bg-[#12141c] border-[#222536]' : 'bg-white border-slate-200'
            }`}>
              <p className={`font-bold text-sm ${isDarkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
                {watchlist.length === 0 ? 'Your shelf is empty' : 'No series match this filter'}
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-[#8a8f9f]' : 'text-slate-400'}`}>
                {watchlist.length === 0 ? 'Track a fresh drop below or add a series manually.' : 'Try a different filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWatchlist.map((item) => (
                <ManhwaRowItem
                  key={item.id}
                  item={item}
                  preferredSource={selectedSource}
                  sequentialMode={sequentialMode}
                  onReadChapter={handleReadChapter}
                  onStepChapter={handleStepChapter}
                  onEditReadChapter={(it) => setEditingItem(it)}
                  onDelete={handleDeleteSeries}
                  onCaughtUp={handleCaughtUp}
                  onReadLatest={handleReadLatest}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          )}
        </section>

        <DiscoveriesSection
          discoveries={discoveries}
          onAddDiscovery={handleAddDiscovery}
          onRemoveDiscovery={handleRemoveDiscovery}
          onRestoreAllDismissed={handleRestoreAllDismissed}
          isDarkMode={isDarkMode}
        />

      </main>

      <AddSeriesModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddSeries} />
      <AddCustomUrlModal isOpen={isAddUrlModalOpen} onClose={() => setIsAddUrlModalOpen(false)} onAdd={handleAddCustomUrl} />
      <EditChapterModal item={editingItem} onClose={() => setEditingItem(null)} onSave={handleSaveEditChapter} />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} currentUser={currentUser} onUserChanged={handleUserChanged} />

      <UserGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        onDontShowAgain={() => {
          try { localStorage.setItem('manhwa_tracker_seen_guide', 'true'); } catch {}
          setShowGuide(false);
        }}
      />

      {pendingCaughtUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-white">Mark as caught up?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              You are at <strong className="text-white">Chapter {Number(pendingCaughtUp.last_read_chapter) || 0}</strong> of{' '}
              <strong className="text-white">{pendingCaughtUp.title}</strong>.
              The latest is <strong className="text-white">Chapter {calculateCatchUpInfo(pendingCaughtUp, selectedSource).latestChapter}</strong>.
            </p>
            <p className="text-xs text-zinc-500">
              This will mark all intermediate chapters as read.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setPendingCaughtUp(null)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const item = pendingCaughtUp;
                  const latest = calculateCatchUpInfo(item, selectedSource).latestChapter;
                  setPendingCaughtUp(null);
                  await applyCaughtUp(item, latest);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Mark as Read
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
