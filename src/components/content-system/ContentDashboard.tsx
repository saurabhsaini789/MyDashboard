"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ChevronDown, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { setSyncedItem } from '@/lib/storage';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';
import { INBOX_CHANNEL, type BusinessChannel, type ChannelStat, type ContentIdea } from '@/types/business';
import {
  brandIdeas, brandKey, brandName, brandOwner, byIdeaOrder, daysFromToday, daysSinceStat, STATS_STALE_DAYS, groupBrands, imageFileToLogo, KNOWN_OWNERS, localDateStr, markAccountPosted, ownerOf, ownerOrder,
} from '@/lib/content-system';
import { SectionTitle, Text } from '../ui/Text';
import { PlatformTiles } from './PlatformTiles';
import { WeekStrip } from './WeekStrip';
import { BrandCard } from './BrandCard';
import { ChannelEditor } from './ChannelEditor';
import { StatsModal } from './StatsModal';
import { BulkStatsModal } from './BulkStatsModal';
import { mergeStats } from '@/lib/content-metrics';
import { IdeasInbox } from './IdeasInbox';
import { displayNumerals } from './fonts';

const EMPTY_CHANNELS: BusinessChannel[] = [];
const EMPTY_IDEAS: ContentIdea[] = [];
const EMPTY_STATS: ChannelStat[] = [];

interface UndoState {
  message: string;
  channels: BusinessChannel[];
  ideas: ContentIdea[];
}

/** Which brand sections are folded away. Kept on this device only (a viewing preference). */
const COLLAPSE_KEY = 'content_system_collapsed';

