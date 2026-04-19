"use client";

import React from 'react';
import { AlertCircle, Clock, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { type BusinessChannel } from '@/types/business';
import { Text, SectionTitle } from '../ui/Text';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

export function Insights() {
  const channels = useStorageSubscription<BusinessChannel[]>(SYNC_KEYS.FINANCES_BUSINESS, []);

  const generateInsights = () => {
    const insights: { type: 'urgent' | 'warning' | 'positive', icon: React.ReactNode, message: string }[] = [];
    const activeChannels = channels.filter(c => c.status === 'Active');
    
    if (activeChannels.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const onTrackChannels = activeChannels.filter(c => {
      const due = new Date(c.nextPostDueDate || '');
      due.setHours(0, 0, 0, 0);
      return due >= today;
    }).length;

    insights.push({
      type: onTrackChannels === activeChannels.length ? 'positive' : 'warning',
      icon: <TrendingUp size={16} />,
      message: `You are on track for ${onTrackChannels} out of ${activeChannels.length} active channels this week.`
    });

    const overdue = activeChannels.filter(c => {
      const due = new Date(c.nextPostDueDate || '');
      due.setHours(0, 0, 0, 0);
      return due < today;
    });

    if (overdue.length > 0) {
      insights.push({
        type: 'urgent',
        icon: <AlertCircle size={16} />,
        message: overdue.length === 1 
          ? `"${overdue[0].name}" is overdue. Post now to maintain momentum.` 
          : `${overdue.length} channels are overdue. Your consistency is dropping.`
      });
    }

    const mostConsistent = activeChannels.reduce((prev, curr) => {
      const prevDate = new Date(prev.lastPostedDate || 0);
      const currDate = new Date(curr.lastPostedDate || 0);
      return currDate > prevDate ? curr : prev;
    }, activeChannels[0]);

    if (mostConsistent && new Date(mostConsistent.lastPostedDate || 0) >= sevenDaysAgo) {
      insights.push({
        type: 'positive',
        icon: <Sparkles size={16} />,
        message: `"${mostConsistent.name}" is your most consistent channel right now. Keep it up!`
      });
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dueTomorrow = activeChannels.filter(c => {
      const due = new Date(c.nextPostDueDate || '');
      due.setHours(0, 0, 0, 0);
      return due.getTime() === tomorrow.getTime();
    });

    if (dueTomorrow.length > 0) {
      insights.push({
        type: 'warning',
        icon: <Clock size={16} />,
        message: `Preparation: ${dueTomorrow.length} ${dueTomorrow.length === 1 ? 'post is' : 'posts are'} due tomorrow.`
      });
    }

    if (overdue.length === 0 && onTrackChannels === activeChannels.length) {
      insights.push({
        type: 'positive',
        icon: <CheckCircle2 size={16} />,
        message: "Perfect Streak! All channels are currently on schedule."
      });
    }

    return insights.slice(0, 6);
  };

  const insightsList = generateInsights();
  if (insightsList.length === 0) return null;

  return (
    <section className="w-full">
      <div className="flex flex-col mb-6 px-2">
        <SectionTitle>Insights</SectionTitle>
        <Text variant="label" className="mt-1">Quick, actionable guidance for your content activity</Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insightsList.map((insight, idx) => (
          <div key={idx} className={`flex items-start gap-4 p-5 rounded-2xl border transition-all shadow-sm bg-white dark:bg-zinc-900 ${
            insight.type === 'urgent' ? 'border-rose-100' : insight.type === 'warning' ? 'border-amber-100' : 'border-emerald-100'
          }`}>
            <div className={`mt-1 p-2 rounded-xl ${
              insight.type === 'urgent' ? 'text-rose-500 bg-rose-50' : insight.type === 'warning' ? 'text-amber-500 bg-amber-50' : 'text-emerald-500 bg-emerald-50'
            }`}>{insight.icon}</div>
            <div className="flex flex-col gap-0.5 mt-1">
              <span className={`text-[10px] font-bold uppercase ${
                insight.type === 'urgent' ? 'text-rose-500' : insight.type === 'warning' ? 'text-amber-500' : 'text-emerald-500'
              }`}>{insight.type}</span>
              <Text variant="body" className="font-bold leading-tight">{insight.message}</Text>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
