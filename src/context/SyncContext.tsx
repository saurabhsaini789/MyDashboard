"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useSync } from '@/hooks/useSync';

interface SyncState {
  isReady: boolean;
  isDevelopment: boolean;
}

interface SyncStatus {
  syncStatus: 'idle' | 'syncing' | 'error' | 'unauthenticated' | 'connected' | 'initializing' | 'local';
  errorMessage?: string | null;
}

const SyncStateContext = createContext<SyncState | undefined>(undefined);
const SyncStatusContext = createContext<SyncStatus | undefined>(undefined);

/**
 * Split Provider to isolate high-frequency syncStatus updates 
 * from the relatively stable isReady state.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const { isReady, syncStatus, errorMessage } = useSync();
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Stable state components (changes once from initializing to ready)
  const stateValues = useMemo(() => ({ 
    isReady, 
    isDevelopment 
  }), [isReady, isDevelopment]);
  
  // High-frequency status updates (changes on every cloud push)
  const statusValues = useMemo(() => ({ 
    syncStatus,
    errorMessage
  }), [syncStatus, errorMessage]);

  return (
    <SyncStateContext.Provider value={stateValues}>
      <SyncStatusContext.Provider value={statusValues}>
        {children}
      </SyncStatusContext.Provider>
    </SyncStateContext.Provider>
  );
}

/**
 * Hook for stable sync state (readiness). 
 * Components using this will NOT re-render on ogni sync status change.
 */
export function useSyncReady() {
  const context = useContext(SyncStateContext);
  if (context === undefined) {
    throw new Error('useSyncReady must be used within a SyncProvider');
  }
  return context;
}

/**
 * Hook for high-frequency sync status (indicator).
 * Only UI elements showing the "Syncing..." status should use this.
 */
export function useSyncIndicator() {
  const context = useContext(SyncStatusContext);
  if (context === undefined) {
    throw new Error('useSyncIndicator must be used within a SyncProvider');
  }
  return context;
}

/**
 * @deprecated Use useSyncReady or useSyncIndicator for better performance.
 * Maintained for backward compatibility during migration.
 */
export function useSyncStatus() {
  const state = useContext(SyncStateContext);
  const status = useContext(SyncStatusContext);
  if (state === undefined || status === undefined) {
    throw new Error('useSyncStatus must be used within a SyncProvider');
  }
  return { ...state, ...status };
}
