"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Zap, 
  Calendar, 
  ShieldAlert, 
  ChevronRight, 
  Target,
  ArrowUpRight
} from 'lucide-react';
import { Text, SectionTitle } from '@/components/ui/Text';
import { useSystemPulse } from '@/hooks/useSystemPulse';
import { PriorityTier, PulseDataDependencies, PLATFORM_ABBREV } from '@/lib/pulse-logic';

interface PulseDashboardProps {
  initialData: PulseDataDependencies;
}

export function PulseDashboard({ initialData }: PulseDashboardProps) {
    const pulse = useSystemPulse(initialData);

    // ── App Badge (Priority Queue count) ─────────────────────────────────
    // Works on: Android Chrome PWA ✅ | iOS Safari PWA (16.4+) ✅
    // iOS Chrome PWA: requests notification permission first (required by Apple)
    useEffect(() => {
        if (typeof window === 'undefined' || !('navigator' in window)) return;

        const count = pulse.actions.length;

        const applyBadge = async () => {
            try {
                // iOS requires Notification permission before setAppBadge will show
                if ('Notification' in window && Notification.permission === 'default') {
                    try {
                        await Notification.requestPermission();
                    } catch (_) {
                        // User dismissed — badge may still work on some browsers
                    }
                }

                // 1. Direct Badging API call (works on Android Chrome & iOS Safari PWA)
                if ('setAppBadge' in navigator) {
                    if (count > 0) {
                        await (navigator as any).setAppBadge(count);
                    } else {
                        await (navigator as any).clearAppBadge();
                    }
                }

                // 2. Also tell the Service Worker to set the badge
                //    (belt-and-suspenders for Chrome iOS PWA context)
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'SET_BADGE',
                        count,
                    });
                }
            } catch (err) {
                console.error('Badge update error:', err);
            }
        };

        applyBadge();
    }, [pulse.actions.length]);
    // ─────────────────────────────────────────────────────────────────────

    const tierColors: Record<PriorityTier, string> = {
        CRITICAL: 'text-rose-600 bg-rose-50/80 dark:bg-rose-500/10 dark:text-rose-400 border-rose-100/50 dark:border-rose-500/20',
        DAILY: 'text-teal-600 bg-teal-50/80 dark:bg-teal-500/10 dark:text-teal-400 border-teal-100/50 dark:border-teal-500/20',
        MAINTENANCE: 'text-zinc-500 bg-zinc-50/80 dark:bg-zinc-800/50 dark:text-zinc-400 border-zinc-200/50 dark:border-zinc-700/50'
    };

    return (
        <div className="fade-in grid grid-cols-1 lg:grid-cols-12 gap-6 mb-14">
            
            {/* 1. Pulse Index Gauge */}
            <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 flex flex-col items-center justify-center shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-zinc-100 dark:bg-zinc-800">
                    <div 
                        className={`h-full transition-all duration-1000 ${pulse.score >= 80 ? 'bg-emerald-500' : pulse.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${pulse.score}%` }}
                    />
                </div>
                
                <Activity className="text-zinc-300 dark:text-zinc-700 mb-4 group-hover:text-teal-500/50 transition-colors" size={32} />
                <Text variant="label" className="uppercase tracking-widest text-[10px] text-zinc-400 mb-1">System Pulse</Text>
                <div className="flex items-baseline gap-1">
                    <Text variant="display" className="text-5xl font-black tabular-nums">{pulse.score}</Text>
                    <Text variant="bodySmall" className="text-zinc-400 font-bold">%</Text>
                </div>
                <div className={`mt-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tighter ${
                    pulse.score >= 80 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                    pulse.score >= 50 ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 
                    'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                }`}>
                    {pulse.scoreLabel}
                </div>
                
                <div className="mt-6 w-full space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight text-zinc-400">
                        <span>Health Readiness</span>
                        <span className="text-zinc-600 dark:text-zinc-300">{Math.round(pulse.stats.healthReadiness)}%</span>
                    </div>
                    <div className="h-1 bg-zinc-50 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-300 dark:bg-zinc-600 rounded-full" style={{ width: `${pulse.stats.healthReadiness}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight text-zinc-400">
                        <span>Goal Health</span>
                        <span className="text-zinc-600 dark:text-zinc-300">{Math.round(pulse.stats.goalHealth)}%</span>
                    </div>
                    <div className="h-1 bg-zinc-50 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-300 dark:bg-zinc-600 rounded-full" style={{ width: `${pulse.stats.goalHealth}%` }} />
                    </div>
                </div>
            </div>

            {/* 2. Priority Matrix (Queue) */}
            <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col">
                <div className="flex items-baseline justify-between mb-6">
                    <SectionTitle className="mb-0 text-lg">Priority</SectionTitle>
                    <Text variant="bodySmall" className="text-zinc-400 font-medium">
                        {pulse.actions.length} items
                    </Text>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[192px] pr-2 custom-scrollbar">
                    {pulse.actions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-8 opacity-40">
                            <ShieldAlert size={40} className="mb-2 text-zinc-300" />
                            <Text variant="bodySmall" className="text-center">All systems operational</Text>
                        </div>
                    ) : (
                        pulse.actions.map((action) => (
                            <Link
                                key={action.id}
                                href={action.href}
                                className="group flex flex-col gap-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all hover:bg-white dark:hover:bg-zinc-800 shadow-sm relative overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 w-1 h-full ${
                                    action.tier === 'CRITICAL' ? 'bg-rose-500' : 
                                    action.tier === 'DAILY' ? 'bg-teal-500' : 'bg-zinc-400'
                                }`} />
                                <div className="flex items-center justify-between pl-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {action.platform && (
                                            <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
                                                {PLATFORM_ABBREV[action.platform] ?? action.platform.slice(0, 3).toUpperCase()}
                                            </span>
                                        )}
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${tierColors[action.tier]}`}>
                                            {action.tier}
                                        </span>
                                    </div>
                                </div>
                                <Text variant="bodySmall" className="pl-2 font-semibold group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                                    {action.label}
                                </Text>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* 3. Strategic Focus (Execution & Horizon) */}
            <div className="lg:col-span-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col relative overflow-hidden group">
                <Text variant="label" className="uppercase tracking-widest text-[10px] text-zinc-400 mb-6">Strategic Focus</Text>
                
                <div className="flex flex-col sm:flex-row gap-8 flex-1">
                    {/* The Now: Active Execution */}
                    <div className="flex-1 flex flex-col sm:border-r border-zinc-100 dark:border-zinc-800/50 sm:pr-8">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                            <Text variant="bodySmall" className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Active Execution</Text>
                        </div>
                        {pulse.activeMilestone ? (
                            <div className="flex-1 flex flex-col">
                                <Text variant="title" className="text-xl font-bold leading-tight mb-3 text-zinc-900 dark:text-white line-clamp-2">
                                    {pulse.activeMilestone.title}
                                </Text>
                                <div className="inline-block px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase w-fit mb-6">
                                    {pulse.activeMilestone.bucket}
                                </div>
                                <div className="mt-auto">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight text-zinc-400 mb-2">
                                        <span>Progress</span>
                                        <span className="text-teal-600 dark:text-teal-400">{pulse.activeMilestone.progress}%</span>
                                    </div>
                                    <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-teal-500 rounded-full transition-all duration-1000" style={{ width: `${pulse.activeMilestone.progress}%` }} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-40 text-center py-6">
                                <Target size={28} className="mb-3 text-zinc-400" />
                                <Text variant="bodySmall" className="text-[12px]">No active projects</Text>
                            </div>
                        )}
                    </div>

                    {/* The Horizon: Pipeline */}
                    <div className="flex-[1.2] flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <Text variant="bodySmall" className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">The Horizon</Text>
                        </div>
                        
                        {pulse.upcomingMilestones && pulse.upcomingMilestones.length > 0 ? (
                            <div className="flex-1 flex flex-col justify-center gap-4 relative">
                                {/* Connecting line */}
                                <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-zinc-100 dark:bg-zinc-800" />
                                
                                {pulse.upcomingMilestones.map((ms, idx) => (
                                    <div key={ms.id} className="flex items-center gap-4 relative z-10">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 bg-white dark:bg-zinc-900 ${idx === 0 ? 'border-teal-500 text-teal-500' : 'border-zinc-300 dark:border-zinc-700 text-zinc-400'}`}>
                                            <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-teal-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0 flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
                                            <div className="flex flex-col min-w-0">
                                                <Text variant="bodySmall" className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                                    {ms.title}
                                                </Text>
                                                <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 mt-0.5">
                                                    <span>{ms.bucket}</span>
                                                </div>
                                            </div>
                                            <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg ${idx === 0 ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                                                {ms.daysDesc}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-40 text-center py-6">
                                <Calendar size={28} className="mb-3 text-zinc-400" />
                                <Text variant="bodySmall" className="text-[12px]">Pipeline clear</Text>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* View Roadmap Link */}
                <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/50 flex justify-end">
                    <Link href="/goals" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-all group">
                        View Roadmap <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
