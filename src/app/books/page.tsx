"use client";

import React from 'react';
import { BooksDashboard } from '@/components/books/library/BooksDashboard';
import { PageTitle, Description } from '@/components/ui/Text';

export default function BooksPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-teal-500/30 font-sans p-4 md:p-8 xl:p-12 pb-32 transition-colors duration-200">
      <div className="mx-auto w-full max-w-[1680px]">
        <header className="mb-8 flex flex-col items-start">
          <PageTitle>Books</PageTitle>
          <Description>Everything you want to read, own and have read, in one list. Click any book to edit it.</Description>
        </header>
        <div className="fade-in">
          <BooksDashboard />
        </div>
      </div>
    </main>
  );
}
