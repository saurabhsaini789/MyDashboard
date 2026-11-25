"use client";

import React, { useState } from 'react';
import type { LibraryBook } from '@/types/books';
import { BookCover } from './BookCover';
import { display } from './fonts';

type Filter = 'All' | 'Unread' | 'Read' | 'Hindi' | 'English';

export function Shelf({ books, onOpen }: { books: LibraryBook[]; onOpen: (b: LibraryBook) => void }) {
  const [filter, setFilter] = useState<Filter>('All');
  const owned = books.filter(b => b.owned);
  const groups: Record<Filter, LibraryBook[]> = {
    All: owned,
    Unread: owned.filter(b => b.status !== 'done'),
    Read: owned.filter(b => b.status === 'done'),
    Hindi: owned.filter(b => b.language === 'Hindi'),
    English: owned.filter(b => b.language === 'English'),
  };
  const list = groups[filter];

  return (
    <section className="rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className={`${display.className} text-2xl font-extrabold tracking-tight`}>My shelf</h2>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-[3px] bg-teal-700" />Read</span>
            <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-[3px] bg-blue-600" />Reading now</span>
            <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-[3px] bg-zinc-200 dark:bg-zinc-700" />Not read yet</span>
          </div>
        </div>
        <div className="flex gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 flex-wrap">
          {(Object.keys(groups) as Filter[]).map(k => (
            <button key={k} type="button" onClick={() => setFilter(k)} aria-pressed={filter === k}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === k ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>
              {k} {groups[k].length}
            </button>
          ))}
        </div>
      </div>

      {list.length ? (
        <div className="mt-6 pb-4 relative">
          <div className="flex flex-wrap gap-x-3.5 gap-y-10 px-4">
            {list.map(b => (
              <button key={b.id} type="button" onClick={() => onOpen(b)} aria-label={`Edit ${b.title}`}
                className="relative transition-transform hover:-translate-y-1.5 after:absolute after:-left-2 after:-right-2 after:-bottom-[22px] after:h-3.5 after:rounded after:bg-gradient-to-b after:from-stone-300 after:to-stone-400 dark:after:from-stone-700 dark:after:to-stone-800">
                <div className={b.status === 'want' ? 'saturate-[.75]' : ''}>
                  <BookCover book={b} width={96}>
                    {b.status === 'done' && (
                      <span className="absolute inset-x-0 bottom-0 z-[1] flex items-center justify-between gap-1 bg-teal-700 px-2 py-1 font-sans text-[10px] font-extrabold uppercase tracking-wider text-white">
                        <span>✓ Read</span><span className="tracking-normal text-[9px] text-amber-300">{'★'.repeat(b.rating || 0)}</span>
                      </span>
                    )}
                    {b.status === 'reading' && (
                      <span className="absolute inset-x-0 bottom-0 z-[1] bg-blue-600 px-2 py-1 font-sans text-[10px] font-extrabold uppercase tracking-wider text-white">Reading</span>
                    )}
                  </BookCover>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border-[1.5px] border-dashed border-zinc-200 dark:border-zinc-700 p-8 text-center text-sm text-zinc-400">
          {owned.length ? 'No books in this filter' : 'Mark a book as bought and it appears here'}
        </div>
      )}
    </section>
  );
}
