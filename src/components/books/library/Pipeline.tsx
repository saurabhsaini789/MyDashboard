"use client";

import React from 'react';
import { Check } from 'lucide-react';
import type { LibraryBook } from '@/types/books';
import { daysSince, prettyDate, yearOf } from '@/lib/books-library';
import { BookCover } from './BookCover';
import { display } from './fonts';

interface Props {
  books: LibraryBook[];
  year: number;
  language: 'All' | 'English' | 'Hindi';
  onLanguage: (l: 'All' | 'English' | 'Hindi') => void;
  onOpen: (b: LibraryBook) => void;
  onBought: (b: LibraryBook) => void;
  onStart: (b: LibraryBook) => void;
  onFinish: (b: LibraryBook) => void;
  flashId: string | null;
}

const langChip = (b: LibraryBook) => (
  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${b.language === 'Hindi' ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'}`}>{b.language}</span>
);

const smallBtn = 'ml-auto shrink-0 h-[30px] px-3 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold transition-transform hover:-translate-y-px active:scale-95';

function Row({ b, meta, action, pos, onOpen, flash }: { b: LibraryBook; meta: React.ReactNode; action: React.ReactNode; pos?: number; onOpen: () => void; flash: boolean }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter') onOpen(); }}
      className={`flex items-center gap-3 h-[92px] mb-2 p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 cursor-pointer transition-all min-w-0 ${flash ? 'ring-2 ring-teal-500' : ''}`}
    >
      {pos !== undefined && <span className={`${display.className} w-6 text-center text-xl font-extrabold text-zinc-300 dark:text-zinc-600 shrink-0`}>{pos}</span>}
      <BookCover book={b} width={44} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold truncate text-zinc-900 dark:text-zinc-100">{b.title}</div>
        <div className="text-[13px] text-zinc-500 truncate">{meta}</div>
        <div className="mt-1.5 flex items-center gap-1.5" onClick={e => e.stopPropagation()}>{langChip(b)}{action}</div>
      </div>
    </div>
  );
}

function Column({ n, title, sub, count, children }: { n: number; title: string; sub: string; count: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-w-0 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 p-3">
      <div className="flex items-start justify-between gap-2 px-1.5 pt-1 pb-3">
        <div>
          <div className={`${display.className} text-[17px] font-extrabold`}><span className="text-zinc-300 dark:text-zinc-600 mr-1.5">{n}</span>{title}</div>
          <div className="text-[13px] text-zinc-500">{sub}</div>
        </div>
        <span className="text-xs font-extrabold bg-white dark:bg-zinc-900 rounded-full px-2.5 py-0.5 tabular-nums">{count}</span>
      </div>
      {/* Fixed height: five rows visible, the rest scroll. */}
      <div className="h-[500px] overflow-y-auto pr-1 overscroll-contain">{children}</div>
    </div>
  );
}

const Empty = ({ text }: { text: string }) => (
  <div className="rounded-2xl border-[1.5px] border-dashed border-zinc-200 dark:border-zinc-700 p-4 text-center text-xs text-zinc-400">{text}</div>
);
const Sub = ({ children }: { children: React.ReactNode }) => (
  <div className="px-1.5 pt-1 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">{children}</div>
);

export function Pipeline({ books, year, language, onLanguage, onOpen, onBought, onStart, onFinish, flashId }: Props) {
  const match = (b: LibraryBook) => language === 'All' || b.language === language;
  const byOrder = (a: LibraryBook, b: LibraryBook) => (a.order ?? 1e9) - (b.order ?? 1e9);
  const want = books.filter(b => b.status === 'want' && match(b)).sort(byOrder);
  const buyWant = want.filter(b => !b.owned);
  const ready = want.filter(b => b.owned);
  const buyRead = books.filter(b => b.status === 'done' && !b.owned && match(b)).sort((a, b) => (b.finishedOn || '').localeCompare(a.finishedOn || ''));
  const reading = books.filter(b => b.status === 'reading' && match(b));
  const done = books.filter(b => b.status === 'done' && yearOf(b.finishedOn) === year && match(b)).sort((a, b) => (b.finishedOn || '').localeCompare(a.finishedOn || ''));

  const stars = (n?: number) => (n ? <span className="text-amber-500 tracking-wider ml-1">{'★'.repeat(n)}</span> : null);

  return (
    <section className="rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className={`${display.className} text-2xl font-extrabold tracking-tight`}>Reading pipeline</h2>
          <p className="text-sm text-zinc-500 mt-1">Every book ends with a physical copy on your shelf</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
          {(['All', 'Hindi', 'English'] as const).map(l => (
            <button key={l} type="button" onClick={() => onLanguage(l)} aria-pressed={language === l}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${language === l ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Column n={1} title="To buy" sub="Get a physical copy" count={buyWant.length + buyRead.length}>
          {buyWant.length > 0 && <Sub>Want to read · {buyWant.length}</Sub>}
          {buyWant.map(b => <Row key={b.id} b={b} meta={b.author} flash={flashId === b.id} onOpen={() => onOpen(b)}
            action={<button type="button" className={smallBtn} onClick={() => onBought(b)}>Bought</button>} />)}
          {buyRead.length > 0 && <Sub>Read digitally · {buyRead.length}</Sub>}
          {buyRead.map(b => <Row key={b.id} b={b} meta={`Read ${prettyDate(b.finishedOn)}`} flash={flashId === b.id} onOpen={() => onOpen(b)}
            action={<button type="button" className={smallBtn} onClick={() => onBought(b)}>Bought</button>} />)}
          {!buyWant.length && !buyRead.length && <Empty text="Nothing left to buy" />}
        </Column>

        <Column n={2} title="On shelf" sub="Owned, in reading order" count={ready.length}>
          {ready.map((b, i) => <Row key={b.id} b={b} pos={i + 1} meta={b.author} flash={flashId === b.id} onOpen={() => onOpen(b)}
            action={<button type="button" className={smallBtn} onClick={() => onStart(b)}>Start</button>} />)}
          {!ready.length && <Empty text="Buy a book to fill your shelf" />}
        </Column>

        <Column n={3} title="Reading" sub="What you're on right now" count={reading.length}>
          {reading.map(b => <Row key={b.id} b={b} meta={`Day ${daysSince(b.startedOn)} · since ${prettyDate(b.startedOn)}`} flash={flashId === b.id} onOpen={() => onOpen(b)}
            action={<button type="button" className={`${smallBtn} inline-flex items-center gap-1`} onClick={() => onFinish(b)}><Check size={12} strokeWidth={3} /> Finished</button>} />)}
          {!reading.length && <Empty text="Start a book from your shelf" />}
        </Column>

        <Column n={4} title="Finished" sub={`Read in ${year}, newest first`} count={done.length}>
          {done.map(b => <Row key={b.id} b={b} meta={<>{prettyDate(b.finishedOn)}{stars(b.rating)}</>} flash={flashId === b.id} onOpen={() => onOpen(b)}
            action={<span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${b.owned ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'}`}>{b.owned ? 'Owned' : 'Not owned'}</span>} />)}
          {!done.length && <Empty text={`Nothing finished in ${year} yet`} />}
        </Column>
      </div>
    </section>
  );
}
