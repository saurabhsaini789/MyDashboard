"use client";

import React, { useState } from 'react';
import { ReadingQueue } from '@/components/books/ReadingQueue';
import { YearlyReadingLog } from '@/components/books/YearlyReadingLog';
import { CompletedBooks } from '@/components/books/CompletedBooks';
import { CompletedBookModal } from '@/components/books/CompletedBookModal';
import { Book, CompletedBook } from '@/types/books';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { setSyncedItem } from '@/lib/storage';
import { validateLocalData } from '@/lib/security';
import { PageTitle, SectionTitle, Description, Text } from '@/components/ui/Text';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

export default function BooksPage() {
  const booksQueue = useStorageSubscription<Book[]>(SYNC_KEYS.BOOKS_QUEUE, []);
  const completedBooksList = useStorageSubscription<CompletedBook[]>(SYNC_KEYS.BOOKS_COMPLETED, []);
  const [promotedBook, setPromotedBook] = useState<Book | null>(null);

  const handlePromote = (book: Book) => {
    setPromotedBook(book);
  };

  const handleLogPromote = (logBook: { id: string; title: string; author: string; category?: string; originalQueueId?: string }, language: 'English' | 'Hindi') => {
    const completedBookEntry = {
      id: logBook.id,
      order: 0,
      name: logBook.title,
      author: logBook.author,
      language,
      category: logBook.category || 'Other',
      status: 'Completed',
      originalQueueId: logBook.originalQueueId,
      createdAt: new Date().toISOString()
    } as Book & { originalQueueId?: string };
    setPromotedBook(completedBookEntry);
  };

  const finalizePromotion = (completedDetails: CompletedBook) => {
    // 1. Add to Completed Books list
    const updatedCompleted = [completedDetails, ...completedBooksList];
    setSyncedItem(SYNC_KEYS.BOOKS_COMPLETED, JSON.stringify(updatedCompleted));

    // 2. Remove from Queue
    const queueToRemoveFromId = (promotedBook as Book & { originalQueueId?: string })?.originalQueueId || promotedBook?.id;
    
    if (queueToRemoveFromId && !queueToRemoveFromId.toString().startsWith('log-')) {
      const updatedQueue = booksQueue.filter(b => b.id !== queueToRemoveFromId);
      const reindexed = updatedQueue.map((b, i) => ({ ...b, order: i + 1 }));
      setSyncedItem(SYNC_KEYS.BOOKS_QUEUE, JSON.stringify(reindexed));
    }

    setPromotedBook(null);
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-teal-500/30 font-sans p-4 md:p-8 xl:p-12 transition-colors duration-200">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-10 flex flex-col items-start">
          <PageTitle>Books</PageTitle>
          <Description>Track your reading journey, yearly progress, and distilled wisdom.</Description>
        </header>

        <section className="w-full relative fade-in">
          <div className="mb-6"><SectionTitle>Reading Plan</SectionTitle></div>
          <ReadingQueue onPromote={handlePromote} />
        </section>

        <section className="w-full relative mt-20 fade-in">
          <div className="mb-6"><SectionTitle>Yearly Reading Log</SectionTitle></div>
          <YearlyReadingLog onPromote={handleLogPromote} />
        </section>

        <section className="w-full relative mt-20 fade-in">
          <div className="mb-6"><SectionTitle>Completed Books</SectionTitle></div>
          <CompletedBooks />
        </section>

        <div className="mt-24 pt-12 border-t border-dashed border-zinc-200 dark:border-zinc-800 opacity-40">
          <Text variant="label" as="p" className="text-center">End of Library Dashboard</Text>
        </div>
      </div>

      {promotedBook && (
        <CompletedBookModal
          mode="create"
          book={{
            id: crypto.randomUUID(),
            name: promotedBook.name,
            author: promotedBook.author,
            language: promotedBook.language,
            category: promotedBook.category,
            completionDate: new Date().toISOString().split('T')[0],
            rating: 5,
            notes: '',
            wouldRecommend: true,
            createdAt: new Date().toISOString()
          }}
          onClose={() => setPromotedBook(null)}
          onUpdateBook={finalizePromotion}
          onDeleteBook={() => setPromotedBook(null)}
        />
      )}
    </main>
  );
}
