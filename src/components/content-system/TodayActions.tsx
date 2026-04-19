"use client";

import React from 'react';
import { CheckCircle2, Rocket } from 'lucide-react';
import confetti from 'canvas-confetti';
import { setSyncedItem } from '@/lib/storage';
import { SYNC_KEYS } from '@/lib/sync-keys';
import type { BusinessChannel } from '@/types/business';
import { Text, SectionTitle } from '../ui/Text';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

export function TodayActions() {
  const channels = useStorageSubscription<BusinessChannel[]>(SYNC_KEYS.FINANCES_BUSINESS, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const dueToday = channels.filter(c => 
    c.status === 'Active' && 
    c.nextPostDueDate &&
    c.nextPostDueDate <= todayStr
  );

  const markAsPosted = (id: string) => {
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    
    const updatedChannels = channels.map(c => {
      if (c.id === id) {
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + c.postingFrequency);
        const nextDateISO = nextDate.toISOString().split('T')[0];
        
        return {
          ...c,
          lastPostedDate: todayISO,
          nextPostDueDate: nextDateISO
        };
      }
      return c;
    });

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b']
    });

    setSyncedItem(SYNC_KEYS.FINANCES_BUSINESS, JSON.stringify(updatedChannels));
  };

  return (
    <section className="w-full mb-12">
      <div className="flex items-center gap-3 mb-6">
        <SectionTitle>Today&apos;s actions</SectionTitle>
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-100 rounded-2xl p-8 shadow-sm">
        {dueToday.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dueToday.map(channel => (
              <div key={channel.id} className="group relative border border-zinc-100 rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300 bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Text variant="body" className="font-bold text-lg">{channel.name}</Text>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600">{channel.platform}</span>
                      </div>
                    </div>
                    <div className="bg-teal-500/10 text-teal-600 p-2 rounded-xl"><Rocket size={20} /></div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-zinc-100">
                    <span className="text-[10px] font-bold text-teal-600 uppercase animate-pulse">Post Today</span>
                    <button onClick={() => markAsPosted(channel.id)} className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-xl text-xs font-bold transition-all"><CheckCircle2 size={14} /> Posted</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 border border-zinc-100"><CheckCircle2 size={32} className="text-emerald-500" /></div>
            <Text variant="title" className="text-xl">No posts due today</Text>
            <Text variant="body" className="mt-2 text-zinc-400">You&apos;re all caught up with your content schedule.</Text>
          </div>
        )}
      </div>
    </section>
  );
}
