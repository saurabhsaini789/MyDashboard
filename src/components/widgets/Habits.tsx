"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { setSyncedItem } from '@/lib/storage';
import { Modal } from '../ui/Modal';
import { DynamicForm } from '../ui/DynamicForm';
import { Text } from '../ui/Text';
import { Baby, Flame, Zap } from 'lucide-react';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

type HabitStatus = 'none' | 'done' | 'missed';

interface Habit {
  id: string;
  name: string;
  records: Record<string, HabitStatus[]>;
  monthScope?: string[];
}

interface HabitsProps {
  onHabitSelect?: (habit: Habit | null) => void;
}

const defaultInitialHabits: Habit[] = [
  { id: '1', name: 'No Phone AM', records: {} },
  { id: '2', name: 'No Fap', records: {} },
  { id: '3', name: 'Brush AM', records: {} },
  { id: '4', name: 'Shower AM', records: {} },
  { id: '5', name: 'Exercise AM', records: {} },
  { id: '6', name: 'Meditate AM', records: {} },
  { id: '7', name: 'Work Log', records: {} },
  { id: '8', name: 'Home Call', records: {} },
  { id: '9', name: 'Book (Eng)', records: {} },
  { id: '10', name: 'Book (Hin)', records: {} },
  { id: '11', name: 'Side Project', records: {} },
  { id: '12', name: 'Portfolio', records: {} },
  { id: '13', name: 'Learning', records: {} },
  { id: '15', name: 'Insta Post', records: {} },
  { id: '16', name: 'LinkedIn Post', records: {} },
  { id: '17', name: 'LinkedIn Network', records: {} },
  { id: '18', name: 'Exercise PM', records: {} },
  { id: '19', name: 'Meditate PM', records: {} },
  { id: '20', name: 'Daily Log', records: {} },
  { id: '21', name: 'Brush PM', records: {} },
  { id: '22', name: 'No Phone PM', records: {} },
  { id: '23', name: 'Activity', records: {} },
  { id: '24', name: 'Adventure', records: {} },
];

const HabitRow = React.memo(({ 
  habit, 
  monthKey, 
  daysInMonth, 
  isCurrentViewRealTodayMonth, 
  todayDateIndex, 
  onDayClick, 
  onHabitSelect, 
  onDelete,
  calcStreak 
}: { 
  habit: Habit, 
  monthKey: string, 
  daysInMonth: number, 
  isCurrentViewRealTodayMonth: boolean, 
  todayDateIndex: number, 
  onDayClick: (habitId: string, dayIndex: number, e: React.MouseEvent) => void,
  onHabitSelect?: (habit: Habit) => void,
  onDelete: (habit: Habit) => void,
  calcStreak: (habit: Habit) => number
}) => {
  const days = habit.records?.[monthKey] || [];
  const completed = days.filter((d: string) => d === 'done').length;
  const missed = days.filter((d: string) => d === 'missed').length;
  const score = completed - missed;
  const streak = useMemo(() => calcStreak(habit), [habit, calcStreak]);

  return (
    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800/50 transition-colors">
      <td className="p-4 sticky left-0 z-20 bg-white dark:bg-zinc-900 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800/50 border-r border-zinc-100 dark:border-zinc-800/50 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:text-teal-600 transition-colors"
            onClick={() => onHabitSelect?.(habit)}
          >
            {streak >= 2 && <span className="text-[10px] bg-orange-50 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400 px-1.5 py-0.5 rounded-full"><Flame className="w-2.5 h-2.5 inline" />{streak}</span>}
            <span className="text-sm text-zinc-900 dark:text-zinc-100">{habit.name}</span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(habit);
            }} 
            className="text-zinc-300 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
      {Array.from({ length: daysInMonth }).map((_, i) => {
        const status = days[i] || 'none';
        return (
          <td key={i} className={`p-0.5 text-center transition-colors duration-300 ${isCurrentViewRealTodayMonth && i === todayDateIndex ? 'bg-teal-500/10 dark:bg-teal-500/20 border-x border-teal-500/10 dark:border-teal-500/20' : ''}`}>
            <button 
              onClick={e => onDayClick(habit.id, i, e)} 
              className="w-10 h-10 md:w-8 md:h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center group mx-auto"
            >
              <div className={`rounded-full transition-all ${
                status === 'done' 
                  ? 'w-4 h-4 md:w-3 md:h-3 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                  : status === 'missed' 
                    ? 'w-4 h-4 md:w-3 md:h-3 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' 
                    : 'w-2 h-2 md:w-1.5 md:h-1.5 bg-zinc-200 dark:bg-zinc-700 group-hover:scale-125'
              }`} />
            </button>
          </td>
        );
      })}
      <td className="p-4 sticky right-0 z-10 bg-white dark:bg-zinc-900 border-l border-zinc-100 dark:border-zinc-800/50 text-right hidden md:table-cell">
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${score > 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-teal-400' : score < 0 ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
          {score > 0 ? `+${score}` : score}
        </span>
      </td>
    </tr>
  );
});

