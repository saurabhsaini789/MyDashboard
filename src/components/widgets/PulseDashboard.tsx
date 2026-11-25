"use client";

import React, { useEffect } from 'react';
import { PageTitle, Description } from '@/components/ui/Text';
import { useSystemPulse } from '@/hooks/useSystemPulse';
import { PriorityQueue } from './PriorityQueue';
import { StrategicFocus } from './StrategicFocus';
import { JournalCard } from './JournalCard';
import { PulseDataDependencies } from '@/lib/pulse-logic';

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



    const tone = pulse.score >= 80
        ? { text: 'text-emerald-500', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' }
        : pulse.score >= 50
        ? { text: 'text-amber-500', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' }
        : { text: 'text-rose-500', chip: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' };
    const barTone = (v: number) => v >= 75 ? 'bg-emerald-500' : v >= 40 ? 'bg-amber-500' : 'bg-rose-500';

    // Compact gauge: a 270° arc.
    const r = 26, circ = 2 * Math.PI * r, track = circ * 0.75, fill = track * (pulse.score / 100);

    return (
        <div className="fade-in mb-14">
            {/* Header with System Pulse as a compact strip beside the title */}
            <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex min-w-0 flex-col items-start">
                    <PageTitle>Today Actions</PageTitle>
                    <Description>Command center for your system&apos;s health and daily momentum.</Description>
                </div>

                <div className="flex flex-col gap-3 self-start lg:self-auto xl:flex-row xl:items-stretch">
                <JournalCard />
                <div className="flex items-center gap-5 rounded-2xl border border-zinc-200/80 bg-white px-5 py-3 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900">
                    <div className="relative h-16 w-16 shrink-0" title="System Pulse">
                        <svg viewBox="0 0 64 64" className="h-full w-full">
                            <circle cx={32} cy={32} r={r} fill="none" strokeWidth="6" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800"
                                strokeDasharray={`${track} ${circ}`} strokeLinecap="round" transform="rotate(135 32 32)" />
                            <circle cx={32} cy={32} r={r} fill="none" strokeWidth="6" stroke="currentColor" className={tone.text}
                                strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(135 32 32)" style={{ transition: 'stroke-dasharray 1s ease' }} />
                        </svg>
                        <span className={`absolute inset-0 flex items-center justify-center text-xl font-black tabular-nums ${tone.text}`}>{pulse.score}</span>
                    </div>
                    <div className="flex flex-col gap-1 whitespace-nowrap">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">System pulse</span>
                        <span className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${tone.chip}`}>{pulse.scoreLabel}</span>
                    </div>
                    <div className="hidden h-10 w-px bg-zinc-100 dark:bg-zinc-800 sm:block" />
                    <div className="hidden w-40 flex-col gap-2 sm:flex">
                        {[['Health readiness', pulse.stats.healthReadiness], ['Goal health', pulse.stats.goalHealth]].map(([label, v]) => (
                            <div key={label as string}>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-zinc-400">
                                    <span>{label}</span><span className="tabular-nums text-zinc-600 dark:text-zinc-300">{Math.round(v as number)}%</span>
                                </div>
                                <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                    <div className={`h-full rounded-full ${barTone(v as number)}`} style={{ width: `${v}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
                {/* Priority queue, with a badge showing where each item comes from */}
                <PriorityQueue actions={pulse.actions} />

                {/* Strategic Focus: what you're working on now and what's coming up */}
                <StrategicFocus pulse={pulse} />
            </div>
        </div>
    );
}