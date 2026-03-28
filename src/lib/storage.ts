/**
 * Helper to update localStorage and dispatch a custom event 
 * so the useSync hook can catch changes in the same tab.
 */
export const setSyncedItem = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(key, value);
  
  // Custom event for same-window sync
  window.dispatchEvent(new CustomEvent('local-storage-change', { 
    detail: { key, value } 
  }));
  
  // Standard storage event for cross-tab sync (normally happens automatically in other tabs, 
  // but we dispatch it manually here just in case, though it's optional).
  window.dispatchEvent(new StorageEvent('storage', { 
    key, 
    newValue: value, 
    url: window.location.href 
  }));
};
