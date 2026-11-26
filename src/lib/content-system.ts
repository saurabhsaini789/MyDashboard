import type { BusinessChannel, ChannelStat, ContentIdea } from '@/types/business';

const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
export const formatStat = (n: number) => compact.format(n);

/** Entries for one account + metric, oldest first. */
export function statHistory(stats: ChannelStat[], channelId: string, metric: string): ChannelStat[] {
  return stats
    .filter(s => s.channelId === channelId && s.metric === metric)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

export interface Headline {
  metric: string;
  value: number;
  /** Change since the previous entry for the same metric, if any. */
  delta: number | null;
}

/** The stat to show on a card: Subscribers on YouTube, Followers elsewhere, else the latest metric logged. */
export function headlineStat(stats: ChannelStat[], channel: BusinessChannel): Headline | null {
  const mine = stats.filter(s => s.channelId === channel.id);
  if (!mine.length) return null;
  const preferred = channel.platform.toLowerCase() === 'youtube' ? ['Subscribers', 'Followers'] : ['Followers', 'Subscribers'];
  const latestFirst = [...mine].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const metric = preferred.find(m => mine.some(s => s.metric === m)) || latestFirst[0].metric;
  const hist = statHistory(stats, channel.id, metric);
  const last = hist[hist.length - 1];
  const prev = hist[hist.length - 2];
  return { metric, value: last.value, delta: prev ? last.value - prev.value : null };
}

/** YYYY-MM-DD in the user's local timezone (toISOString() would use UTC). */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return localDateStr(new Date(y, m - 1, d + days));
}

/** Whole days from today until dateStr (negative = in the past). NaN if invalid. */
export function daysFromToday(dateStr: string | undefined): number {
  if (!dateStr) return NaN;
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
  if (!y || !m || !d) return NaN;
  const target = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86400000);
}

export const brandName = (c: BusinessChannel) => (c.brand?.trim() || c.name || 'Untitled').trim();
export const brandKey = (c: BusinessChannel) => brandName(c).toLowerCase();

