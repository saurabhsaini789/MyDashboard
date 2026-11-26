"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { setSyncedItem } from '@/lib/storage';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';
import type { BusinessChannel, ChannelStat, ContentIdea } from '@/types/business';
import {
  brandIdeas, brandKey, brandName, brandOwner, daysFromToday, groupBrands, imageFileToLogo, KNOWN_OWNERS, localDateStr, markAccountPosted, ownerOf, ownerOrder,
} from '@/lib/content-system';
import { SectionTitle, Text } from '../ui/Text';
import { PlatformTiles } from './PlatformTiles';
import { WeekStrip } from './WeekStrip';
import { BrandCard } from './BrandCard';
import { ChannelEditor } from './ChannelEditor';
import { StatsModal } from './StatsModal';
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

interface SectionHeadProps {
  count: number;
  title: string;
  owner?: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
}

function SectionHead({ count, title, owner, subtitle, open, onToggle, action }: SectionHeadProps) {
  return (
    <div className={`flex items-end justify-between gap-4 px-1 ${open ? 'mb-4' : ''}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="group flex items-end gap-3 min-w-0 text-left">
        <span className={`${displayNumerals.className} text-6xl leading-[0.8] tracking-tight tabular-nums transition-colors ${open ? 'text-zinc-900 dark:text-white' : 'text-zinc-300 dark:text-zinc-600'}`}>
          {String(count).padStart(2, '0')}
        </span>
        <span className="pb-0.5 min-w-0">
          <span className="flex items-center gap-2">
            <SectionTitle>{title}{owner && <span className="text-zinc-400 font-medium"> — {owner}</span>}</SectionTitle>
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

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  const brands = useMemo(() => groupBrands(channels), [channels]);
  const draftBrands = useMemo(() => groupBrands(channels, 'inactive'), [channels]);
  const visibleDrafts = filter === 'All' ? draftBrands : draftBrands.filter(b => b.accounts.some(a => a.platform === filter));
  const draftAccounts = draftBrands.flatMap(b => b.accounts);
  const pausedAccounts = draftAccounts.filter(a => a.status === 'Paused').length;
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

  const addIdea = (brandK: string, title: string) => {
    const owner = channels.find(c => brandKey(c) === brandK && c.status === 'Active') || channels.find(c => brandKey(c) === brandK);
    if (!owner) return;
    saveIdeas([...ideas, { id: crypto.randomUUID(), channelId: owner.id, title, status: 'Pending', createdAt: new Date().toISOString() }]);
  };

  const activate = (channel: BusinessChannel) => {
    const today = localDateStr();
    saveChannels(channels.map(c => c.id !== channel.id ? c : {
      ...c,
      status: 'Active' as const,
      schedules: (c.schedules || []).map(s => (daysFromToday(s.nextPostDueDate) < 0 ? { ...s, nextPostDueDate: today } : s)),
    }));
  };

  const saveChannel = (channel: BusinessChannel) => {
    const exists = channels.some(c => c.id === channel.id);
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
          <Text variant="label" className="text-zinc-400">Late posts roll into today</Text>
        </div>
        <WeekStrip channels={weekChannels} />
      </section>

      {ownerGroups.map((g, gi) => {
        const id = `owner:${g.owner}`;
        const open = !collapsed[id];
        return (
          <section key={g.owner}>
            <SectionHead
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
            onAdd={s => saveStats([...stats, s])}
            onDelete={id => saveStats(stats.filter(s => s.id !== id))}
            onClose={() => setStatsFor(null)}
          />
        );
      })()}

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
