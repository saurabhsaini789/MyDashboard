"use client";

import React, { useMemo, useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { setSyncedItem } from '@/lib/storage';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';
import type { Book, CompletedBook, LibraryBook, MultiYearLogData } from '@/types/books';
import { localDateStr } from '@/lib/content-system';
import { importLegacy, nextOrder, yearOf } from '@/lib/books-library';
import { YearReads } from './YearReads';
import { Pipeline } from './Pipeline';
import { Shelf } from './Shelf';
import { BookEditor } from './BookEditor';
import { display } from './fonts';

const EMPTY_LIB: LibraryBook[] = [];
const EMPTY_QUEUE: Book[] = [];
const EMPTY_DONE: CompletedBook[] = [];
const EMPTY_LOG: MultiYearLogData = {};

const saveLibrary = (list: LibraryBook[]) => setSyncedItem(SYNC_KEYS.BOOKS_LIBRARY, JSON.stringify(list));

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint: string }) {
  return (
    <div className="rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 min-w-0">
      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">{label}</div>
      <div className={`${display.className} mt-2.5 text-[44px] leading-none font-extrabold tracking-tight tabular-nums`}>{value}</div>
      <div className="mt-2 text-xs text-zinc-500 truncate">{hint}</div>
    </div>
  );
}

