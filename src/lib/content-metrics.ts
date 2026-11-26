import type { BusinessChannel, ChannelStat, CustomMetric, MetricKind } from '@/types/business';

/**
 * Which numbers each platform offers, and how to read them.
 * - total: a running count (followers, subscribers, posts). Growth = latest minus earlier.
 * - period: activity in the last 28 days (views, likes, reach). Compared month to month, never subtracted.
 */
export interface MetricDef {
  name: string;
  kind: MetricKind;
}

const T = (name: string): MetricDef => ({ name, kind: 'total' });
const P = (name: string): MetricDef => ({ name, kind: 'period' });

export const PLATFORM_METRICS: Record<string, MetricDef[]> = {
  Instagram: [T('Followers'), T('Posts'), P('Reach'), P('Views'), P('Likes'), P('Comments'), P('Shares'), P('Saves'), P('Profile visits')],
  YouTube: [T('Subscribers'), T('Videos'), P('Views'), P('Watch hours'), P('Avg view duration'), P('Likes'), P('Comments'), P('Shares')],
  LinkedIn: [T('Followers'), P('Impressions'), P('Reactions'), P('Comments'), P('Reposts')],
  'X (Twitter)': [T('Followers'), P('Impressions'), P('Likes'), P('Reposts'), P('Replies')],
  Facebook: [T('Followers'), P('Reach'), P('Reactions'), P('Comments'), P('Shares')],
  TikTok: [T('Followers'), P('Views'), P('Likes'), P('Comments'), P('Shares'), P('Profile views')],
  Pinterest: [T('Followers'), P('Impressions'), P('Saves'), P('Outbound clicks')],
};
const FALLBACK: MetricDef[] = [T('Followers'), P('Views'), P('Likes'), P('Comments'), P('Shares')];

/** Running counts; anything else logged is treated as a last-28-days figure. */
const TOTALS = new Set(['followers', 'following', 'subscribers', 'posts', 'videos', 'connections', 'members', 'pins']);

export const PERIOD_LABEL = 'last 28 days';

/** Kind of a metric for this account: its own custom definition, else the built-in rule. */
export function metricKind(name: string, channel?: BusinessChannel): MetricKind {
  const custom = channel?.customMetrics?.find(m => m.name.toLowerCase() === name.toLowerCase());
  if (custom) return custom.kind;
  return TOTALS.has(name.toLowerCase()) ? 'total' : 'period';
}

/** Platform preset + the account's custom metrics + anything already logged for it, totals first. */
export function accountMetrics(channel: BusinessChannel, stats: ChannelStat[] = []): MetricDef[] {
  const base = PLATFORM_METRICS[channel.platform] || FALLBACK;
  const out: MetricDef[] = [...base];
  const seen = new Set(out.map(m => m.name.toLowerCase()));
  const add = (name: string, kind: MetricKind) => {
    if (seen.has(name.toLowerCase())) return;
    seen.add(name.toLowerCase());
    out.push({ name, kind });
  };
  for (const m of channel.customMetrics || []) add(m.name, m.kind);
  for (const s of stats) if (s.channelId === channel.id) add(s.metric, metricKind(s.metric, channel));
  return [...out.filter(m => m.kind === 'total'), ...out.filter(m => m.kind === 'period')];
}

/** Metric names a target can use: the account's running counts first. */
export const targetMetrics = (channel: BusinessChannel) => accountMetrics(channel).map(m => m.name);

/** All entries logged for one account on one day. */
export interface Snapshot {
  date: string;
  values: Record<string, number>;
  ids: string[];
}

/** Snapshots for an account, newest first. If a metric was logged twice on a day, the later entry wins. */
export function snapshots(stats: ChannelStat[], channelId: string): Snapshot[] {
  const byDate = new Map<string, Snapshot>();
  const mine = stats.filter(s => s.channelId === channelId).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  for (const s of mine) {
    const snap = byDate.get(s.date) || { date: s.date, values: {}, ids: [] };
    snap.values[s.metric] = s.value;
    snap.ids.push(s.id);
    byDate.set(s.date, snap);
  }
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/** Adds entries, replacing any existing value for the same account, metric and day. */
export function mergeStats(stats: ChannelStat[], entries: ChannelStat[]): ChannelStat[] {
  const key = (s: ChannelStat) => `${s.channelId}|${s.metric.toLowerCase()}|${s.date}`;
  const incoming = new Set(entries.map(key));
  return [...stats.filter(s => !incoming.has(key(s))), ...entries];
}

const INTERACTIONS = ['likes', 'reactions', 'comments', 'shares', 'reposts', 'replies', 'saves'];
const AUDIENCE = ['reach', 'impressions', 'views'];

/** Engagement rate (%) for one snapshot: interactions / reach (or impressions, or views). Null when it can't be worked out. */
export function engagementRate(values: Record<string, number>): number | null {
  const lower = Object.fromEntries(Object.entries(values).map(([k, v]) => [k.toLowerCase(), v]));
  const interactions = INTERACTIONS.reduce((sum, k) => sum + (lower[k] || 0), 0);
  const audienceKey = AUDIENCE.find(k => (lower[k] || 0) > 0);
  if (!audienceKey || !interactions) return null;
  return (interactions / lower[audienceKey]) * 100;
}

/** Percentage change from `prev` to `cur`; null when there's nothing to compare. */
export function pctChange(cur: number | undefined, prev: number | undefined): number | null {
  if (cur === undefined || prev === undefined || prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

/** CSV of an account's snapshots (date, each metric, engagement rate), oldest first. */
export function snapshotsCsv(channel: BusinessChannel, metrics: MetricDef[], snaps: Snapshot[]): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const header = ['Date', ...metrics.map(m => (m.kind === 'period' ? `${m.name} (${PERIOD_LABEL})` : m.name)), 'Engagement rate %'];
  const rows = [...snaps].reverse().map(s => {
    const er = engagementRate(s.values);
    return [s.date, ...metrics.map(m => (s.values[m.name] ?? '').toString()), er === null ? '' : er.toFixed(2)];
  });
  return [`# ${channel.name} · ${channel.platform}`, header.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
}

export type { CustomMetric };
