import { getPrefixedKey } from './keys';

/**
 * Helper to update localStorage and dispatch a custom event 
 * so the useSync hook can catch changes in the same tab.
 */
export const setSyncedItem = (key: string, value: string) => {
 if (typeof window === 'undefined') return;
 
 const prefixedKey = getPrefixedKey(key);
 localStorage.setItem(prefixedKey, value);
 
 // Custom event for same-window sync
 // We STILL use the original 'local-storage-change' event name, 
 // but we pass the base key to the listener so it knows what changed.
 window.dispatchEvent(new CustomEvent('local-storage-change', { 
 detail: { key, value } 
 }));
 
 // Standard storage event for cross-tab sync 
 window.dispatchEvent(new StorageEvent('storage', { 
 key: prefixedKey, 
 newValue: value, 
 url: window.location.href 
 }));
};
