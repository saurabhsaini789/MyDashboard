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
 Hash
} from 'lucide-react';

import { Book } from '@/types/books';
import { BookModal } from './BookModal';
import { setSyncedItem } from '@/lib/storage';
import { getPrefixedKey } from '@/lib/keys';
import { Text } from '../ui/Text';

// --- Book Item Component ---

interface BookItemProps {
 book: Book;
 onEdit: (book: Book) => void;
}

function BookItem({ book, onEdit }: BookItemProps) {
 const getStatusStyle = (status: Book['status']) => {
 switch (status) {
 case 'Planned': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
 case 'Reading': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20';
 case 'Completed': return 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-500/20';
 default: return 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-500/20';
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
 className="group flex items-center gap-4 p-4 mb-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 pointer-events-auto cursor-pointer"
 onClick={() => onEdit(book)}
 >
 {/* Priority Number */}
 <div className="flex-shrink-0 w-10 h-10 flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500 dark:text-zinc-400 group-hover:bg-teal-50 dark:group-hover:bg-teal-500/10 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
 <Text variant="label" as="span" className="opacity-50 mb-0.5">Pos</Text>
 <Text variant="body" as="span" className="font-semibold leading-none">{book.order}</Text>
 </div>

 {/* Name & Details - Single Line Layout */}
 <div className="flex-1 min-w-0 flex items-center gap-4">
 <Text variant="body" as="h4" className="text-base font-bold truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors shrink-0 max-w-[40%]">
 {book.name}
 </Text>
 
 <div className="flex items-center gap-4 border-l-2 border-zinc-100 dark:border-zinc-800/50 pl-4 overflow-x-auto no-scrollbar">
 <Text variant="label" as="span" className="font-semibold whitespace-nowrap">
 {book.author || 'Unknown Author'}
 </Text>
 <Text variant="label" as="span" className="flex items-center gap-1.5 font-semibold whitespace-nowrap">
 <Languages size={12} className="text-zinc-300 dark:text-zinc-700" />
 {book.language}
 </Text>
 {book.category && (
 <Text variant="label" as="span" className="flex items-center gap-1.5 font-semibold whitespace-nowrap">
 <Tag size={12} className="text-zinc-300 dark:text-zinc-700" />
 {book.category}
 </Text>
 )}
 </div>
 </div>

 {/* Status Badge */}
 <Text 
 variant="label"
 as="div"
 className={`px-3 py-1.5 rounded-full font-semibold border flex items-center gap-1.5 transition-colors ${getStatusStyle(book.status)}`}
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
      case 'Planned': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
      case 'Reading': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20';
      case 'Completed': return 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-500/20';
      default: return 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-500/20';
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
      onClick={() => onEdit(book)}
      className="group flex flex-col bg-white dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 hover:border-teal-500/30 transition-all cursor-pointer relative overflow-hidden shadow-sm hover:-translate-y-1 h-full"
    >
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 -mr-12 -mt-12 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

      <div className="flex flex-col gap-4 relative z-10 h-full">
        {/* Header: Title & Position */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Text variant="label" as="span" className="font-semibold opacity-60 uppercase tracking-wider text-[10px]">{book.language}</Text>
              {book.category && (
                <Text variant="label" as="span" className="font-bold text-teal-600 dark:text-teal-400 opacity-80 flex items-center gap-1 text-[10px] uppercase">
                  <Tag size={10} />
                  {book.category}
                </Text>
              )}
            </div>
            <Text variant="body" as="h4" className="text-xl font-bold leading-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
              {book.name}
            </Text>
            <Text variant="label" as="div" className="font-semibold mt-1 opacity-70">
              {book.author || 'Unknown Author'}
            </Text>
          </div>
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 group-hover:bg-teal-50 dark:group-hover:bg-teal-500/10 transition-colors">
            <Text variant="body" as="span" className="font-bold text-sm">#{book.order}</Text>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
          <Text 
            variant="label"
            as="div"
            className={`px-2.5 py-1 rounded-full font-bold text-[10px] border flex items-center gap-1 uppercase transition-colors ${getStatusStyle(book.status)}`}
          >
            {getStatusIcon(book.status)}
            {book.status}
          </Text>
          
          <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
            <Text variant="label" as="span" className="text-[10px] font-bold uppercase tracking-tighter">View Details</Text>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReadingQueueProps {
 onPromote?: (book: Book) => void;
}

export function ReadingQueue({ onPromote }: ReadingQueueProps) {
 const [books, setBooks] = useState<Book[]>([]);
 const [isLoaded, setIsLoaded] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedBook, setSelectedBook] = useState<Book | null>(null);
 const [isAdding, setIsAdding] = useState(false);
 const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
 const booksRef = React.useRef(books);

 useEffect(() => {
 booksRef.current = books;
 }, [books]);

 // Load data
 useEffect(() => {
 const stored = localStorage.getItem(getPrefixedKey('os_books_queue'));
 if (stored) {
 try {
 const parsed = JSON.parse(stored);
 setBooks(Array.isArray(parsed) ? parsed : []);
 } catch (e) {
 console.error('Failed to parse books queue data', e);
 }
 }
 setIsLoaded(true);

 const handleLocalUpdate = (e: any) => {
 if (e.detail && e.detail.key === 'os_books_queue') {
 const val = localStorage.getItem(getPrefixedKey('os_books_queue'));
 if (val) {
 try {
 const newVal = JSON.parse(val);
 if (JSON.stringify(newVal) !== JSON.stringify(booksRef.current)) {
 setBooks(newVal);
 }
 } catch (e) {}
 }
 }
 };

 window.addEventListener('local-storage-change', handleLocalUpdate);
 return () => window.removeEventListener('local-storage-change', handleLocalUpdate);
 }, []);

  // Persistent View Mode
  useEffect(() => {
    const savedView = localStorage.getItem('os_books_queue_view');
    if (savedView === 'grid' || savedView === 'list') {
      setViewMode(savedView);
    }
  }, []);

  const toggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('os_books_queue_view', mode);
  };

 // Save data
 useEffect(() => {
 if (isLoaded) {
 setSyncedItem('os_books_queue', JSON.stringify(books));
 }
 }, [books, isLoaded]);

 const handleAddBook = (newBook: Book) => {
 const bookWithId = {
 ...newBook,
 id: crypto.randomUUID(),
 // Use provided order if it's not the default or if we want to honor it
 order: newBook.order || (books.length + 1),
 createdAt: new Date().toISOString()
 };
 setBooks([...books, bookWithId]);
 };

 const handleUpdateBook = (updatedBook: Book) => {
 setBooks(books.map(b => b.id === updatedBook.id ? updatedBook : b));
 
 if (updatedBook.status === 'Completed' && onPromote) {
 onPromote(updatedBook);
 }
 };

 const handleDeleteBook = (id: string) => {
 setBooks(books.filter(b => b.id !== id));
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
 {/* Controls */}
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
 <div className="relative w-full sm:max-w-md">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
 <input
 type="text"
 placeholder="Search books, authors, categories or languages..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 shadow-sm transition-all"
 />
 </div>
  
  <div className="flex items-center gap-3 w-full sm:w-auto">
    <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl flex items-center gap-1 shadow-inner border border-zinc-200 dark:border-zinc-700">
      <button
        onClick={() => toggleViewMode('grid')}
        className={`p-1.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 text-teal-500 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
        title="Grid View"
      >
        <LayoutGrid size={18} />
      </button>
      <button
        onClick={() => toggleViewMode('list')}
        className={`p-1.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-teal-500 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
        title="List View"
      >
        <List size={18} />
      </button>
    </div>

    <button
    onClick={() => setIsAdding(true)}
    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-2.5 rounded-2xl text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/10 dark:shadow-white/5"
    >
    <Plus size={18} />
    Add Book
    </button>
  </div>
 </div>

 {/* Queue List Container with Scrolling */}
 <div className="relative">
 {books.length === 0 ? (
 <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center gap-4">
 <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center text-zinc-400">
 <BookIcon size={32} />
 </div>
 <div>
 <Text variant="title" as="h3" className="text-xl">Your queue is empty</Text>
 <Text variant="body" as="p" className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
 Start your intentional reading journey by adding books you plan to read.
 </Text>
 </div>
 <button
 onClick={() => setIsAdding(true)}
 className="mt-2 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline"
 >
 Add your first book
 </button>
 </div>
 ) : (
  <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar fade-in pb-2">
  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
  {sortedAndFilteredBooks.map((book) => (
  viewMode === 'grid' ? (
    <BookCard 
      key={book.id} 
      book={book} 
      onEdit={setSelectedBook}
    />
  ) : (
    <BookItem 
      key={book.id} 
      book={book} 
      onEdit={setSelectedBook}
    />
  )
  ))}
  </div>
  {sortedAndFilteredBooks.length === 0 && (
  <p className="text-center py-10 text-zinc-500 italic">No books match your search.</p>
  )}
  </div>
 )}
 </div>

 <style jsx global>{`
 .custom-scrollbar::-webkit-scrollbar {
 width: 5px;
 }
 .custom-scrollbar::-webkit-scrollbar-track {
 background: transparent;
 }
 .custom-scrollbar::-webkit-scrollbar-thumb {
 background: #e4e4e7;
 border-radius: 10px;
 }
 .dark .custom-scrollbar::-webkit-scrollbar-thumb {
 background: #27272a;
 }
 .custom-scrollbar::-webkit-scrollbar-thumb:hover {
 background: #d4d4d8;
 }
 .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
 background: #3f3f46;
 }
 `}</style>

 {/* Modals */}
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