/** Accent per section so the headings are easy to tell apart. */
interface Tone { num: string; accent: string; bar: string }
const TONES: Record<string, Tone> = {
  teal: { num: 'text-teal-600 dark:text-teal-400', accent: 'text-teal-600 dark:text-teal-400', bar: 'bg-teal-500' },
  violet: { num: 'text-violet-600 dark:text-violet-400', accent: 'text-violet-600 dark:text-violet-400', bar: 'bg-violet-500' },
  sky: { num: 'text-sky-600 dark:text-sky-400', accent: 'text-sky-600 dark:text-sky-400', bar: 'bg-sky-500' },
  rose: { num: 'text-rose-600 dark:text-rose-400', accent: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-500' },
  amber: { num: 'text-amber-600 dark:text-amber-400', accent: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  indigo: { num: 'text-indigo-600 dark:text-indigo-400', accent: 'text-indigo-600 dark:text-indigo-400', bar: 'bg-indigo-500' },
};
/** Saurabh teal, Neha violet, then anyone else. */
const OWNER_TONES = ['teal', 'violet', 'sky', 'rose'];

interface SectionHeadProps {
  tone: Tone;
  count: number;
  title: string;
  owner?: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
}

function SectionHead({ tone, count, title, owner, subtitle, open, onToggle, action }: SectionHeadProps) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-4 gap-y-3 px-1 ${open ? 'mb-4' : ''}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="group flex items-end gap-3 min-w-0 text-left">
        <span className={`${displayNumerals.className} text-6xl leading-[0.8] tracking-tight tabular-nums transition-colors ${open ? tone.num : 'text-zinc-300 dark:text-zinc-600'}`}>
          {String(count).padStart(2, '0')}
        </span>
        <span className="pb-0.5 min-w-0">
          <span className="flex items-center gap-2 whitespace-nowrap">
            <span className={`w-1 h-5 rounded-full shrink-0 ${open ? tone.bar : 'bg-zinc-300 dark:bg-zinc-600'}`} aria-hidden />
            <SectionTitle>{title}{owner && <span className={tone.accent}> — {owner}</span>}</SectionTitle>
            <ChevronDown size={18} className={`shrink-0 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-transform ${open ? '' : '-rotate-90'}`} />
          </span>
          <Text variant="label" className="mt-1 text-zinc-400">{subtitle}</Text>
        </span>
      </button>
      {action}
    </div>
  );
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const saveChannels = (list: BusinessChannel[]) => setSyncedItem(SYNC_KEYS.FINANCES_BUSINESS, JSON.stringify(list));
const saveIdeas = (list: ContentIdea[]) => setSyncedItem(SYNC_KEYS.FINANCES_BUSINESS_IDEAS, JSON.stringify(list));
const saveStats = (list: ChannelStat[]) => setSyncedItem(SYNC_KEYS.FINANCES_BUSINESS_STATS, JSON.stringify(list));

export function ContentDashboard() {
  const channels = useStorageSubscription<BusinessChannel[]>(SYNC_KEYS.FINANCES_BUSINESS, EMPTY_CHANNELS);
  const ideas = useStorageSubscription<ContentIdea[]>(SYNC_KEYS.FINANCES_BUSINESS_IDEAS, EMPTY_IDEAS);
  const stats = useStorageSubscription<ChannelStat[]>(SYNC_KEYS.FINANCES_BUSINESS_STATS, EMPTY_STATS);
  const [bulkStats, setBulkStats] = useState(false);
  const [statsFor, setStatsFor] = useState<{ brandKey: string; channel: BusinessChannel; key: number } | null>(null);

  const [filter, setFilter] = useState('All');
  // Drafts start folded; everything else starts open.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ drafts: true });
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || 'null');
      if (saved && typeof saved === 'object') setCollapsed(c => ({ ...c, ...saved }));
    } catch { /* storage unavailable: keep defaults */ }
  }, []);
  const toggleSection = (id: string) => setCollapsed(c => {
    const next = { ...c, [id]: !c[id] };
    try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    return next;
  });
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editor, setEditor] = useState<{ open: boolean; channel: BusinessChannel | null; presetBrand?: string; presetOwner?: string; key?: number }>({ open: false, channel: null });
  const openEditor = (channel: BusinessChannel | null, presetBrand?: string, presetOwner?: string) =>
    setEditor({ open: true, channel, presetBrand, presetOwner, key: Date.now() });

  // Convert legacy single-schedule channels to the schedules[] format.
  useEffect(() => {
    const legacy = channels.some(c => !c.schedules || (c as unknown as { postingFrequency?: number }).postingFrequency !== undefined);
    if (!legacy) return;
    const today = localDateStr();
    saveChannels(channels.map(c => {
      const l = c as unknown as Record<string, unknown>;
      if (c.schedules && l.postingFrequency === undefined) return c;
      const status = (['Active', 'Paused', 'Idea'].includes(String(l.status)) ? l.status : 'Active') as BusinessChannel['status'];
      return {
        id: c.id, name: c.name, platform: c.platform, status, about: c.about, rowColor: c.rowColor, brand: c.brand,
        schedules: [{
          id: crypto.randomUUID(),
          type: String(l.contentType || 'Post'),
          frequency: Number(l.postingFrequency) || 1,
          lastPostedDate: String(l.lastPostedDate || today),
          nextPostDueDate: String(l.nextPostDueDate || today),
        }],
      };
    }));
  }, [channels]);

  // Start the "sitting for N days" clock for drafts and paused accounts saved before it existed.
  useEffect(() => {
    if (!channels.some(c => c.status !== 'Active' && !c.statusSince)) return;
    const today = localDateStr();
    saveChannels(channels.map(c => (c.status !== 'Active' && !c.statusSince ? { ...c, statusSince: today } : c)));
  }, [channels]);

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  const brands = useMemo(() => groupBrands(channels), [channels]);
  const draftBrands = useMemo(() => groupBrands(channels, 'inactive'), [channels]);
  const visibleDrafts = filter === 'All' ? draftBrands : draftBrands.filter(b => b.accounts.some(a => a.platform === filter));
  const draftAccounts = draftBrands.flatMap(b => b.accounts);
  const pausedAccounts = draftAccounts.filter(a => a.status === 'Paused').length;
  /** Active accounts with no stats in the last 30 days (or none at all). */
  const staleStats = channels.filter(c => {
    if (c.status !== 'Active') return false;
    const age = daysSinceStat(stats, c.id);
    return isNaN(age) || age > STATS_STALE_DAYS;
  });
  const inboxIdeas = ideas.filter(i => i.status === 'Pending' && !channels.some(c => c.id === i.channelId)).sort(byIdeaOrder);
  /** Scheduled accounts whose brand has nothing queued; flagged in This week. */
  const noIdeas = useMemo(() => {
    const out = new Set<string>();
    for (const b of brands) {
      if (brandIdeas(b.key, channels, ideas).length) continue;
      for (const a of b.accounts) if (!a.trackOnly) out.add(a.id);
    }
    return out;
  }, [brands, channels, ideas]);
  const visibleBrands = filter === 'All' ? brands : brands.filter(b => b.accounts.some(a => a.platform === filter));
  const weekChannels = filter === 'All' ? channels : channels.filter(c => c.platform === filter);
  const allBrandNames = useMemo(() => [...new Set(channels.map(brandName))].sort(), [channels]);
  const brandOwners = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of channels) if (c.owner?.trim() || !map[brandKey(c)]) map[brandKey(c)] = ownerOf(c);
    return map;
  }, [channels]);
  const owners = useMemo(() => ownerOrder([...KNOWN_OWNERS, ...channels.map(ownerOf)]), [channels]);
  /** Active brands split by who handles them; a person with no active brands is left out. */
  const ownerGroups = useMemo(() => ownerOrder(brands.map(brandOwner)).map(owner => {
    const all = brands.filter(b => brandOwner(b) === owner);
    const accounts = all.flatMap(b => b.accounts);
    return {
      owner,
      all,
      visible: all.filter(b => visibleBrands.includes(b)),
      accounts: accounts.length,
      platforms: new Set(accounts.map(a => a.platform)).size,
    };
  }), [brands, visibleBrands]);

  const showUndo = (state: UndoState) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo(state);
    undoTimer.current = setTimeout(() => setUndo(null), 6000);
  };

  const handlePost = (channel: BusinessChannel) => {
    const snapshot = { channels, ideas };
    saveChannels(markAccountPosted(channels, channel.id));
    const next = brandIdeas(brandKey(channel), channels, ideas)[0];
    if (next) saveIdeas(ideas.map(i => (i.id === next.id ? { ...i, status: 'Completed' as const } : i)));
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, colors: ['#10b981', '#3b82f6', '#f59e0b'] });
    showUndo({
      message: `${brandName(channel)} Â· ${channel.platform} marked as posted${next ? ` with "${next.title}"` : ''}`,
      ...snapshot,
    });
  };

  const setBrandLogo = (brandK: string, logo: string | undefined) => {
    saveChannels(channels.map(c => (brandKey(c) === brandK ? { ...c, logo } : c)));
  };

  const uploadLogo = async (brandK: string, file: File) => {
    try {
      setBrandLogo(brandK, await imageFileToLogo(file));
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not use that image.');
      setTimeout(() => setNotice(null), 5000);
    }
  };

  const handleUndo = () => {
    if (!undo) return;
    saveChannels(undo.channels);
    saveIdeas(undo.ideas);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo(null);
  };

  /** The account a brand's ideas hang off: its first active account, else any. */
  const ideaHolder = (brandK: string) =>
    channels.find(c => brandKey(c) === brandK && c.status === 'Active') || channels.find(c => brandKey(c) === brandK);

  /** Renumbers a brand's queue so `ids` come first in that order; ideas not listed keep their relative order after. */
  const withQueueOrder = (list: ContentIdea[], brandK: string, ids: string[]) => {
    const queue = brandIdeas(brandK, channels, list);
    const ordered = [...ids, ...queue.map(i => i.id).filter(id => !ids.includes(id))];
    const pos = new Map(ordered.map((id, n) => [id, n]));
    return list.map(i => (pos.has(i.id) ? { ...i, order: pos.get(i.id) } : i));
  };

  const addIdea = (brandK: string, title: string) => {
    const holder = ideaHolder(brandK);
    if (!holder) return;
    const idea: ContentIdea = { id: crypto.randomUUID(), channelId: holder.id, title, status: 'Pending', createdAt: new Date().toISOString() };
    const list = [...ideas, idea];
    // Keep it at the end of the queue even when earlier ideas were reordered by hand.
    saveIdeas(withQueueOrder(list, brandK, brandIdeas(brandK, channels, list).map(i => i.id).filter(id => id !== idea.id).concat(idea.id)));
  };

  const reorderIdeas = (brandK: string, ids: string[]) => saveIdeas(withQueueOrder(ideas, brandK, ids));

  const addInboxIdea = (title: string) =>
    saveIdeas([...ideas, { id: crypto.randomUUID(), channelId: INBOX_CHANNEL, title, status: 'Pending', createdAt: new Date().toISOString() }]);

  const assignInboxIdea = (ideaId: string, brandK: string) => {
    const holder = ideaHolder(brandK);
    if (!holder) return;
    const list = ideas.map(i => (i.id === ideaId ? { ...i, channelId: holder.id } : i));
    const queue = brandIdeas(brandK, channels, list).map(i => i.id).filter(id => id !== ideaId);
    saveIdeas(withQueueOrder(list, brandK, [...queue, ideaId]));
  };

  const activate = (channel: BusinessChannel) => {
    const today = localDateStr();
    saveChannels(channels.map(c => c.id !== channel.id ? c : {
      ...c,
      status: 'Active' as const,
      statusSince: today,
      schedules: (c.schedules || []).map(s => (daysFromToday(s.nextPostDueDate) < 0 ? { ...s, nextPostDueDate: today } : s)),
    }));
  };

  const saveChannel = (channel: BusinessChannel) => {
    const before = channels.find(c => c.id === channel.id);
    // Restart the "sitting for N days" clock whenever the status changes.
    if (!before || before.status !== channel.status) channel = { ...channel, statusSince: localDateStr() };
    const exists = !!before;
    const next = exists ? channels.map(c => (c.id === channel.id ? channel : c)) : [channel, ...channels];
    // The owner belongs to the whole brand, so keep every account in it in step.
    const k = brandKey(channel);
    saveChannels(next.map(c => (brandKey(c) === k && c.id !== channel.id ? { ...c, owner: channel.owner } : c)));
    setEditor({ open: false, channel: null });
  };

  const deleteChannel = (id: string) => {
    saveChannels(channels.filter(c => c.id !== id));
    setEditor({ open: false, channel: null });
  };

  return (
    <div className="space-y-12">
      <section>
        <PlatformTiles channels={channels} filter={filter} onFilter={setFilter} />
      </section>

      <section>
        <div className="flex items-end justify-between mb-4 px-1">
          <SectionTitle>This week</SectionTitle>
          <Text variant="label" className="text-zinc-400">Late posts roll into today{noIdeas.size > 0 && <span className="text-amber-600 dark:text-amber-400"> · amber outline = no idea queued</span>}</Text>
        </div>
        <WeekStrip channels={weekChannels} noIdeas={noIdeas} />
      </section>

      {staleStats.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0 text-sm text-amber-800 dark:text-amber-200">
            <AlertCircle size={16} className="shrink-0" />
            <span><b>{staleStats.length} {staleStats.length === 1 ? 'account needs' : 'accounts need'} stats</b> · nothing logged in {STATS_STALE_DAYS}+ days</span>
          </div>
          <button
            type="button"
            onClick={() => setBulkStats(true)}
            className="shrink-0 text-xs font-bold px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
          >
            Log them now
          </button>
        </div>
      )}

      {ownerGroups.map((g, gi) => {
        const id = `owner:${g.owner}`;
        const open = !collapsed[id];
        return (
          <section key={g.owner}>
            <SectionHead
              tone={TONES[OWNER_TONES[owners.indexOf(g.owner) % OWNER_TONES.length]] || TONES.teal}
              count={g.all.length}
              title="Active brands"
              owner={g.owner}
              subtitle={`${plural(g.accounts, 'account')} across ${plural(g.platforms, 'platform')}`}
              open={open}
              onToggle={() => toggleSection(id)}
              action={
                <button
                  type="button"
                  onClick={() => openEditor(null, undefined, g.owner)}
                  className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm ${gi === 0
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'}`}
                >
                  <Plus size={14} /> Add account
                </button>
              }
            />
            {open && (g.visible.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                {g.visible.map(b => (
                  <BrandCard
                    key={b.key}
                    brand={b}
                    index={g.all.indexOf(b) + 1}
                    ideas={brandIdeas(b.key, channels, ideas)}
                    stats={stats}
                    onOpenStats={c => setStatsFor({ brandKey: b.key, channel: c, key: Date.now() })}
                    onUploadLogo={file => uploadLogo(b.key, file)}
                    onRemoveLogo={() => setBrandLogo(b.key, undefined)}
                    filter={filter}
                    onPost={handlePost}
                    onAddIdea={title => addIdea(b.key, title)}
                    onDeleteIdea={id => saveIdeas(ideas.filter(i => i.id !== id))}
                    onReorderIdeas={ids => reorderIdeas(b.key, ids)}
                    onEdit={c => openEditor(c)}
                    onAddAccount={name => openEditor(null, name)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 py-8 text-center">
                <Text variant="label" className="text-zinc-400">No active {filter} accounts for {g.owner}</Text>
              </div>
            ))}
          </section>
        );
      })}

      {draftBrands.length > 0 && (
        <section>
          <SectionHead
            tone={TONES.amber}
            count={draftBrands.length}
            title="Drafts and paused"
            subtitle={[plural(draftAccounts.length, 'account'), pausedAccounts && `${pausedAccounts} paused`, draftAccounts.length - pausedAccounts && plural(draftAccounts.length - pausedAccounts, 'draft')].filter(Boolean).join(' · ')}
            open={!collapsed.drafts}
            onToggle={() => toggleSection('drafts')}
          />
          {!collapsed.drafts && (visibleDrafts.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
              {visibleDrafts.map(b => (
                <BrandCard
                  key={b.key}
                  brand={b}
                  index={draftBrands.indexOf(b) + 1}
                  ideas={brandIdeas(b.key, channels, ideas)}
                  stats={stats}
                  onOpenStats={c => setStatsFor({ brandKey: b.key, channel: c, key: Date.now() })}
                  onUploadLogo={file => uploadLogo(b.key, file)}
                  onRemoveLogo={() => setBrandLogo(b.key, undefined)}
                  filter={filter}
                  onPost={handlePost}
                  onAddIdea={title => addIdea(b.key, title)}
                  onDeleteIdea={id => saveIdeas(ideas.filter(i => i.id !== id))}
                  onReorderIdeas={ids => reorderIdeas(b.key, ids)}
                  onEdit={c => openEditor(c)}
                  onAddAccount={name => openEditor(null, name)}
                  inactive
                  onActivate={activate}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 py-8 text-center">
              <Text variant="label" className="text-zinc-400">No {filter} drafts or paused accounts</Text>
            </div>
          ))}
        </section>
      )}

      <section>
        <SectionHead
          tone={TONES.indigo}
          count={inboxIdeas.length}
          title="Ideas inbox"
          subtitle={inboxIdeas.length ? 'Not assigned to a brand yet' : 'Nothing waiting'}
          open={!collapsed.inbox}
          onToggle={() => toggleSection('inbox')}
        />
        {!collapsed.inbox && (
          <IdeasInbox
            ideas={inboxIdeas}
            brands={[...brands, ...draftBrands]}
            onAdd={addInboxIdea}
            onAssign={assignInboxIdea}
            onDelete={id => saveIdeas(ideas.filter(i => i.id !== id))}
          />
        )}
      </section>

      {ownerGroups.length === 0 && (
        <section>
          <div className="flex items-end justify-between gap-4 mb-4 px-1">
            <SectionTitle>Active brands</SectionTitle>
            <button
              type="button"
              onClick={() => openEditor(null)}
              className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm"
            >
              <Plus size={14} /> Add account
            </button>
          </div>
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 py-12 text-center">
            <Text variant="body" className="font-bold">Add your first account</Text>
            <Text variant="label" className="mt-1 text-zinc-400">Each account belongs to a brand, so one brand can span several platforms.</Text>
          </div>
        </section>
      )}

      {editor.open && <ChannelEditor
        key={editor.key}
        isOpen={editor.open}
        channel={editor.channel}
        presetBrand={editor.presetBrand}
        presetOwner={editor.presetOwner}
        brands={allBrandNames}
        brandOwners={brandOwners}
        owners={owners}
        onClose={() => setEditor({ open: false, channel: null })}
        onSave={saveChannel}
        onDelete={deleteChannel}
      />}

      {statsFor && (() => {
        const b = brands.find(x => x.key === statsFor.brandKey) || draftBrands.find(x => x.key === statsFor.brandKey);
        if (!b) return null;
        return (
          <StatsModal
            key={statsFor.key}
            brand={b}
            initialChannel={statsFor.channel}
            stats={stats}
            onAdd={entries => saveStats(mergeStats(stats, entries))}
            onDelete={ids => saveStats(stats.filter(s => !ids.includes(s.id)))}
            onAddMetric={(channelId, name, kind) => saveChannels(channels.map(c => (c.id !== channelId ? c : {
              ...c,
              customMetrics: [...(c.customMetrics || []).filter(m => m.name.toLowerCase() !== name.toLowerCase()), { name, kind }],
            })))}
            onClose={() => setStatsFor(null)}
          />
        );
      })()}

      {bulkStats && (
        <BulkStatsModal
          accounts={staleStats}
          stats={stats}
          onAdd={entries => saveStats(mergeStats(stats, entries))}
          onClose={() => setBulkStats(false)}
        />
      )}

      {notice && !undo && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-28 z-[90] w-[calc(100%-2rem)] max-w-md rounded-2xl bg-rose-600 text-white px-4 py-3 shadow-xl text-xs font-bold" role="alert">
          {notice}
        </div>
      )}

      {undo && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-28 z-[90] w-[calc(100%-2rem)] max-w-md flex items-center justify-between gap-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-3 shadow-xl" role="status">
          <span className="text-xs font-bold truncate">{undo.message}</span>
          <button type="button" onClick={handleUndo} className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/30 dark:border-zinc-900/30">Undo</button>
        </div>
      )}
    </div>
  );
}
