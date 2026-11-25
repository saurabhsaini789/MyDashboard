import { getPrefixedKey } from './keys';
import { setSyncedItem } from './storage';
import { SYNC_KEYS } from './sync-keys';
import { localDateStr } from './content-system';

/** The journal used to write here, unprefixed and never synced. Kept only to merge old days in. */
const LEGACY_KEY = 'os_journal_logs';

function readDays(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const data = parsed && typeof parsed === 'object' && 'd' in parsed ? parsed.d : parsed;
    return Array.isArray(data) ? data.filter((d: unknown): d is string => typeof d === 'string') : [];
  } catch {
    return [];
  }
}

function writeMerged(extra: string[]): void {
  const current = readDays(localStorage.getItem(getPrefixedKey(SYNC_KEYS.JOURNAL_LOGS)));
  const legacy = readDays(localStorage.getItem(LEGACY_KEY));
  const merged = [...new Set([...current, ...legacy, ...extra])].sort();
  setSyncedItem(SYNC_KEYS.JOURNAL_LOGS, JSON.stringify(merged));
  localStorage.removeItem(LEGACY_KEY);
}

/** Records today (local date) as a journaled day in the synced log the Growth Index reads. */
export function recordJournalDay(): void {
  if (typeof window === 'undefined') return;
  writeMerged([localDateStr()]);
}

/** Moves days saved under the old unsynced key into the synced log, once. */
export function migrateLegacyJournalDays(): void {
  if (typeof window === 'undefined') return;
  if (readDays(localStorage.getItem(LEGACY_KEY)).length === 0) return;
  writeMerged([]);
}
