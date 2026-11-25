import React from 'react';
import type { LibraryBook } from '@/types/books';
import { coverColor, isHindiCover } from '@/lib/books-library';
import { devanagari, display } from './fonts';

interface Props {
  book: Pick<LibraryBook, 'title' | 'author' | 'titleHi' | 'authorHi' | 'language'>;
  /** Cover width in px; every other measurement scales from it. */
  width?: number;
  children?: React.ReactNode;
}

/** A drawn book cover. Hindi books print their Devanagari title and author. */
export function BookCover({ book, width = 44, children }: Props) {
  const w = width;
  const hindi = isHindiCover(book as LibraryBook);
  const small = w < 60;
  const titleText = (hindi ? book.titleHi : book.title) || 'Title';
  const authorText = (hindi && book.authorHi ? book.authorHi : book.author) || '';

  return (
    <div
      aria-hidden="true"
      className={`${hindi ? devanagari.className : display.className} relative shrink-0 overflow-hidden flex flex-col justify-between text-white`}
      style={{
        width: w,
        height: w * 1.5,
        background: coverColor(book.title || 'Title'),
        borderRadius: `${w * 0.04}px ${w * 0.1}px ${w * 0.1}px ${w * 0.04}px`,
        padding: `${w * 0.1}px ${w * 0.08}px ${w * 0.1}px ${w * 0.16}px`,
        fontSize: w * (hindi ? 0.15 : small ? 0.16 : 0.13),
        fontWeight: 800,
        lineHeight: hindi ? 1.3 : 1.1,
        wordBreak: 'break-word',
        boxShadow: `inset ${w * 0.06}px 0 0 rgba(0,0,0,.22), 0 6px 14px -8px rgba(0,0,0,.55)`,
      }}
    >
      <span>{titleText}</span>
      {w >= 80 && <span className="absolute h-px bg-white/35" style={{ left: '16%', right: '10%', top: '52%' }} />}
      {!small && <span style={{ fontSize: '0.7em', fontWeight: hindi ? 500 : 600, opacity: 0.85 }}>{authorText}</span>}
      {children}
    </div>
  );
}