export function initials(name: string): string {
  const words = name.replace(/[^a-zA-Z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export interface AccountStatus {
  /** Days until the most urgent schedule (negative = late). NaN when no schedule. */
  next: number;
  /** Days since the most recent post. NaN when never posted. */
  sinceLast: number;
  isDue: boolean;
}

export function accountStatus(c: BusinessChannel): AccountStatus {
  let next = NaN;
  let sinceLast = NaN;
  for (const s of c.schedules || []) {
    const n = daysFromToday(s.nextPostDueDate);
    if (!isNaN(n) && (isNaN(next) || n < next)) next = n;
    const l = -daysFromToday(s.lastPostedDate);
    if (!isNaN(l) && (isNaN(sinceLast) || l < sinceLast)) sinceLast = l;
  }
  return { next, sinceLast, isDue: !isNaN(next) && next <= 0 };
}

export function statusLabel(next: number): string {
  if (isNaN(next)) return 'No schedule';
  if (next < 0) return `${-next}d late`;
  if (next === 0) return 'Due today';
  if (next === 1) return 'Due tomorrow';
  return `Next in ${next}d`;
}

export function lastPostedLabel(sinceLast: number): string {
  if (isNaN(sinceLast)) return 'Never posted';
  if (sinceLast <= 0) return 'Posted today';
  if (sinceLast === 1) return 'Posted yesterday';
  return `Posted ${sinceLast}d ago`;
}

export interface Brand {
  key: string;
  name: string;
  accounts: BusinessChannel[];
}

export const brandLogo = (b: Brand) => b.accounts.find(a => a.logo)?.logo;

/** People who handle brands. Saurabh is the default for accounts saved before owners existed. */
export const DEFAULT_OWNER = 'Saurabh';
export const KNOWN_OWNERS = ['Saurabh', 'Neha'];
export const ownerOf = (c: BusinessChannel) => c.owner?.trim() || DEFAULT_OWNER;
export const brandOwner = (b: Brand) => ownerOf(b.accounts.find(a => a.owner?.trim()) || b.accounts[0]);

/** Owners in display order: known people first, then anyone else alphabetically. */
export function ownerOrder(names: string[]): string[] {
  const set = new Set(names);
  return [...KNOWN_OWNERS.filter(o => set.has(o)), ...[...set].filter(o => !KNOWN_OWNERS.includes(o)).sort()];
}

/** Days since the newest stat logged for an account. NaN when none. */
export function daysSinceStat(stats: ChannelStat[], channelId: string): number {
  let newest = '';
  for (const s of stats) if (s.channelId === channelId && s.date > newest) newest = s.date;
  return newest ? -daysFromToday(newest) : NaN;
}

/** Stats older than this are flagged on stats-only accounts. */
export const STATS_STALE_DAYS = 30;

export function statAgeLabel(days: number): string {
  if (isNaN(days)) return 'No stats yet';
  if (days <= 0) return 'Stats updated today';
  if (days === 1) return 'Stats updated yesterday';
  return `Stats updated ${days}d ago`;
}

/** Center-crops an image file to a small square data URL suitable for syncing. */
export function imageFileToLogo(file: File, size = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Choose an image file (PNG, JPG, WebP or SVG).')); return; }
    if (file.size > 10 * 1024 * 1024) { reject(new Error('That image is over 10 MB. Try a smaller one.')); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('Could not process the image.')); return; }
      const w = img.naturalWidth || size;
      const h = img.naturalHeight || size;
      const side = Math.min(w, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const webp = canvas.toDataURL('image/webp', 0.85);
      resolve(webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });
}

/** Groups accounts into brands, most urgent brand first: active accounts by default, or drafts and paused ones. */
export function groupBrands(channels: BusinessChannel[], which: 'active' | 'inactive' = 'active'): Brand[] {
  const map = new Map<string, Brand>();
  for (const c of channels) {
    if ((c.status === 'Active') !== (which === 'active')) continue;
    const key = brandKey(c);
    if (!map.has(key)) map.set(key, { key, name: brandName(c), accounts: [] });
    map.get(key)!.accounts.push(c);
  }
  const urgency = (b: Brand) => {
    const vals = b.accounts.map(a => accountStatus(a).next).filter(n => !isNaN(n));
    return vals.length ? Math.min(...vals) : Infinity;
  };
  return [...map.values()].sort((a, b) => urgency(a) - urgency(b) || a.name.localeCompare(b.name));
}

/** Pending ideas for every account in a brand (including drafts), oldest first. */
export function brandIdeas(brandK: string, channels: BusinessChannel[], ideas: ContentIdea[]): ContentIdea[] {
  const ids = new Set(channels.filter(c => brandKey(c) === brandK).map(c => c.id));
  return ideas
    .filter(i => ids.has(i.channelId) && i.status === 'Pending')
    .sort(byIdeaOrder);
}

/** Queue order: ideas placed by hand first (by `order`), then the rest oldest first. */
export function byIdeaOrder(a: ContentIdea, b: ContentIdea): number {
  const oa = a.order ?? Infinity;
  const ob = b.order ?? Infinity;
  if (oa !== ob) return oa - ob;
  return (a.createdAt || '').localeCompare(b.createdAt || '');
}

/** Marks every due schedule on an account as posted today and records the day for the streak. */
export function markAccountPosted(channels: BusinessChannel[], channelId: string): BusinessChannel[] {
  const today = localDateStr();
  return channels.map(c => {
    if (c.id !== channelId) return c;
    const log = c.postLog || [];
    return {
      ...c,
      postLog: log.includes(today) ? log : [...log, today],
      schedules: (c.schedules || []).map(s => {
        const n = daysFromToday(s.nextPostDueDate);
        if (isNaN(n) || n > 0) return s;
        return { ...s, lastPostedDate: today, nextPostDueDate: addDaysStr(today, Math.max(1, s.frequency || 1)) };
      }),
    };
  });
}

/** Day offsets (0..days-1) on which an account has something due. Late items land on day 0. */
export function dueOffsets(c: BusinessChannel, days = 7): Set<number> {
  const out = new Set<number>();
  for (const s of c.schedules || []) {
    let n = daysFromToday(s.nextPostDueDate);
    if (isNaN(n)) continue;
    const step = Math.max(1, s.frequency || 1);
    if (n < 0) n = 0;
    while (n < days) {
      out.add(n);
      n += step;
    }
  }
  return out;
}


// ---------- Growth, targets and streaks ----------

/** The metric an account card leads with: Subscribers on YouTube, Followers elsewhere, else the latest logged. */
export function headlineMetric(stats: ChannelStat[], channel: BusinessChannel): string | null {
  return headlineStat(stats, channel)?.metric ?? null;
}

export interface Change {
  delta: number;
  /** Days between the two entries compared. */
  days: number;
}

/** Change over roughly the last 30 days: latest entry vs the last one logged 30+ days ago (or the earliest, if newer). */
export function recentChange(stats: ChannelStat[], channelId: string, metric: string): Change | null {
  const hist = statHistory(stats, channelId, metric);
  if (hist.length < 2) return null;
  const last = hist[hist.length - 1];
  const cutoff = addDaysStr(localDateStr(), -30);
  const older = hist.filter(h => h.date <= cutoff);
  const base = older.length ? older[older.length - 1] : hist[0];
  if (base === last) return null;
  return { delta: last.value - base.value, days: Math.max(1, -daysFromToday(base.date) + daysFromToday(last.date)) };
}

export type TargetState = 'reached' | 'on-pace' | 'behind' | 'missed' | 'no-date' | 'no-data';

export interface TargetProgress {
  current: number | null;
  /** 0-100, share of the target value reached. */
  pct: number;
  state: TargetState;
}

export function targetProgress(stats: ChannelStat[], channel: BusinessChannel): TargetProgress | null {
  const t = channel.target;
  if (!t || !(t.value > 0)) return null;
  const hist = statHistory(stats, channel.id, t.metric);
  const last = hist[hist.length - 1];
  if (!last) return { current: null, pct: 0, state: 'no-data' };
  const current = last.value;
  const pct = Math.max(0, Math.min(100, Math.round((current / t.value) * 100)));
  if (current >= t.value) return { current, pct, state: 'reached' };
  if (!t.by) return { current, pct, state: 'no-date' };
  if (daysFromToday(t.by) < 0) return { current, pct, state: 'missed' };
  const before = hist.filter(h => h.date <= t.setOn);
  const base = before.length ? before[before.length - 1] : hist[0];
  const total = daysFromToday(t.by) - daysFromToday(base.date);
  const elapsed = -daysFromToday(base.date);
  if (total <= 0 || elapsed <= 0) return { current, pct, state: 'on-pace' };
  const expected = base.value + (t.value - base.value) * (elapsed / total);
  return { current, pct, state: current >= expected ? 'on-pace' : 'behind' };
}

export const TARGET_LABEL: Record<TargetState, string> = {
  reached: 'reached',
  'on-pace': 'on pace',
  behind: 'behind pace',
  missed: 'missed',
  'no-date': 'no deadline',
  'no-data': 'log stats to track',
};

/** Monday-based week number, so posts in the same Mon-Sun week count once. */
function weekIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) / 86400000; // days since epoch (1970-01-01 was a Thursday)
  return Math.floor((t + 3) / 7);
}

/** Weeks in a row (ending this week or last) in which any account of the brand posted. */
export function postingStreak(brand: Brand): number {
  const weeks = new Set<number>();
  for (const a of brand.accounts) {
    for (const d of a.postLog || []) weeks.add(weekIndex(d));
    // Posts marked before the log existed still count, through each schedule's last post.
    for (const s of a.schedules || []) if (s.lastPostedDate && daysFromToday(s.lastPostedDate) <= 0) weeks.add(weekIndex(s.lastPostedDate.split('T')[0]));
  }
  let w = weekIndex(localDateStr());
  if (!weeks.has(w)) w -= 1;
  let n = 0;
  while (weeks.has(w)) { n += 1; w -= 1; }
  return n;
}

/** Days since the status last changed. NaN when unknown. */
export const daysInStatus = (c: BusinessChannel) => (c.statusSince ? -daysFromToday(c.statusSince) : NaN);

/** Turns "instagram.com/x" into "https://instagram.com/x"; empty stays empty. */
export function normalizeUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}
