"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  BookOpen, 
  CheckCircle2, 
  Search,
  Plus,
  Clock
} from 'lucide-react';
import { MultiYearLogData, YearlyLogData, LogBookEntry } from '@/types/books';
import { setSyncedItem } from '@/lib/storage';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { Text } from '../ui/Text';
import { Modal } from '../ui/Modal';
import { DynamicForm, FormSchemaField } from '../ui/DynamicForm';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type Status = LogBookEntry['status'];

const STATUS_ICONS: Record<Status, React.ReactNode> = {
  'Completed': <CheckCircle2 size={14} className="text-teal-500" />,
  'Reading': <BookOpen size={14} className="text-blue-500" />,
  'Planned': <Clock size={14} className="text-amber-500" />,
  'None': null
};

const STATUS_OPTIONS: Status[] = ['None', 'Planned', 'Reading', 'Completed'];

export function YearlyReadingLog({ onPromote }: { onPromote?: (book: LogBookEntry, language: 'English' | 'Hindi') => void }) {
  const data = useStorageSubscription<MultiYearLogData>(SYNC_KEYS.BOOKS_YEARLY_LOG, {});
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [modalState, setModalState] = useState<{ 
    isOpen: boolean; 
    month: string; 
    type: 'english' | 'hindi'; 
    category?: string; 
    originalQueueId?: string; 
  } | null>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const saveLog = (newData: MultiYearLogData) => {
    setSyncedItem(SYNC_KEYS.BOOKS_YEARLY_LOG, JSON.stringify(newData));
  };

  const getYearData = (year: number): YearlyLogData => {
    return data[year] || {};
  };

  const updateBook = (month: string, type: 'english' | 'hindi', bookId: string, updates: Partial<LogBookEntry>) => {
    const yearData = { ...(data[currentYear] || {}) };
    const monthData = { ...(yearData[month] || { englishBooks: [], hindiBooks: [] }) };
    const key = type === 'english' ? 'englishBooks' : 'hindiBooks';
    
    monthData[key] = monthData[key].map(book => {
      if (book.id === bookId) {
        const updatedBook = { ...book, ...updates };
        if (updates.status === 'Completed' && book.status !== 'Completed' && onPromote) {
          onPromote(updatedBook, type === 'english' ? 'English' : 'Hindi');
        }
        return updatedBook;
      }
      return book;
    });

    yearData[month] = monthData;
    saveLog({ ...data, [currentYear]: yearData });
  };

  const openAddModal = (month: string, type: 'english' | 'hindi') => {
    setModalState({ isOpen: true, month, type });
  };

  const handleModalSave = (title: string, author: string, status: Status) => {
    if (!modalState) return;
    const { month, type } = modalState;
    
    const yearData = { ...(data[currentYear] || {}) };
    const monthData = { ...(yearData[month] || { englishBooks: [], hindiBooks: [] }) };
    const key = type === 'english' ? 'englishBooks' : 'hindiBooks';
    
    const newBook: LogBookEntry = {
      id: crypto.randomUUID(),
      title,
      author,
      category: modalState.category,
      status,
      originalQueueId: modalState.originalQueueId
    };
    
    monthData[key] = [...monthData[key], newBook];
    yearData[month] = monthData;
    saveLog({ ...data, [currentYear]: yearData });
    setModalState(null);
  };

  const removeBook = (month: string, type: 'english' | 'hindi', bookId: string) => {
    const yearData = { ...(data[currentYear] || {}) };
    const monthData = { ...(yearData[month] || { englishBooks: [], hindiBooks: [] }) };
    const key = type === 'english' ? 'englishBooks' : 'hindiBooks';
    
    monthData[key] = monthData[key].filter(b => b.id !== bookId);
    yearData[month] = monthData;
    saveLog({ ...data, [currentYear]: yearData });
  };

  if (!isLoaded) return <div className="h-96 animate-pulse bg-white dark:bg-zinc-900 rounded-2xl"></div>;

  const yearData = getYearData(currentYear);

  return (
    <div className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden fade-in">
      <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentYear(y => y - 1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 text-zinc-500 active:scale-95 transition-all"><ChevronLeft size={20} /></button>
          <Text variant="title" as="div" className="text-2xl min-w-[100px] text-center font-bold">{currentYear}</Text>
          <button onClick={() => setCurrentYear(y => y + 1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 text-zinc-500 active:scale-95 transition-all"><ChevronRight size={20} /></button>
          <button onClick={() => setIsMobileExpanded(!isMobileExpanded)} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 border border-teal-500/20 active:scale-95 transition-all">{isMobileExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
        </div>

        <div className="flex flex-1 items-center gap-4 w-full sm:max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search yearly log..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="grid grid-cols-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 font-bold uppercase">
          <Text variant="label" as="div" className="col-span-2 px-6 py-4 border-r text-center">Month</Text>
          <Text variant="label" as="div" className="col-span-5 px-6 py-4 border-r text-center">English</Text>
          <Text variant="label" as="div" className="col-span-5 px-6 py-4 text-center">Hindi</Text>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {MONTHS.map((month) => {
            const entry = yearData[month] || { englishBooks: [], hindiBooks: [] };
            const filteredEnglish = (entry.englishBooks || []).filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || (b.author || '').toLowerCase().includes(searchQuery.toLowerCase()));
            const filteredHindi = (entry.hindiBooks || []).filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || (b.author || '').toLowerCase().includes(searchQuery.toLowerCase()));

            if (searchQuery && filteredEnglish.length === 0 && filteredHindi.length === 0) return null;
            
            return (
              <div key={month} className="grid grid-cols-12 hover:bg-zinc-50/50 transition-colors group/row">
                <Text variant="label" as="div" className="col-span-2 px-6 py-4 border-r flex items-center justify-center font-bold text-zinc-400 uppercase">{month.slice(0, 3)}</Text>
                <div className="col-span-5 px-4 py-4 border-r flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    {!searchQuery && <button onClick={() => openAddModal(month, 'english')} className="w-6 h-6 flex items-center justify-center rounded-lg border border-dashed border-zinc-300 text-zinc-400 hover:text-teal-500 hover:border-teal-500/50 transition-all"><Plus size={12} /></button>}
                  </div>
                  {filteredEnglish.map(book => (
                    <EditableBookRow key={book.id} book={book} onUpdate={(u) => updateBook(month, 'english', book.id, u)} onRemove={() => removeBook(month, 'english', book.id)} placeholder="Title..." />
                  ))}
                </div>
                <div className="col-span-5 px-4 py-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    {!searchQuery && <button onClick={() => openAddModal(month, 'hindi')} className="w-6 h-6 flex items-center justify-center rounded-lg border border-dashed border-zinc-300 text-zinc-400 hover:text-rose-500 hover:border-rose-500/50 transition-all"><Plus size={12} /></button>}
                  </div>
                  {filteredHindi.map(book => (
                    <EditableBookRow key={book.id} book={book} onUpdate={(u) => updateBook(month, 'hindi', book.id, u)} onRemove={() => removeBook(month, 'hindi', book.id)} placeholder="Title..." />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`block lg:hidden overflow-hidden ${ (isMobileExpanded || searchQuery) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0' } transition-all duration-500`}>
        {MONTHS.map((month) => {
          const entry = yearData[month] || { englishBooks: [], hindiBooks: [] };
          const filteredEnglish = (entry.englishBooks || []).filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));
          const filteredHindi = (entry.hindiBooks || []).filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));
          if (searchQuery && filteredEnglish.length === 0 && filteredHindi.length === 0) return null;
          return (
            <div key={month} className="p-4 border-b dark:border-zinc-800">
              <Text variant="label" as="div" className="font-bold mb-4 uppercase text-teal-600">{month}</Text>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase text-zinc-400"><span>English</span>{!searchQuery && <button onClick={()=>openAddModal(month,'english')}><Plus size={12}/></button>}</div>
                  {filteredEnglish.map(b => <EditableBookRow key={b.id} book={b} onUpdate={(u)=>updateBook(month,'english',b.id,u)} onRemove={()=>removeBook(month,'english',b.id)} placeholder="Title..." />)}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase text-zinc-400"><span>Hindi</span>{!searchQuery && <button onClick={()=>openAddModal(month,'hindi')}><Plus size={12}/></button>}</div>
                  {filteredHindi.map(b => <EditableBookRow key={b.id} book={b} onUpdate={(u)=>updateBook(month,'hindi',b.id,u)} onRemove={()=>removeBook(month,'hindi',b.id)} placeholder="Title..." />)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {modalState && modalState.isOpen && (
        <AddLogBookModal
          month={modalState.month}
          type={modalState.type}
          onClose={() => setModalState(null)}
          onSave={(t, a, s) => handleModalSave(t, a, s)}
        />
      )}
    </div>
  );
}

function EditableBookRow({ book, onUpdate, onRemove, placeholder }: { 
  book: LogBookEntry, 
  onUpdate: (updates: Partial<LogBookEntry>) => void,
  onRemove: () => void,
  placeholder: string 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(book.title);
  const [localAuthor, setLocalAuthor] = useState(book.author || '');

  const handleSubmit = () => {
    if (localTitle !== book.title || localAuthor !== book.author) {
      onUpdate({ title: localTitle, author: localAuthor });
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-2 group/book animate-in fade-in slide-in-from-left-2 duration-300 w-full">
      <div className="flex-shrink-0 group/status relative">
        <button className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all border ${ book.status === 'None' ? 'border-zinc-200 text-zinc-300' : 'border-emerald-100 bg-emerald-50 text-emerald-600' }`}>
          {STATUS_ICONS[book.status] || <Plus size={12} />}
        </button>
        <div className="absolute left-0 top-full mt-1 z-20 hidden group-hover/status:flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 rounded-xl shadow-xl p-1 w-32">
          {STATUS_OPTIONS.map((opt) => (
            <button key={opt} onClick={() => onUpdate({ status: opt })} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-zinc-100 transition-colors">
              {STATUS_ICONS[opt] || <div className="w-3.5 h-3.5 border border-zinc-200 rounded-full"></div>}
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex flex-col gap-1">
            <input autoFocus value={localTitle} onChange={(e) => setLocalTitle(e.target.value)} onBlur={handleSubmit} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} className="w-full bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1 text-xs font-bold focus:ring-1 focus:ring-teal-500/30" />
            <input value={localAuthor} onChange={(e) => setLocalAuthor(e.target.value)} onBlur={handleSubmit} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} className="w-full bg-zinc-50 dark:bg-zinc-900/50 rounded px-2 py-0.5 text-[10px] uppercase font-bold text-zinc-500" />
          </div>
        ) : (
          <div onClick={() => setIsEditing(true)} className="cursor-pointer transition-colors flex items-center gap-1.5 min-w-0">
            <Text variant="body" as="span" className={`text-sm sm:text-base font-bold truncate ${ book.title ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-300 italic' }`}>{book.title || placeholder}</Text>
            {book.author && <Text variant="label" as="span" className="font-bold text-zinc-400 text-xs truncate">— {book.author}</Text>}
          </div>
        )}
      </div>

      <button onClick={onRemove} className="opacity-0 group-hover/book:opacity-100 p-1 text-rose-300 hover:text-rose-500 transition-all"><Plus size={12} className="rotate-45" /></button>
    </div>
  );
}

function AddLogBookModal({ month, type, onClose, onSave }: { month: string; type: 'english' | 'hindi'; onClose: () => void; onSave: (title: string, author: string, status: Status) => void; }) {
  const [formData, setFormData] = useState({ title: '', author: '', status: 'Planned' });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (formData.title.trim()) onSave(formData.title.trim(), formData.author.trim(), formData.status as Status); };
  return (
    <Modal isOpen={true} onClose={onClose} title={`Add to ${month} log`} onSubmit={handleSubmit}>
      <DynamicForm
        sections={[{ id:'log', title: 'Book Details', fields:[
          { name: 'title', label: 'Book Name', type: 'text', required: true },
          { name: 'author', label: 'Author', type: 'text' },
          { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS.map(opt=>({value:opt, label:opt})) }
        ]}]}
        formData={formData}
        onChange={(n, v) => setFormData(p=>({...p, [n]: v}))}
      />
    </Modal>
  );
}
