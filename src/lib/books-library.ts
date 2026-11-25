import type { Book, CompletedBook, LibraryBook, MultiYearLogData } from '@/types/books';
import { localDateStr } from './content-system';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const PALETTE = ['#0f6f66', '#1f3f8f', '#9b3a12', '#6b2a13', '#33415a', '#4c2a8a', '#14607a', '#6e4a10', '#7f1d4e', '#3a5512', '#2b2f36', '#a3540a'];

/** Stable cover color derived from the English title. */
export function coverColor(title: string): string {
  let sum = 0;
  for (const ch of title) sum += ch.charCodeAt(0);
  return PALETTE[sum % PALETTE.length];
}

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9ऀ-ॿ]+/g, '').replace(/(.)\1+/g, '$1');

/** Strips " - Author" from a title only when that trailing part is the author's name. */
export function cleanTitle(title: string, author?: string): string {
  const m = title.match(/^(.*?)\s+[-–—]\s+(.+)$/);
  if (m && author && squash(m[2]) === squash(author)) return m[1].trim();
  return title.trim();
}

/**
 * Matching key for duplicates: ignores case, punctuation, spaces, anything after
 * " - " and doubled letters, so "Godan - Prem Chand" matches "Godaan".
 */
export const normTitle = (s: string) => squash(s.split(/\s+[-–—]\s+/)[0]);

export const isHindiCover = (b: LibraryBook) => b.language === 'Hindi' && !!b.titleHi?.trim();

export function daysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  const [y, m, d] = dateStr.split('-').map(Number);
  const now = new Date();
  const a = new Date(y, m - 1, d).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

export function prettyDate(dateStr?: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

export const yearOf = (dateStr?: string) => (dateStr ? Number(dateStr.slice(0, 4)) : NaN);
export const monthOf = (dateStr?: string) => (dateStr ? Number(dateStr.slice(5, 7)) - 1 : NaN);

export const nextOrder = (books: LibraryBook[]) => Math.max(0, ...books.map(b => b.order || 0)) + 1;

const toLang = (l?: string): 'English' | 'Hindi' => (l === 'Hindi' ? 'Hindi' : 'English');
const RANK: Record<LibraryBook['status'], number> = { want: 0, reading: 1, done: 2 };

/**
 * Merges the three old stores into one list. Old data is left untouched.
 * Precedence for the same title: completed list > yearly log > reading queue.
 */
export function importLegacy(queue: Book[], completed: CompletedBook[], log: MultiYearLogData): LibraryBook[] {
  const byTitle = new Map<string, LibraryBook>();
  const now = new Date().toISOString();

  const upsert = (incoming: LibraryBook) => {
    const key = normTitle(incoming.title);
    if (!key) return;
    const existing = byTitle.get(key);
    if (!existing) { byTitle.set(key, incoming); return; }
    // Keep the most advanced status; fill gaps from the other record.
    const winner = RANK[incoming.status] > RANK[existing.status] ? incoming : existing;
    const other = winner === incoming ? existing : incoming;
    byTitle.set(key, {
      ...other,
      ...winner,
      id: existing.id,
      // The completed list is processed first and has the tidiest titles.
      title: existing.title,
      author: existing.author || incoming.author,
      category: winner.category || other.category,
      startedOn: winner.startedOn || other.startedOn,
      finishedOn: winner.finishedOn || other.finishedOn,
      notes: winner.notes || other.notes,
      rating: winner.rating || other.rating,
      order: other.order ?? winner.order,
    });
  };

  for (const c of completed || []) {
    upsert({
      id: c.id || crypto.randomUUID(), title: cleanTitle(c.name, c.author), author: c.author, language: toLang(c.language),
      category: c.category, status: 'done', owned: false, finishedOn: c.completionDate,
      rating: c.rating || 0, notes: c.notes || '', createdAt: c.createdAt || now,
    });
  }

  for (const [yearStr, months] of Object.entries(log || {})) {
    for (const [monthName, entry] of Object.entries(months || {})) {
      const mi = MONTHS.findIndex(m => m.toLowerCase().startsWith(monthName.toLowerCase().slice(0, 3)));
      if (mi < 0) continue;
      const mm = String(mi + 1).padStart(2, '0');
      const lists: [typeof entry.englishBooks, 'English' | 'Hindi'][] = [[entry?.englishBooks || [], 'English'], [entry?.hindiBooks || [], 'Hindi']];
      for (const [list, language] of lists) {
        for (const lb of list) {
          if (!lb?.title || lb.status === 'None') continue;
          const status = lb.status === 'Completed' ? 'done' : lb.status === 'Reading' ? 'reading' : 'want';
          upsert({
            id: crypto.randomUUID(), title: cleanTitle(lb.title, lb.author), author: lb.author || '', language, category: lb.category,
            status, owned: false,
            startedOn: status === 'reading' ? `${yearStr}-${mm}-01` : undefined,
            finishedOn: status === 'done' ? `${yearStr}-${mm}-15` : undefined,
            createdAt: now,
          });
        }
      }
    }
  }

  const sortedQueue = [...(queue || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  sortedQueue.forEach((q, i) => {
    const status = q.status === 'Completed' ? 'done' : q.status === 'Reading' ? 'reading' : 'want';
    upsert({
      id: q.id || crypto.randomUUID(), title: cleanTitle(q.name, q.author), author: q.author, language: toLang(q.language),
      category: q.category, status, owned: false, order: i + 1,
      startedOn: status === 'reading' ? localDateStr(new Date(q.createdAt || Date.now())) : undefined,
      finishedOn: status === 'done' ? localDateStr(new Date(q.createdAt || Date.now())) : undefined,
      createdAt: q.createdAt || now,
    });
  });

  return [...byTitle.values()];
}