export function BooksDashboard() {
  const library = useStorageSubscription<LibraryBook[]>(SYNC_KEYS.BOOKS_LIBRARY, EMPTY_LIB);
  const goalRaw = useStorageSubscription<number | string>(SYNC_KEYS.BOOKS_GOAL, 24);
  const legacyQueue = useStorageSubscription<Book[]>(SYNC_KEYS.BOOKS_QUEUE, EMPTY_QUEUE);
  const legacyDone = useStorageSubscription<CompletedBook[]>(SYNC_KEYS.BOOKS_COMPLETED, EMPTY_DONE);
  const legacyLog = useStorageSubscription<MultiYearLogData>(SYNC_KEYS.BOOKS_YEARLY_LOG, EMPTY_LOG);

  const goal = Math.max(1, Number(goalRaw) || 24);
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [language, setLanguage] = useState<'All' | 'English' | 'Hindi'>('All');
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<{ draft: Partial<LibraryBook>; key: number } | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);

  const flash = (id: string) => {
    setFlashId(id);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashId(null), 1500);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return library;
    return library.filter(b => `${b.title} ${b.author} ${b.titleHi || ''} ${b.authorHi || ''}`.toLowerCase().includes(q));
  }, [library, query]);

  const update = (id: string, patch: Partial<LibraryBook>) => {
    saveLibrary(library.map(b => (b.id === id ? { ...b, ...patch } : b)));
    flash(id);
  };

  const open = (draft: Partial<LibraryBook>) => setEditor({ draft, key: Date.now() });

  const saveBook = (b: Partial<LibraryBook>) => {
    const clean = { ...b } as LibraryBook;
    if (clean.status !== 'reading') delete clean.startedOn;
    if (clean.status !== 'done') { delete clean.finishedOn; }
    if (clean.status === 'want' && clean.order === undefined) clean.order = nextOrder(library);
    if (clean.id) {
      saveLibrary(library.map(x => (x.id === clean.id ? clean : x)));
    } else {
      clean.id = crypto.randomUUID();
      clean.createdAt = new Date().toISOString();
      saveLibrary([...library, clean]);
    }
    if (clean.status === 'done' && clean.finishedOn) setYear(yearOf(clean.finishedOn));
    flash(clean.id);
    setEditor(null);
  };

  const legacyCount = legacyQueue.length + legacyDone.length + Object.keys(legacyLog || {}).length;
  const runImport = () => saveLibrary(importLegacy(legacyQueue, legacyDone, legacyLog));

  // Stats
  const readThisYear = library.filter(b => b.status === 'done' && yearOf(b.finishedOn) === thisYear);
  const hi = readThisYear.filter(b => b.language === 'Hindi').length;
  const en = readThisYear.length - hi;
  const pct = Math.round((readThisYear.length / goal) * 100);
  const expected = Math.round((goal * (new Date().getMonth() + 1)) / 12);
  const reading = library.filter(b => b.status === 'reading');
  const readyCount = library.filter(b => b.status === 'want' && b.owned).length;
  const toBuy = library.filter(b => !b.owned && b.status !== 'reading');
  const toBuyRead = toBuy.filter(b => b.status === 'done').length;
  const ownedCount = library.filter(b => b.owned).length;

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 -mt-4">
        <label className="flex items-center gap-2 h-11 w-full sm:w-80 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5">
          <Search size={16} className="text-zinc-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} type="search" placeholder="Search title or author" aria-label="Search books" className="flex-1 min-w-0 bg-transparent outline-none text-sm" />
        </label>
        <button type="button" onClick={() => open({})} className="flex items-center gap-1.5 h-11 px-5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold">
          <Plus size={16} /> Add book
        </button>
      </div>

      {library.length === 0 && legacyCount > 0 && (
        <div className="rounded-3xl border border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/10 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className={`${display.className} text-xl font-extrabold`}>Bring in your books from the old lists</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
              {legacyQueue.length} in the reading plan, {legacyDone.length} completed, plus your yearly log. Duplicates are merged by title, and the old lists stay as they are.
            </p>
          </div>
          <button type="button" onClick={runImport} className="h-11 px-5 rounded-2xl bg-teal-700 text-white text-sm font-bold">Import books</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[1.6fr_repeat(4,1fr)] gap-4">
        <div className="col-span-2 lg:col-span-3 2xl:col-span-1 rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex items-center gap-5 min-w-0">
          <div className="w-24 h-24 rounded-full grid place-items-center shrink-0" style={{ background: `conic-gradient(#0f8b7e ${Math.min(pct, 100) * 3.6}deg, rgba(161,161,170,.2) 0)` }}>
            <div className="w-[78px] h-[78px] rounded-full bg-white dark:bg-zinc-900 grid place-items-center text-center leading-tight">
              <div><div className={`${display.className} text-2xl font-extrabold`}>{pct}%</div><div className="text-[10px] text-zinc-500">of goal</div></div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Read in {thisYear}</div>
            <div className={`${display.className} mt-2.5 text-[44px] leading-none font-extrabold tracking-tight tabular-nums`}>
              {readThisYear.length}{' '}
              {editingGoal ? (
                <input
                  autoFocus type="number" min={1} defaultValue={goal} aria-label="Yearly goal"
                  onBlur={e => { setSyncedItem(SYNC_KEYS.BOOKS_GOAL, String(Math.max(1, Number(e.target.value) || goal))); setEditingGoal(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  className="w-20 text-lg font-semibold border-b border-zinc-300 bg-transparent outline-none"
                />
              ) : (
                <button type="button" onClick={() => setEditingGoal(true)} title="Change yearly goal" className="text-lg font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">/ {goal} books</button>
              )}
            </div>
            <div className="mt-3 h-2 rounded-full overflow-hidden flex bg-zinc-100 dark:bg-zinc-800">
              <div className="bg-orange-500" style={{ width: `${readThisYear.length ? (hi / readThisYear.length) * 100 : 0}%` }} />
              <div className="bg-blue-500" style={{ width: `${readThisYear.length ? (en / readThisYear.length) * 100 : 0}%` }} />
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              <span className="inline-block w-2 h-2 rounded-sm bg-orange-500 mr-1" />{hi} Hindi
              <span className="inline-block w-2 h-2 rounded-sm bg-blue-500 ml-3 mr-1" />{en} English
              {' · '}{readThisYear.length >= expected ? 'on pace' : `${expected - readThisYear.length} behind pace`}
            </div>
          </div>
        </div>
        <Stat label="Reading now" value={reading.length} hint={reading.map(b => b.title).join(' · ') || 'Nothing started'} />
        <Stat label="Ready on shelf" value={readyCount} hint="Owned, waiting to be read" />
        <Stat label="To buy" value={toBuy.length} hint={`${toBuyRead} of them already read`} />
        <Stat label="Books I own" value={ownedCount} hint="Physical copies on your shelf" />
      </div>

      <YearReads
        books={visible}
        year={year}
        onYear={y => setYear(Math.min(thisYear, y))}
        onOpen={b => open(b)}
        onAddInMonth={m => {
          const isNow = year === thisYear && m === new Date().getMonth();
          open({ status: 'done', owned: false, rating: 0, finishedOn: isNow ? localDateStr() : `${year}-${String(m + 1).padStart(2, '0')}-15` });
        }}
      />

      <Pipeline
        books={visible}
        year={year}
        language={language}
        onLanguage={setLanguage}
        onOpen={b => open(b)}
        onBought={b => update(b.id, { owned: true })}
        onStart={b => update(b.id, { status: 'reading', startedOn: localDateStr() })}
        onFinish={b => {
          const finished = { ...b, status: 'done' as const, finishedOn: localDateStr() };
          saveLibrary(library.map(x => (x.id === b.id ? finished : x)));
          setYear(thisYear);
          open(finished);
        }}
        flashId={flashId}
      />

      <Shelf books={visible} onOpen={b => open(b)} />

      {editor && (
        <BookEditor
          key={editor.key}
          draft={editor.draft}
          onSave={saveBook}
          onDelete={id => { saveLibrary(library.filter(b => b.id !== id)); setEditor(null); }}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}
