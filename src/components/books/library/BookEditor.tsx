"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import type { LibraryBook } from '@/types/books';
import { localDateStr } from '@/lib/content-system';
import { BookCover } from './BookCover';
import { devanagari, display } from './fonts';

interface Props {
  /** Book to edit, or a partial draft for a new one (no id). */
  draft: Partial<LibraryBook>;
  onSave: (book: Partial<LibraryBook>) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const input = 'w-full min-h-[42px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500/40';
const label = 'text-[11px] font-bold uppercase tracking-wider text-zinc-400';

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${value === v ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/** Mount with a fresh `key` per open so the form starts from `draft`. */
export function BookEditor({ draft, onSave, onDelete, onClose }: Props) {
  const today = localDateStr();
  const [b, setB] = useState<Partial<LibraryBook>>({ language: 'English', status: 'want', owned: false, rating: 0, notes: '', ...draft });
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const set = <K extends keyof LibraryBook>(k: K, v: LibraryBook[K]) => { setB(prev => ({ ...prev, [k]: v })); setError(''); };

  const setStatus = (s: LibraryBook['status']) => setB(prev => ({
    ...prev,
    status: s,
    startedOn: s === 'reading' ? prev.startedOn || today : prev.startedOn,
    finishedOn: s === 'done' ? prev.finishedOn || today : prev.finishedOn,
  }));

  const save = () => {
    if (!b.title?.trim() || !b.author?.trim()) { setError('Enter a title and an author.'); return; }
    onSave({ ...b, title: b.title.trim(), author: b.author.trim(), titleHi: b.titleHi?.trim() || undefined, authorHi: b.authorHi?.trim() || undefined });
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="book-editor-title" className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-zinc-900 p-6 md:p-7 shadow-2xl grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="hidden md:block"><BookCover book={{ title: b.title || 'Title', author: b.author || 'Author', titleHi: b.titleHi, authorHi: b.authorHi, language: b.language || 'English' }} width={160} /></div>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 id="book-editor-title" className={`${display.className} text-2xl font-extrabold`}>{b.id ? 'Edit book' : 'Add a book'}</h2>
            <button type="button" onClick={onClose} className="px-3 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold">Close</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Title</span>
              <input ref={firstRef} value={b.title || ''} onChange={e => set('title', e.target.value)} placeholder="Raag Darbari" className={input} /></label>
            <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Author</span>
              <input value={b.author || ''} onChange={e => set('author', e.target.value)} placeholder="Shrilal Shukla" className={input} /></label>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Language</span>
              <Segmented value={b.language || 'English'} options={[['English', 'English'], ['Hindi', 'Hindi']]} onChange={v => set('language', v)} /></div>
            {b.language === 'Hindi' && (
              <>
                <label className="flex flex-col gap-1.5"><span className={label}>Title in Hindi (cover)</span>
                  <input lang="hi" value={b.titleHi || ''} onChange={e => set('titleHi', e.target.value)} placeholder="राग दरबारी" className={`${input} ${devanagari.className}`} /></label>
                <label className="flex flex-col gap-1.5"><span className={label}>Author in Hindi (cover)</span>
                  <input lang="hi" value={b.authorHi || ''} onChange={e => set('authorHi', e.target.value)} placeholder="श्रीलाल शुक्ल" className={`${input} ${devanagari.className}`} /></label>
              </>
            )}
            <div className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Status</span>
              <Segmented value={b.status || 'want'} options={[['want', 'Want to read'], ['reading', 'Reading'], ['done', 'Finished']]} onChange={setStatus} /></div>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Physical copy</span>
              <Segmented value={b.owned ? 'yes' : 'no'} options={[['yes', 'On my shelf'], ['no', 'Not owned yet']]} onChange={v => set('owned', v === 'yes')} /></div>
            {b.status === 'reading' && (
              <label className="flex flex-col gap-1.5"><span className={label}>Started on</span>
                <input type="date" max={today} value={b.startedOn || today} onChange={e => set('startedOn', e.target.value)} className={input} /></label>
            )}
            {b.status === 'done' && (
              <>
                <label className="flex flex-col gap-1.5"><span className={label}>Finished on</span>
                  <input type="date" max={today} value={b.finishedOn || today} onChange={e => set('finishedOn', e.target.value)} className={input} /></label>
                <div className="flex flex-col gap-1.5"><span className={label}>Rating</span>
                  <div className="flex gap-1 h-[42px] items-center">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => set('rating', b.rating === n ? 0 : n)}>
                        <Star size={24} className={n <= (b.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600'} />
                      </button>
                    ))}
                  </div></div>
                <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Notes</span>
                  <textarea rows={2} value={b.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="What stayed with you" className={input} /></label>
              </>
            )}
          </div>

          {error && <div className="mt-3 text-xs font-bold text-rose-500">{error}</div>}

          <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
            {b.id && onDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-zinc-500">Delete this book?</span>
                  <button type="button" onClick={() => onDelete(b.id!)} className="px-3 h-8 rounded-lg bg-rose-500 text-white">Delete</button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700">Keep</button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="px-3 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-rose-500">Delete book</button>
              )
            ) : <span />}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-bold">Cancel</button>
              <button type="button" onClick={save} className="px-5 h-11 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold">{b.id ? 'Save changes' : 'Add book'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
