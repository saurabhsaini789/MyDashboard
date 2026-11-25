"use client";

import React, { useEffect } from 'react';
import { Text } from '@/components/ui/Text';
import { useSystemPulse } from '@/hooks/useSystemPulse';
import { PriorityQueue } from './PriorityQueue';
import { StrategicFocus } from './StrategicFocus';
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



    // ── Gauge geometry ────────────────────────────────────────────────────
    const gaugeR = 36;
    const gaugeCirc = 2 * Math.PI * gaugeR;
    const gaugeTrack = gaugeCirc * 0.75;
    const gaugeScore = gaugeTrack * (pulse.score / 100);
    const scoreColorClass = pulse.score >= 80 ? 'text-emerald-500' : pulse.score >= 50 ? 'text-amber-500' : 'text-rose-500';
    const scoreBgClass = pulse.score >= 80
        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
        : pulse.score >= 50 ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
        : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
    const panelBgClass = pulse.score >= 80
        ? 'bg-gradient-to-b from-emerald-50/60 to-white dark:from-emerald-500/5 dark:to-zinc-900'
        : pulse.score >= 50 ? 'bg-gradient-to-b from-amber-50/60 to-white dark:from-amber-500/5 dark:to-zinc-900'
        : 'bg-gradient-to-b from-rose-50/60 to-white dark:from-rose-500/5 dark:to-zinc-900';
    const barColorClass = pulse.score >= 80
        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
        : pulse.score >= 50 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
        : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
    const statColor = (val: number) => val >= 75 ? 'bg-emerald-500' : val >= 40 ? 'bg-amber-500' : 'bg-rose-500';
    const statTextColor = (val: number) => val >= 75 ? 'text-emerald-600 dark:text-emerald-400' : val >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
    // ─────────────────────────────────────────────────────────────────────

    return (
        <div className="fade-in grid grid-cols-1 lg:grid-cols-12 gap-6 mb-14 items-stretch">
            
            {/* 1. Pulse Index Gauge */}
            <div className={`lg:col-span-3 h-full border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 flex flex-col shadow-sm relative overflow-hidden group transition-colors duration-700 ${panelBgClass}`}>
                {/* Glowing top progress bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-t-3xl overflow-hidden">
                    <div
                        className={`h-full transition-all duration-1000 ${barColorClass}`}
                        style={{ width: `${pulse.score}%` }}
                    />
                </div>

                <Text variant="label" className="uppercase tracking-widest text-[10px] text-zinc-400 mb-4">System Pulse</Text>

                <div className="flex flex-col items-center justify-center flex-1">
                    {/* SVG Arc Gauge */}
                    <div className="relative w-32 h-32">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <circle
                                cx={50} cy={50} r={gaugeR}
                                fill="none" strokeWidth="7" stroke="currentColor"
                                className="text-zinc-100 dark:text-zinc-800"
                                strokeDasharray={`${gaugeTrack} ${gaugeCirc}`}
                                strokeLinecap="round"
                                transform="rotate(135 50 50)"
                            />
                            <circle
                                cx={50} cy={50} r={gaugeR}
                                fill="none" strokeWidth="7" stroke="currentColor"
                                className={scoreColorClass}
                                strokeDasharray={`${gaugeScore} ${gaugeCirc}`}
                                strokeLinecap="round"
                                transform="rotate(135 50 50)"
                                style={{ transition: 'stroke-dasharray 1s ease' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-3xl font-black tabular-nums leading-none ${scoreColorClass}`}>{pulse.score}</span>
                            <span className="text-[10px] font-bold text-zinc-400 mt-0.5">%</span>
                        </div>
                    </div>

                    {/* Status badge with pulse animation for non-good states */}
                    <div className={`mt-3 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tighter flex items-center gap-1.5 ${scoreBgClass}`}>
                        {pulse.score < 80 && (
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${pulse.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                        )}
                        {pulse.scoreLabel}
                    </div>
                </div>

                <div className="mt-auto w-full space-y-2 pt-4">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight text-zinc-400">
                        <span>Health Readiness</span>
                        <span className={statTextColor(pulse.stats.healthReadiness)}>{Math.round(pulse.stats.healthReadiness)}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${statColor(pulse.stats.healthReadiness)}`} style={{ width: `${pulse.stats.healthReadiness}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight text-zinc-400">
                        <span>Goal Health</span>
                        <span className={statTextColor(pulse.stats.goalHealth)}>{Math.round(pulse.stats.goalHealth)}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${statColor(pulse.stats.goalHealth)}`} style={{ width: `${pulse.stats.goalHealth}%` }} />
                    </div>
                </div>
            </div>

            {/* 2. Priority queue, with a badge showing where each item comes from */}
            <PriorityQueue actions={pulse.actions} />

            {/* 3. Strategic Focus: what you're working on now and what's due next */}
            <StrategicFocus pulse={pulse} />
        </div>
    );
}
