"use client";

import React, { useEffect, useRef, useState } from 'react';
import { BarChart3, Camera, Check, ChevronDown, ChevronUp, ImageMinus, Lightbulb, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import type { BusinessChannel, ChannelStat, ContentIdea } from '@/types/business';
import { accountStatus, brandLogo, brandOwner, daysSinceStat, formatStat, headlineStat, initials, lastPostedLabel, statAgeLabel, STATS_STALE_DAYS, statusLabel, type Brand } from '@/lib/content-system';
import { PlatformLogo } from './PlatformLogo';
import { displayNumerals } from './fonts';

interface Props {
  brand: Brand;
  /** 1-based position, shown as a large numeral. */
  index: number;
  ideas: ContentIdea[];
  stats: ChannelStat[];
  onOpenStats: (channel: BusinessChannel) => void;
  onUploadLogo: (file: File) => void;
  onRemoveLogo: () => void;
  filter: string;
  onPost: (channel: BusinessChannel) => void;
  onAddIdea: (text: string) => void;
  onDeleteIdea: (id: string) => void;
  onEdit: (channel: BusinessChannel) => void;
  onAddAccount: (brandName: string) => void;
  /** Drafts and paused brand: shows each account's status and an Activate button instead of posting. */
  inactive?: boolean;
  onActivate?: (channel: BusinessChannel) => void;
}

function statusClasses(next: number) {
  if (isNaN(next)) return 'text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700';
  if (next < 0) return 'text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20';
  if (next === 0) return 'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20';
  return 'text-zinc-500 bg-transparent border-zinc-200 dark:text-zinc-400 dark:border-zinc-700';
}

export function BrandCard({ brand, index, ideas, stats, onOpenStats, onUploadLogo, onRemoveLogo, filter, onPost, onAddIdea, onDeleteIdea, onEdit, onAddAccount, inactive = false, onActivate }: Props) {
  const [showIdeas, setShowIdeas] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const logo = brandLogo(brand);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const statuses = brand.accounts.map(accountStatus);
  const scheduled = statuses.filter(s => !isNaN(s.next));
  const onTrack = scheduled.length ? Math.round((scheduled.filter(s => s.next > 0).length / scheduled.length) * 100) : 0;
  const platforms = [...new Set(brand.accounts.map(a => a.platform))];
  /** Every account is stats-only: no posting, so no on-track ring or ideas queue. */
  const statsOnly = brand.accounts.every(a => a.trackOnly);
  const noRing = statsOnly || inactive;
  const pausedCount = brand.accounts.filter(a => a.status === 'Paused').length;
  const draftCount = brand.accounts.length - pausedCount;
  const subtitle = inactive
    ? [brandOwner(brand), pausedCount && `${pausedCount} paused`, draftCount && `${draftCount} ${draftCount === 1 ? 'draft' : 'drafts'}`].filter(Boolean).join(' · ')
    : statsOnly ? 'Tracking stats only' : `${onTrack}% on track`;

  const submitIdea = () => {
    if (!draft.trim()) { setError('Type an idea first'); return; }
    onAddIdea(draft.trim());
    setDraft('');
  };

  return (
    <div className={`h-full rounded-2xl p-5 flex flex-col ${inactive
      ? 'bg-zinc-50/60 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-700'
      : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm'}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          aria-label={`Brand ${index}`}
          className={`${displayNumerals.className} w-12 shrink-0 text-[40px] leading-none tracking-tight text-zinc-900 dark:text-white tabular-nums`}
        >
          {String(index).padStart(2, '0')}
        </span>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative w-12 h-12 rounded-full p-[3px] shrink-0"
          style={{ background: noRing ? 'rgba(161,161,170,0.25)' : `conic-gradient(#10b981 ${onTrack * 3.6}deg, rgba(161,161,170,0.25) 0)` }}
          title={`${subtitle} · ${logo ? 'change' : 'add'} logo`}
          aria-label={`${logo ? 'Change' : 'Add'} logo for ${brand.name}`}
        >
          <span className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden text-[11px] font-bold text-zinc-700 dark:text-zinc-200">
            {logo
              // eslint-disable-next-line @next/next/no-img-element -- data URL, nothing for next/image to optimise
              ? <img src={logo} alt="" className="w-full h-full object-cover" />
              : initials(brand.name)}
          </span>
          <span className="absolute inset-[3px] rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={14} />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) onUploadLogo(f);
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{brand.name}</div>
          <div className="text-[11px] font-bold text-zinc-400 truncate">{subtitle}</div>
        </div>
        <div className="flex -space-x-1">
          {platforms.map(p => <PlatformLogo key={p} platform={p} size={20} className="ring-2 ring-white dark:ring-zinc-900" />)}
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={`${brand.name} options`}
            aria-expanded={menuOpen}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-56 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg p-1.5">
              {brand.accounts.map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { setMenuOpen(false); onEdit(a); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left"
                >
                  <PlatformLogo platform={a.platform} size={16} />
                  <span className="flex-1 truncate">Edit {a.platform}</span>
                  <Pencil size={12} className="text-zinc-400" />
                </button>
              ))}
              <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onOpenStats(brand.accounts[0]); }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left"
              >
                <BarChart3 size={14} /> Log stats
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); fileRef.current?.click(); }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left"
              >
                <Camera size={14} /> {logo ? 'Change logo' : 'Upload logo'}
              </button>
              {logo && (
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onRemoveLogo(); }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-left"
                >
                  <ImageMinus size={14} /> Remove logo
                </button>
              )}
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onAddAccount(brand.name); }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left"
              >
                <Plus size={14} /> Add platform
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Accounts */}
      <div className="mt-4">
        {brand.accounts.map((a, i) => {
          const st = statuses[i];
          const dimmed = filter !== 'All' && a.platform !== filter;
          const showName = a.name.trim().toLowerCase() !== brand.name.toLowerCase();
          const head = headlineStat(stats, a);
          return (
            <div key={a.id} className={`flex items-center gap-3 py-3 border-t border-zinc-100 dark:border-zinc-800 ${dimmed ? 'opacity-40' : ''}`}>
              <PlatformLogo platform={a.platform} size={30} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-200 truncate">
                    {a.platform}{showName && <span className="text-zinc-400 font-medium"> · {a.name}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenStats(a)}
                    title={head ? `${head.metric} — log a new value` : 'Log followers, views and more'}
                    className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-md px-1.5 py-0.5 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    {head ? (
                      <>
                        {formatStat(head.value)} <span className="font-medium text-zinc-400">{head.metric.toLowerCase()}</span>
                        {head.delta !== null && head.delta !== 0 && (
                          <span className={head.delta > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                            {head.delta > 0 ? '↑' : '↓'}{formatStat(Math.abs(head.delta))}
                          </span>
                        )}
                      </>
                    ) : (
                      <><BarChart3 size={12} /> <span className="font-medium">Add stats</span></>
                    )}
                  </button>
                </div>
                {inactive ? (
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400">{a.status === 'Paused' ? 'Paused' : 'Draft'}</span>
                    <span className="text-[11px] font-medium text-zinc-400">{a.trackOnly ? 'Stats only' : a.status === 'Paused' ? lastPostedLabel(st.sinceLast) : 'Not started'}</span>
                  </div>
                ) : a.trackOnly ? (() => {
                  const age = daysSinceStat(stats, a.id);
                  const stale = isNaN(age) || age > STATS_STALE_DAYS;
                  return (
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border text-sky-700 bg-sky-50 border-sky-100 dark:text-sky-300 dark:bg-sky-500/10 dark:border-sky-500/20">Stats only</span>
                      <span className={`text-[11px] ${stale ? 'font-bold text-amber-600 dark:text-amber-400' : 'font-medium text-zinc-400'}`}>{statAgeLabel(age)}</span>
                    </div>
                  );
                })() : (
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusClasses(st.next)}`}>{statusLabel(st.next)}</span>
                    <span className="text-[11px] font-medium text-zinc-400">{lastPostedLabel(st.sinceLast)}</span>
                  </div>
                )}
              </div>
              {inactive && onActivate && (
                <button
                  type="button"
                  onClick={() => onActivate(a)}
                  aria-label={`Activate ${brand.name} on ${a.platform}`}
                  className="shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Activate
                </button>
              )}
              {!inactive && st.isDue && (
                <button
                  type="button"
                  onClick={() => onPost(a)}
                  aria-label={`Mark ${brand.name} on ${a.platform} as posted`}
                  title="Mark as posted"
                  className="w-9 h-9 shrink-0 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                >
                  <Check size={16} strokeWidth={3} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Ideas (not shown for stats-only brands: nothing is posted from here) */}
      {!statsOnly && <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs min-w-0 truncate">
            {ideas.length ? (
              <><span className="text-zinc-400 font-medium">Up next: </span><span className="font-bold text-zinc-700 dark:text-zinc-200">{ideas[0].title}</span></>
            ) : (
              <span className={`font-bold ${inactive ? 'text-zinc-400' : 'text-rose-500'}`}>No ideas queued</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowIdeas(s => !s)}
            aria-expanded={showIdeas}
            className="shrink-0 flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 px-2 py-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <Lightbulb size={14} /> {ideas.length} {showIdeas ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showIdeas && (
          <div className="mt-3">
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {ideas.map((idea, i) => (
                <div key={idea.id} className="group flex items-start gap-2 py-1.5 text-xs border-b border-zinc-50 dark:border-zinc-800/60">
                  <span className="text-zinc-400 font-bold w-4 shrink-0">{i + 1}.</span>
                  <span className="flex-1 font-medium text-zinc-700 dark:text-zinc-200">{idea.title}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteIdea(idea.id)}
                    aria-label={`Delete idea ${idea.title}`}
                    className="text-zinc-300 hover:text-rose-500 shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={e => { setDraft(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && submitIdea()}
                placeholder="Behind the scenes of my week"
                className={`flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2 text-xs font-medium outline-none border ${error ? 'border-rose-300' : 'border-transparent'}`}
              />
              <button type="button" onClick={submitIdea} aria-label="Add idea" className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-2 rounded-xl">
                <Plus size={16} />
              </button>
            </div>
            {error && <div className="mt-1 text-[11px] font-bold text-rose-500">{error}</div>}
          </div>
        )}
      </div>}
    </div>
  );
}
