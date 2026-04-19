"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { ExpenseRecord } from '@/types/finance';
import { PantryEntryModal } from './PantryEntryModal';
import { Modal } from '../ui/Modal';

interface PantryCalendarProps {
  records: ExpenseRecord[];
  onUpdateRecords: (records: ExpenseRecord[]) => void;
  viewingDate: Date;
  setViewingDate: (date: Date) => void;
}

export function PantryCalendar({ records, onUpdateRecords, viewingDate, setViewingDate }: PantryCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExpenseRecord | null>(null);
  const [preferredTab, setPreferredTab] = useState<'list' | 'form' | undefined>(undefined);
  const [isMobilePopupOpen, setIsMobilePopupOpen] = useState(false);
  const [popupDateStr, setPopupDateStr] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const month = viewingDate.getMonth();
  const year = viewingDate.getFullYear();

  // Stable calculations that don't depend on "today" to avoid hydration mismatch
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const recordsByDate = useMemo(() => {
    const grouped: Record<string, ExpenseRecord[]> = {};
    records.forEach(r => {
      if (!grouped[r.date]) grouped[r.date] = [];
      grouped[r.date].push(r);
    });
    return grouped;
  }, [records]);

  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(recordsByDate).forEach(([date, dateRecords]) => {
      totals[date] = dateRecords.reduce((sum, r) => sum + r.amount, 0);
    });
    return totals;
  }, [recordsByDate]);

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setPopupDateStr(dateStr);
      setIsMobilePopupOpen(true);
    } else {
      setEditingRecord(null);
      setPreferredTab(undefined);
      setIsModalOpen(true);
    }
  };

  const getDayColor = (total: number) => {
    if (total === 0) return '';
    if (total < 500) return 'bg-emerald-50 border-emerald-100 text-emerald-700';
    if (total < 2000) return 'bg-amber-50 border-amber-100 text-amber-700';
    return 'bg-rose-50 border-rose-100 text-rose-700';
  };

  if (!isMounted) return <div className="min-h-[400px] animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-3xl" />;

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col gap-8 w-full font-bold uppercase transition-all duration-500">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 md:p-10 shadow-sm">
        <div className="grid grid-cols-7 gap-1 md:gap-4 border-b pb-4 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-[10px] text-zinc-400 font-bold">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-4">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} className="h-10 md:h-32" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const ds = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const total = dailyTotals[ds] || 0;
            const itemsOnDay = recordsByDate[ds] || [];
            const isToday = todayStr === ds;

            return (
              <div key={day} onClick={() => handleDateClick(ds)} className={`relative h-11 md:h-32 rounded-xl border flex flex-col p-1 md:p-4 cursor-pointer transition-all hover:scale-[1.02] ${total > 0 ? getDayColor(total) : 'bg-zinc-50 border-transparent hover:bg-zinc-100'} ${isToday ? 'ring-2 ring-zinc-900 shadow-xl' : ''}`}>
                <div className="flex justify-between items-start"><span className="text-[10px] md:text-sm">{day}</span>{total > 0 && <span className="hidden md:inline text-xs">${total.toLocaleString()}</span>}</div>
                <div className="mt-2 hidden md:flex flex-col gap-1 overflow-hidden">{itemsOnDay.slice(0, 2).map((r, idx) => <span key={idx} className="text-[10px] truncate opacity-60">{r.vendor || r.category}</span>)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && <PantryEntryModal isOpen={isModalOpen} date={selectedDate} recordsOnDate={selectedDate ? recordsByDate[selectedDate] || [] : []} onClose={() => { setIsModalOpen(false); setEditingRecord(null); setPreferredTab(undefined); }} onUpdateRecords={onUpdateRecords} allRecords={records} initialRecord={editingRecord} initialTab={preferredTab} />}
      <Modal isOpen={isMobilePopupOpen && !!popupDateStr} onClose={() => setIsMobilePopupOpen(false)} title="Pantry Details" isReadonly={true}>
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
          {popupDateStr && recordsByDate[popupDateStr]?.map(r => (
            <div key={r.id} onClick={() => { setEditingRecord(r); setPreferredTab('form'); setIsMobilePopupOpen(false); setIsModalOpen(true); }} className="flex justify-between p-4 bg-zinc-50 rounded-2xl font-bold uppercase cursor-pointer">
              <div className="flex flex-col"><span className="text-sm">{r.vendor || r.subcategory}</span><span className="text-[10px] text-zinc-400">{r.category}</span></div>
              <span className="text-lg">${r.amount.toLocaleString()}</span>
            </div>
          ))}
          <button onClick={() => { setEditingRecord(null); setPreferredTab('form'); setIsMobilePopupOpen(false); setIsModalOpen(true); }} className="p-4 bg-zinc-900 text-white rounded-2xl font-bold uppercase text-xs mt-4">Add Entry</button>
        </div>
      </Modal>
    </div>
  );
}
