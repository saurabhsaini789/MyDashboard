"use client";

import React, { useEffect } from 'react';
import { Activity } from 'lucide-react';
import { PageTitle, Description } from '@/components/ui/Text';
import { useSystemPulse } from '@/hooks/useSystemPulse';
import { PriorityQueue } from './PriorityQueue';
import { TodayPlan, ComingUp } from './StrategicFocus';
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
        ? { text: 'text-emerald-500', status: 'text-emerald-600 dark:text-emerald-400', tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' }
        : pulse.score >= 50
        ? { text: 'text-amber-500', status: 'text-amber-600 dark:text-amber-400', tile: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' }
        : { text: 'text-rose-500', status: 'text-rose-600 dark:text-rose-400', tile: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300', chip: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' };
    const barTone = (v: number) => v >= 75 ? 'bg-emerald-500' : v >= 40 ? 'bg-amber-500' : 'bg-rose-500';

    // Compact gauge: a 270° arc.
    const r = 26, circ = 2 * Math.PI * r, track = circ * 0.75, fill = track * (pulse.score / 100);

    const bars: [string, number | null][] = [
        ['Health readiness', pulse.stats.healthReadiness],
        ['Projects health', pulse.stats.goalHealth],
        ['Habit consistency', pulse.stats.habitConsistency],
        ['Finance records', pulse.stats.financeHealth],
        ['Content on schedule', pulse.stats.contentHealth],
        ['Journal', pulse.stats.journalHealth],
    ];

    const scored = bars.filter((b): b is [string, number] => b[1] !== null);
    const weakest = [...scored].sort((x, y) => x[1] - y[1])[0];
    const pulseNote = weakest && weakest[1] < 75
        ? `Lowest area: ${weakest[0].toLowerCase()} at ${Math.round(weakest[1])}%`
        : 'All areas in good shape';

    return (
        <div className="fade-in mb-14">
            <header className="mb-6 flex flex-col items-start">
                <PageTitle>Today Actions</PageTitle>
                <Description>Command center for your system&apos;s health and daily momentum.</Description>
            </header>

            {/* System Pulse and Journal, side by side and mirrored */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200/80 bg-white px-5 py-5 shadow-sm sm:px-7 dark:border-zinc-800/80 dark:bg-zinc-900">
                    <div className="flex min-h-14 items-center gap-4 sm:h-14">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone.tile}`}>
                            <Activity size={22} />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">System pulse</span>
                            <span className={`text-lg font-semibold leading-tight ${tone.status}`}>{pulse.scoreLabel}</span>
                            <span className="text-xs text-zinc-500 sm:truncate">{pulseNote}</span>
                        </div>
                        <div className="relative h-14 w-14 shrink-0" title={`System Pulse ${pulse.score} / 100`}>
                            <svg viewBox="0 0 64 64" className="h-full w-full">
                                <circle cx={32} cy={32} r={r} fill="none" strokeWidth="7" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800"
                                    strokeDasharray={`${track} ${circ}`} strokeLinecap="round" transform="rotate(135 32 32)" />
                                <circle cx={32} cy={32} r={r} fill="none" strokeWidth="7" stroke="currentColor" className={tone.text}
                                    strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(135 32 32)" style={{ transition: 'stroke-dasharray 1s ease' }} />
                            </svg>
                            <span className={`absolute inset-0 flex items-center justify-center text-lg font-black tabular-nums ${tone.text}`}>{pulse.score}</span>
                        </div>
                    </div>

                    <div className="grid flex-1 grid-cols-2 content-between gap-x-5 sm:grid-cols-3 sm:gap-x-6 gap-y-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                        {bars.map(([label, v]) => (
                            <div key={label} className="min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-xs leading-tight text-zinc-500 sm:truncate">{label}</span>
                                    <span className="text-base font-bold tabular-nums leading-none text-zinc-900 dark:text-white">
                                        {v === null ? <span className="text-zinc-300 dark:text-zinc-600">—</span> : <>{Math.round(v)}<span className="text-xs font-medium text-zinc-400">%</span></>}
                                    </span>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                    {v !== null && <div className={`h-full rounded-full ${barTone(v)}`} style={{ width: `${Math.max(0, Math.min(100, v))}%` }} />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <JournalCard />
            </div>

            {/* Priority, today's plan and what's coming up, equal widths */}
            <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
                <PriorityQueue actions={pulse.actions} />
                <TodayPlan upcoming={pulse.upcomingMilestones} />
                <ComingUp upcoming={pulse.upcomingMilestones} />
            </div>
        </div>
    );
}
