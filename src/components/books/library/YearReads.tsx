"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { LibraryBook } from '@/types/books';
import { MONTHS, monthOf, yearOf } from '@/lib/books-library';
import { BookCover } from './BookCover';
import { display } from './fonts';

interface Props {
  books: LibraryBook[];
  year: number;
  onYear: (y: number) => void;
  onOpen: (b: LibraryBook) => void;
  onAddInMonth: (monthIndex: number) => void;
}

export function YearReads({ books, year, onYear, onOpen, onAddInMonth }: Props) {
  const now = new Date();
  const isCurrent = year === now.getFullYear();
  const read = books.filter(b => b.status === 'done' && yearOf(b.finishedOn) === year);
  const reading = isCurrent ? books.filter(b => b.status === 'reading') : [];
  const hindi = read.filter(b => b.language === 'Hindi').length;

  const item = (b: LibraryBook, sub: string, muted?: boolean) => (
    <button key={b.id} type="button" onClick={() => onOpen(b)} className={`w-full flex items-center gap-2.5 rounded-xl p-1.5 -mx-1.5 text-left hover:bg-white dark:hover:bg-zinc-900 transition-colors ${muted ? 'opacity-60' : ''}`}>
      <BookCover book={b} width={34} />
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold leading-snug line-clamp-2 text-zinc-900 dark:text-zinc-100">{b.title}</span>
        <span className={`block text-xs mt-0.5 ${muted ? 'text-zinc-400' : 'text-amber-500 tracking-wider'}`}>{sub}</span>
      </span>
    </button>
  );

  return (
    <section className="rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className={`${display.className} text-2xl font-extrabold tracking-tight`}>What I read in {year}</h2>
          <p className="text-sm text-zinc-500 mt-1">{read.length} {read.length === 1 ? 'book' : 'books'} · {hindi} Hindi, {read.length - hindi} English</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onYear(year - 1)} aria-label="Previous year" className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center"><ChevronLeft size={16} /></button>
          <span className={`${display.className} text-lg font-extrabold w-14 text-center tabular-nums`}>{year}</span>
          <button type="button" onClick={() => onYear(year + 1)} disabled={isCurrent} aria-label="Next year" className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3.5">
        {MONTHS.map((m, i) => {
          const list = read.filter(b => monthOf(b.finishedOn) === i).sort((a, b) => (a.finishedOn || '').localeCompare(b.finishedOn || ''));
          const thisMonth = isCurrent && i === now.getMonth();
          const future = isCurrent && i > now.getMonth();
          return (
            <div key={m} className={`flex flex-col min-w-0 min-h-[170px] rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-3.5 ${thisMonth ? 'ring-2 ring-inset ring-teal-500' : ''}`}>
              <h3 className={`${display.className} flex items-baseline justify-between text-[17px] font-extrabold mb-2`}>
                {m}<span className="text-[13px] font-semibold text-zinc-400">{list.length || ''}</span>
              </h3>
              {list.map(b => item(b, '★'.repeat(b.rating || 0)))}
              {thisMonth && reading.map(b => item(b, 'Reading now', true))}
              {!future && (
                <button
                  type="button"
                  onClick={() => onAddInMonth(i)}
                  className="mt-auto pt-2 w-full"
                >
                  <span className="flex items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-zinc-200 dark:border-zinc-700 py-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-400">
                    <Plus size={12} /> Add a book read in {m}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