HabitRow.displayName = 'HabitRow';

export function Habits({ onHabitSelect }: HabitsProps = {}) {
  const rawHabits = useStorageSubscription<any[]>('os_habits', []);
  
  // Migration & Default logic
  const syncedHabits = useMemo(() => {
    if (!rawHabits || rawHabits.length === 0) return defaultInitialHabits;
    
    return rawHabits.map((h: any) => {
      const records = h.records || {};
      
      // Migrate legacy boolean arrays
      if (h.days) {
        const legacyKey = `${new Date().getFullYear()}-${new Date().getMonth()}`;
        if (!records[legacyKey]) {
           records[legacyKey] = h.days.map((d: any) => d === true ? 'done' : d === false ? 'none' : d);
        }
        delete h.days;
      }
      
      return { ...h, records };
    });
  }, [rawHabits]);

  // Local state for optimistic updates
  const [localHabits, setLocalHabits] = useState<Habit[]>(syncedHabits);
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Sync local habits with storage when storage changes (external update)
  useEffect(() => {
    if (isFirstRender) {
      setLocalHabits(syncedHabits);
      setIsFirstRender(false);
      return;
    }
    // Only update local state if it differs from synced state (avoid overwriting during local edits)
    const syncedJson = JSON.stringify(syncedHabits);
    const localJson = JSON.stringify(localHabits);
    if (syncedJson !== localJson) {
      setLocalHabits(syncedHabits);
    }
  }, [syncedHabits]);

  // Debounced storage sync
  useEffect(() => {
    const timer = setTimeout(() => {
      const syncedJson = JSON.stringify(syncedHabits);
      const localJson = JSON.stringify(localHabits);
      if (localJson !== syncedJson) {
        setSyncedItem('os_habits', localJson);
      }
    }, 800); // 800ms debounce
    return () => clearTimeout(timer);
  }, [localHabits, syncedHabits]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedScope, setSelectedScope] = useState<'this-month' | 'next-1' | 'next-2' | 'next-3' | 'next-6' | 'this-year' | 'all'>('this-month');
  const [isFillTodayConfirm, setIsFillTodayConfirm] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthKey = `${currentYear}-${currentMonth}`;

  // For highlighting today
  const realToday = new Date();
  const isCurrentViewRealTodayMonth = realToday.getFullYear() === currentYear && realToday.getMonth() === currentMonth;
  const todayDateIndex = realToday.getDate() - 1;

  const updateHabits = (newHabits: Habit[]) => {
    setLocalHabits(newHabits);
  };

  const getScopeMonths = (scope: typeof selectedScope, baseDate: Date) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const months: string[] = [];
    if (scope === 'all') return undefined;

    let count = 0;
    if (scope === 'this-month') count = 1;
    else if (scope === 'next-1') count = 2;
    else if (scope === 'next-2') count = 3;
    else if (scope === 'next-3') count = 4;
    else if (scope === 'next-6') count = 7;
    else if (scope === 'this-year') count = 12 - month;

    for (let i = 0; i < count; i++) {
      const d = new Date(year, month + i, 1);
      months.push(`${d.getFullYear()}-${d.getMonth()}`);
    }
    return months;
  };

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return;
    const scope = getScopeMonths(selectedScope, currentDate);
    const newHabit: Habit = {
      id: Math.random().toString(36).substr(2, 9),
      name: newHabitName.trim(),
      records: {},
      monthScope: scope
    };
    updateHabits([...localHabits, newHabit]);
    setNewHabitName('');
    setIsAddingHabit(false);
  };

  const handleDeleteHabit = () => {
    if (!habitToDelete) return;
    if (selectedScope === 'all') {
      updateHabits(localHabits.filter(h => h.id !== habitToDelete.id));
    } else {
      const monthsToRemove = getScopeMonths(selectedScope, currentDate) || [];
      updateHabits(localHabits.map(h => {
        if (h.id === habitToDelete.id) {
          return {
            ...h,
            monthScope: (h.monthScope || []).filter((m: string) => !monthsToRemove.includes(m))
          };
        }
        return h;
      }).filter(h => !h.monthScope || h.monthScope.length > 0)); 
    }
    setHabitToDelete(null);
  };

  const visibleHabits = localHabits.filter(h => {
    if (!h.monthScope || h.monthScope.length === 0) return true;
    return h.monthScope.includes(monthKey);
  });

  const handleDayClick = useCallback((habitId: string, dayIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    setLocalHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const newRecords = { ...h.records };
        const monthDays = newRecords[monthKey] ? [...newRecords[monthKey]] : Array(daysInMonth).fill('none');
        const current = monthDays[dayIndex];
        
        if (current === 'none') monthDays[dayIndex] = 'done';
        else if (current === 'done') monthDays[dayIndex] = 'missed';
        else monthDays[dayIndex] = 'none';
        
        newRecords[monthKey] = monthDays;
        return { ...h, records: newRecords };
      }
      return h;
    }));
  }, [monthKey, daysInMonth]);

  const handleFillToday = useCallback(() => {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate([10, 30, 10]);
    }
    const today = new Date();
    const tKey = `${today.getFullYear()}-${today.getMonth()}`;
    const tIdx = today.getDate() - 1;
    const tDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    setLocalHabits(prev => prev.map(h => {
      const isActive = !h.monthScope || h.monthScope.length === 0 || h.monthScope.includes(tKey);
      if (!isActive) return h;
      const newRecords = { ...h.records };
      const monthDays = newRecords[tKey] ? [...newRecords[tKey]] : Array(tDays).fill('none');
      monthDays[tIdx] = 'done';
      newRecords[tKey] = monthDays;
      return { ...h, records: newRecords };
    }));
    setIsFillTodayConfirm(false);
  }, []);

  const datesOfMonth = Array.from({ length: daysInMonth }, (_, i) => ({
    date: i + 1,
    dayName: new Date(currentYear, currentMonth, i + 1).toLocaleDateString('en-US', { weekday: 'short' }),
  }));

  const months = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' }));
  const years = Array.from({ length: 10 }, (_, i) => 2026 + i);

  useEffect(() => {
    if (isCurrentViewRealTodayMonth && scrollContainerRef.current) {
        const timer = setTimeout(() => {
          const container = scrollContainerRef.current;
          if (!container) return;
          
          const todayElement = container.querySelector(`[data-date-index="${todayDateIndex}"]`) as HTMLElement;
          if (todayElement) {
            const isMobile = window.innerWidth < 768;
            
            let scrollPosition = 0;
            if (isMobile) {
              // Centered in the second half of the screen (excluding the 150px habit column)
              const habitColumnWidth = 150;
              const containerWidth = container.offsetWidth;
              const visibleWidth = containerWidth - habitColumnWidth;
              const centerOfVisible = habitColumnWidth + (visibleWidth / 2);
              const todayCenter = todayElement.offsetLeft + (todayElement.offsetWidth / 2);
              scrollPosition = todayCenter - centerOfVisible;
            } else {
              // Standard center for desktop
              scrollPosition = todayElement.offsetLeft - container.offsetWidth / 2 + todayElement.offsetWidth / 2;
            }
            
            container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
          }
        }, 100); // 100ms delay to ensure layout is ready
        return () => clearTimeout(timer);
    }
  }, [currentMonth, currentYear, isCurrentViewRealTodayMonth, todayDateIndex, visibleHabits.length]);

  const calcCurrentStreak = useCallback((habit: Habit): number => {
    const today = new Date();
    const streakDate = new Date(today);
    const todayKey = `${today.getFullYear()}-${today.getMonth()}`;
    const todayStatus = habit.records?.[todayKey]?.[today.getDate() - 1];

    if (!todayStatus || todayStatus === 'none') streakDate.setDate(streakDate.getDate() - 1);

    let streak = 0;
    for (let i = 0; i < 500; i++) {
        const k = `${streakDate.getFullYear()}-${streakDate.getMonth()}`;
        const idx = streakDate.getDate() - 1;
        const isActive = !habit.monthScope || habit.monthScope.length === 0 || habit.monthScope.includes(k);
        if (!isActive) break;
        if (habit.records?.[k]?.[idx] === 'done') { streak++; streakDate.setDate(streakDate.getDate() - 1); }
        else break;
    }
    return streak;
  }, []);

  // Badge is now managed centrally by PulseDashboard (Priority Queue count)

  return (
    <div className="w-full pb-12 flex flex-col gap-4 font-bold uppercase">
      {/* Date Selectors & Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 mb-4">
        <div className="flex gap-3">
          <select value={currentMonth} onChange={e => setCurrentDate(new Date(currentYear, parseInt(e.target.value), 1))} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 p-2 rounded-xl border-none cursor-pointer">
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={currentYear} onChange={e => setCurrentDate(new Date(parseInt(e.target.value), currentMonth, 1))} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 p-2 rounded-xl border-none cursor-pointer">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsAddingHabit(true)} className="bg-teal-500 text-white px-6 py-2.5 rounded-xl transition-all hover:scale-105">+ Add Habit</button>
          {isCurrentViewRealTodayMonth && <button onClick={() => setIsFillTodayConfirm(true)} className="bg-amber-500 text-white px-5 py-2.5 rounded-xl transition-all hover:scale-105"><Zap className="w-4 h-4 inline mr-2" />Today Done</button>}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div ref={scrollContainerRef} className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="sticky top-0 z-40 bg-zinc-50 dark:bg-zinc-900">
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="p-4 sticky left-0 top-0 z-50 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 min-w-[150px] text-zinc-900 dark:text-zinc-100">Habit</th>
                {datesOfMonth.map((d, i) => (
                  <th 
                    key={i} 
                    data-date-index={i} 
                    className={`p-2 text-center text-[10px] min-w-[44px] md:min-w-[40px] transition-colors sticky top-0 bg-zinc-50 dark:bg-zinc-900 z-40 ${
                      isCurrentViewRealTodayMonth && i === todayDateIndex 
                        ? 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border-x border-teal-500/10' 
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {d.dayName}<br/>{d.date}
                  </th>
                ))}
                <th className="p-4 sticky right-0 top-0 z-50 bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 text-right hidden md:table-cell text-zinc-900 dark:text-zinc-100">Score</th>
              </tr>
            </thead>
            <tbody>
              {visibleHabits.map(h => (
                <HabitRow 
                  key={h.id}
                  habit={h}
                  monthKey={monthKey}
                  daysInMonth={daysInMonth}
                  isCurrentViewRealTodayMonth={isCurrentViewRealTodayMonth}
                  todayDateIndex={todayDateIndex}
                  onDayClick={handleDayClick}
                  onHabitSelect={onHabitSelect}
                  onDelete={setHabitToDelete}
                  calcStreak={calcCurrentStreak}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddingHabit} onClose={() => setIsAddingHabit(false)} title="New Habit" onSubmit={handleAddHabit}>
         <DynamicForm sections={[{id:'h', fields:[{name:'name', label:'Habit Name', type:'text', required:true}, {name:'scope', label:'Scope', type:'select', options:[{value:'this-month',label:'This Month'},{value:'all',label:'All Time'}]}]}]} formData={{name:newHabitName, scope:selectedScope}} onChange={(n,v)=>{if(n==='name')setNewHabitName(v);if(n==='scope')setSelectedScope(v as any)}} />
      </Modal>

      {habitToDelete && <Modal isOpen={true} onClose={()=>setHabitToDelete(null)} title="Delete Habit" onSubmit={handleDeleteHabit} submitText="Confirm Delete"><p>Delete <b>{habitToDelete.name}</b>?</p></Modal>}
      {isFillTodayConfirm && <Modal isOpen={true} onClose={()=>setIsFillTodayConfirm(false)} title="Fill Today" onSubmit={handleFillToday} submitText="Mark Done"><p>Mark all active habits as <b>done</b> for today?</p></Modal>}
    </div>
  );
}

import { Trash2 } from 'lucide-react';
