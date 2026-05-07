"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutGrid,
  List,
  Plus, 
  Search, 
  Languages, 
  Tag, 
  Clock,
  CheckCircle2,
  Book as BookIcon,
} from 'lucide-react';

import { Book } from '@/types/books';
import { BookModal } from './BookModal';
import { setSyncedItem } from '@/lib/storage';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { Text } from '../ui/Text';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

// --- Book Item Component ---

interface BookItemProps {
  book: Book;
  onEdit: (book: Book) => void;
}

function BookItem({ book, onEdit }: BookItemProps) {
  const getStatusStyle = (status: Book['status']) => {
    switch (status) {
      case 'Planned': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-100';
      case 'Reading': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-100';
      case 'Completed': return 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 border-teal-100';
      default: return 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 border-zinc-100';
    }
  };

  const getStatusIcon = (status: Book['status']) => {
    switch (status) {
      case 'Planned': return <Clock size={12} />;
      case 'Reading': return <BookIcon size={12} />;
      case 'Completed': return <CheckCircle2 size={12} />;
      default: return null;
    }
  };

  return (
    <div
      className="group flex items-center gap-4 sm:gap-6 p-4 sm:p-5 mb-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl transition-all hover:shadow-md cursor-pointer"
      onClick={() => onEdit(book)}
    >
      <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
        <Text variant="label" as="span" className="opacity-50 text-[9px] sm:text-[11px]">Pos</Text>
        <Text variant="body" as="span" className="font-bold text-sm sm:text-lg leading-none">{book.order}</Text>
      </div>

      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-6">
        <Text variant="body" as="h4" className="text-base sm:text-lg font-bold truncate sm:max-w-[50%] group-hover:text-teal-600 transition-colors">
          {book.name}
        </Text>
        <div className="flex items-center gap-4 sm:gap-6 sm:border-l-2 border-zinc-100 dark:border-zinc-800/50 sm:pl-6 overflow-x-auto no-scrollbar">
          <Text variant="label" as="span" className="font-semibold whitespace-nowrap text-xs sm:text-sm opacity-70 sm:opacity-100">{book.author}</Text>
          <Text variant="label" as="span" className="flex items-center gap-2 font-semibold whitespace-nowrap text-xs sm:text-sm opacity-70 sm:opacity-100"><Languages size={12} className="opacity-40" />{book.language}</Text>
        </div>
      </div>

      <Text 
        variant="label"
        as="div"
        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold border flex items-center gap-2 transition-colors text-xs sm:text-sm shrink-0 ${getStatusStyle(book.status)}`}
      >
        {getStatusIcon(book.status)}
        {book.status}
      </Text>
    </div>
  );
}

// --- Book Card Component ---

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
}

function BookCard({ book, onEdit }: BookCardProps) {
  const getStatusStyle = (status: Book['status']) => {
    switch (status) {
      case 'Planned': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-100';
      case 'Reading': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-100';
      case 'Completed': return 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 border-teal-100';
      default: return 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 border-zinc-100';
    }
  };

  return (
    <div 
      onClick={() => onEdit(book)}
      className="group flex flex-col bg-white dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 hover:border-teal-500/30 transition-all cursor-pointer relative shadow-sm hover:-translate-y-1 h-full"
    >
      <div className="flex flex-col gap-4 relative z-10 h-full">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Text variant="label" as="span" className="font-semibold opacity-60 uppercase tracking-wider text-[10px]">{book.language}</Text>
              {book.category && (
                <Text variant="label" as="span" className="font-bold text-teal-600 opacity-80 flex items-center gap-1 text-[10px] uppercase">
                  <Tag size={10} />
                  {book.category}
                </Text>
              )}
            </div>
            <Text variant="body" as="h4" className="text-xl font-bold leading-tight group-hover:text-teal-600 transition-colors line-clamp-2">{book.name}</Text>
            <Text variant="label" as="div" className="font-semibold mt-1 opacity-70">{book.author}</Text>
          </div>
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 group-hover:bg-teal-50 transition-colors">
            <Text variant="body" as="span" className="font-bold text-sm">#{book.order}</Text>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
          <Text 
            variant="label"
            as="div"
            className={`px-2.5 py-1 rounded-full font-bold text-[10px] border flex items-center gap-1 uppercase transition-colors ${getStatusStyle(book.status)}`}
          >
            {book.status}
          </Text>
        </div>
      </div>
    </div>
  );
}

interface ReadingQueueProps {
  onPromote?: (book: Book) => void;
}

export function ReadingQueue({ onPromote }: ReadingQueueProps) {
  const books = useStorageSubscription<Book[]>(SYNC_KEYS.BOOKS_QUEUE, []);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const saveBooks = (newBooks: Book[]) => {
    setSyncedItem(SYNC_KEYS.BOOKS_QUEUE, JSON.stringify(newBooks));
  };

  const handleAddBook = (newBook: Book) => {
    const bookWithId = {
      ...newBook,
      id: crypto.randomUUID(),
      order: newBook.order || (books.length + 1),
      createdAt: new Date().toISOString()
    };
    saveBooks([...books, bookWithId]);
  };

  const handleUpdateBook = (updatedBook: Book) => {
    saveBooks(books.map(b => b.id === updatedBook.id ? updatedBook : b));
    if (updatedBook.status === 'Completed' && onPromote) {
      onPromote(updatedBook);
    }
  };

  const handleDeleteBook = (id: string) => {
    saveBooks(books.filter(b => b.id !== id));
  };

  const sortedAndFilteredBooks = useMemo(() => {
    return [...books]
      .filter(b => 
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.author || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.category && b.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        b.language.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [books, searchQuery]);

  if (!isLoaded) return <div className="h-40 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-3xl" />;

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Search queue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 shadow-sm transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl flex items-center gap-1 shadow-inner border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 text-teal-500 shadow-sm' : 'text-zinc-400'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-teal-500 shadow-sm' : 'text-zinc-400'}`}
            >
              <List size={18} />
            </button>
          </div>

          <button
            onClick={() => setIsAdding(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-900 dark:bg-teal-600 text-white px-6 py-2.5 rounded-2xl text-sm font-bold hover:scale-[1.02] transition-all shadow-sm"
          >
            <Plus size={18} />
            Add Book
          </button>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar pb-2">
        {books.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center gap-4">
            <Text variant="title" as="h3" className="text-xl">Empty Queue</Text>
            <button onClick={() => setIsAdding(true)} className="text-sm font-bold text-teal-600 uppercase">Add your first book</button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
            {sortedAndFilteredBooks.map((book) => (
              viewMode === 'grid' ? <BookCard key={book.id} book={book} onEdit={setSelectedBook} /> : <BookItem key={book.id} book={book} onEdit={setSelectedBook} />
            ))}
          </div>
        )}
      </div>

      {(selectedBook || isAdding) && (
        <BookModal
          mode={isAdding ? 'create' : 'edit'}
          book={selectedBook || {
            id: '',
            order: books.length + 1,
            name: '',
            author: '',
            language: 'English',
            category: 'Self-help',
            status: 'Planned',
            createdAt: new Date().toISOString()
          }}
          onClose={() => {
            setSelectedBook(null);
            setIsAdding(false);
          }}
          onUpdateBook={isAdding ? handleAddBook : handleUpdateBook}
          onDeleteBook={handleDeleteBook}
        />
      )}
    </div>
  );
}
