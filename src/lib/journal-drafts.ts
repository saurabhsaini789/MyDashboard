import { setSyncedItem } from './storage';
import { localDateStr } from './content-system';

export type Phase = 'morning' | 'day' | 'evening';

/**
 * Journal drafts and today's sync receipts, kept on this device only.
 * The key is deliberately not in SYNC_KEYS, so draft text never goes to the cloud.
 */
export const JOURNAL_DRAFTS_KEY = 'journal_drafts';

export interface JournalDrafts {
  /** Day the sync receipts belong to (YYYY-MM-DD). */
  date: string;
  texts: Record<Phase, string>;
  /** Phase → time it was synced today, e.g. "2:14 pm". */
  synced: Partial<Record<Phase, string>>;
  /** OneNote link of today's page, from the last sync. */
  pageUrl?: string;
}

export const EMPTY_DRAFTS: JournalDrafts = {
  date: '',
  texts: { morning: '', day: '', evening: '' },
  synced: {},
};

/** Receipts reset each day; unsynced draft text is kept so nothing is lost. */
export function forToday(d: JournalDrafts | null | undefined): JournalDrafts {
  const today = localDateStr();
  const base = d && typeof d === 'object' && d.texts ? d : EMPTY_DRAFTS;
  if (base.date === today) return base;
  return { date: today, texts: { ...EMPTY_DRAFTS.texts, ...base.texts }, synced: {} };
}

export function saveDrafts(d: JournalDrafts): void {
  setSyncedItem(JOURNAL_DRAFTS_KEY, JSON.stringify(d));
}

/** Visible text of an editor HTML string. */
export function plainText(html: string): string {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
