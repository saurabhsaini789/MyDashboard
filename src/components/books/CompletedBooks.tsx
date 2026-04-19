"use client";

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Search, 
  Plus, 
  Languages, 
  Calendar, 
  ThumbsUp, 
  ThumbsDown,
  Quote,
  LayoutGrid,
  List as ListIcon,
  BookCheck,
  Library,
  Tag
} from 'lucide-react';

import { CompletedBook } from '@/types/books';
import { CompletedBookModal } from './CompletedBookModal';
import { setSyncedItem } from '@/lib/storage';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { Text } from '../ui/Text';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

export function CompletedBooks() {
  const books = useStorageSubscription<CompletedBook[]>(SYNC_KEYS.BOOKS_COMPLETED, []);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<CompletedBook | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const saveBooks = (newBooks: CompletedBook[]) => {
    setSyncedItem(SYNC_KEYS.BOOKS_COMPLETED, JSON.stringify(newBooks));
  };

  const handleAddBook = (newBook: CompletedBook) => {
    const bookWithId = {
      ...newBook,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    saveBooks([bookWithId, ...books]);
  };

  const handleUpdateBook = (updatedBook: CompletedBook) => {
    saveBooks(books.map(b => b.id === updatedBook.id ? updatedBook : b));
  };

  const handleDeleteBook = (id: string) => {
    saveBooks(books.filter(b => b.id !== id));
  };

  const filteredBooks = (books || []).filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoaded) return <div className="h-96 animate-pulse bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800"></div>;

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input
            type="text"
            placeholder="Search titles, insights, or ratings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-[1.25rem] pl-12 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-teal-500/50 shadow-sm transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl flex items-center gap-1 shadow-inner">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 text-teal-500 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 text-teal-500 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
            >
              <ListIcon size={20} />
            </button>
          </div>
          
          <button
            onClick={() => setIsAdding(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-2xl text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
          >
            <Plus size={20} />
            Add Completed
          </button>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-950 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-teal-50 dark:bg-teal-500/10 rounded-[1.75rem] flex items-center justify-center text-teal-500 shadow-inner">
            <Star size={40} fill="currentColor" />
          </div>
          <div className="max-w-md px-6">
            <Text variant="title" as="h3" className="text-2xl">Capture Your Best Insights</Text>
            <Text variant="label" as="p" className="mt-2 opacity-60">
              The real value of reading is in the notes and ratings you keep.
            </Text>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="text-teal-600 dark:text-teal-400 font-semibold hover:underline text-xs uppercase"
          >
            Log your first book
          </button>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3 pb-2'}>
            {filteredBooks.map((book) => (
              <BookCard 
                key={book.id} 
                book={book} 
                viewMode={viewMode}
                onEdit={() => setSelectedBook(book)} 
              />
            ))}
            {filteredBooks.length === 0 && (
              <Text variant="bodySmall" as="p" className="col-span-full text-center py-10 italic opacity-50 font-medium">
                No completed books match your search.
              </Text>
            )}
          </div>
        </div>
      )}

      {books.length > 0 && (
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6 font-bold uppercase">
          <StatCard 
            icon={<BookCheck className="text-teal-500" size={24} />}
            value={books.length.toString()}
            description="Total finished"
          />
          <StatCard 
            icon={<Library className="text-rose-500" size={24} />}
            value={`${books.filter(b => b.language === 'Hindi').length} / ${books.filter(b => b.language === 'English').length}`}
            description="Hindi / English"
          />
        </div>
      )}

      {/* Modals */}
      {(selectedBook || isAdding) && (
        <CompletedBookModal
          mode={isAdding ? 'create' : 'edit'}
          book={selectedBook || {
            id: '',
            name: '',
            author: '',
            language: 'English',
            completionDate: new Date().toISOString().split('T')[0],
            rating: 5,
            notes: '',
            wouldRecommend: true,
            category: 'Self-help',
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

function BookCard({ book, viewMode, onEdit }: { book: CompletedBook, viewMode: 'grid' | 'list', onEdit: () => void }) {
  if (viewMode === 'list') {
    return (
      <div 
        onClick={onEdit}
        className="group flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer"
      >
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-xl text-amber-500 group-hover:bg-amber-50 dark:group-hover:bg-amber-500/10 transition-colors">
          <div className="flex items-center gap-1">
            <Text variant="body" as="span" className="text-lg font-semibold leading-none">{book.rating}</Text>
            <Star size={14} fill="currentColor" className="mb-0.5" />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-4">
          <Text variant="body" as="h4" className="text-base font-bold truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors shrink-0 max-w-[40%]">
            {book.name}
          </Text>
          <div className="flex items-center gap-4 border-l-2 border-zinc-100 dark:border-zinc-800/50 pl-4 overflow-x-auto no-scrollbar">
            <Text variant="label" as="span" className="font-semibold whitespace-nowrap">{book.author}</Text>
            <Text variant="label" as="span" className="flex items-center gap-1.5 font-semibold whitespace-nowrap"><Languages size={12} className="opacity-40" />{book.language}</Text>
            <Text variant="label" as="span" className="flex items-center gap-1.5 font-semibold whitespace-nowrap"><Calendar size={12} className="opacity-40" />{new Date(book.completionDate).toLocaleDateString()}</Text>
          </div>
        </div>

        <Text 
          variant="label"
          as="div"
          className={`px-3 py-1.5 rounded-full font-bold border flex items-center gap-1.5 transition-colors ${ book.wouldRecommend ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 border-teal-100' : 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 border-zinc-100' }`}
        >
          {book.wouldRecommend ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
          {book.wouldRecommend ? 'Recommended' : 'Mixed'}
        </Text>
      </div>
    );
  }

  return (
    <div 
      onClick={onEdit}
      className="group flex flex-col bg-white dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 hover:border-teal-500/30 transition-all cursor-pointer relative overflow-hidden shadow-sm hover:-translate-y-1"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
      <div className="flex flex-col gap-5 relative z-10">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Text variant="label" as="span" className="font-semibold opacity-60 text-[10px] sm:text-xs">{book.language}</Text>
              <Text variant="label" as="span" className="font-semibold text-teal-600 dark:text-teal-400 opacity-80 flex items-center gap-1 text-[10px] sm:text-xs"><Tag size={10} />{book.category}</Text>
            </div>
            <Text variant="title" as="h4" className="text-xl sm:text-2xl leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{book.name}</Text>
            <Text variant="label" as="div" className="font-semibold mt-2">{book.author}</Text>
          </div>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} className={i < book.rating ? "text-amber-500" : "text-zinc-200 dark:text-zinc-800"} fill={i < book.rating ? "currentColor" : "none"} />
            ))}
          </div>
        </div>
        <div className="h-px bg-zinc-100 dark:bg-zinc-800 w-full"></div>
        <div className="relative">
          <Quote className="absolute -left-2 -top-2 text-teal-500/10 rotate-180" size={32} />
          <Text variant="body" as="p" className="text-sm font-medium line-clamp-3 italic opacity-80">"{book.notes}"</Text>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <Text variant="label" as="div" className="font-semibold flex items-center gap-2"><Calendar size={12} className="opacity-40" />{new Date(book.completionDate).toLocaleDateString()}</Text>
          {book.wouldRecommend && <Text variant="label" as="div" className="px-3 py-1 rounded-full font-semibold bg-teal-50 dark:bg-teal-500/10 text-teal-600">Recommended</Text>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, description }: { icon: React.ReactNode, value: string, description: string }) {
  return (
    <div className="bg-white dark:bg-zinc-950 border-2 border-zinc-50 dark:border-zinc-900 p-6 rounded-2xl flex items-center gap-6 shadow-sm group relative overflow-hidden">
      <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-500">{icon}</div>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
        <Text variant="body" as="h4" className="text-lg font-bold truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{description}</Text>
        <Text variant="title" as="p" className="text-3xl shrink-0">{value}</Text>
      </div>
    </div>
  );
}
