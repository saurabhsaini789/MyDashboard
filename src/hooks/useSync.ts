"use client";

import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

// The local storage keys we want to sync
const SYNC_KEYS = ['os_habits', 'goals_projects', 'goals_seeded_v2', 'goals_seeded_v3'];

export function useSync() {
  const [isReady, setIsReady] = useState(false);
  const isSyncingFromRemote = useRef(false);

  // --- 1. Push Local Changes to Supabase ---
  const pushToSupabase = useCallback(async (key: string, value: string | null) => {
    if (isSyncingFromRemote.current) return;
    
    if (!value) return;

    try {
      const parsedValue = JSON.parse(value);
      const { error } = await supabase
        .from('dashboard_data')
        .upsert({ 
          key, 
          value: parsedValue, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'key' });

      if (error) console.error(`[Sync] Error pushing ${key}:`, error);
    } catch (e) {
      console.error(`[Sync] Failed to parse ${key} for push:`, e);
    }
  }, []);

  // --- 2. Pull Initial Data from Supabase ---
  useEffect(() => {
    const initSync = async () => {
      const { data, error } = await supabase
        .from('dashboard_data')
        .select('*');

      if (error) {
        console.error('[Sync] Error loading initial data:', error);
        setIsReady(true);
        return;
      }

      if (data) {
        isSyncingFromRemote.current = true;
        data.forEach((row) => {
          if (SYNC_KEYS.includes(row.key)) {
            localStorage.setItem(row.key, JSON.stringify(row.value));
            // Notify components in same window
            window.dispatchEvent(new CustomEvent('local-storage-change', { detail: { key: row.key } }));
          }
        });
        isSyncingFromRemote.current = false;
      }
      setIsReady(true);
    };

    initSync();
  }, []);

  // --- 3. Listen for Local Storage Changes ---
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && SYNC_KEYS.includes(e.key)) {
        pushToSupabase(e.key, e.newValue);
      }
    };

    const handleLocalUpdate = (e: any) => {
      if (e.detail && SYNC_KEYS.includes(e.detail.key)) {
        const val = localStorage.getItem(e.detail.key);
        pushToSupabase(e.detail.key, val);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-change', handleLocalUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-change', handleLocalUpdate);
    };
  }, [pushToSupabase]);

  // --- 4. Listen for Remote Changes (Realtime) ---
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'dashboard_data' },
        (payload) => {
          const { key, value } = payload.new;
          if (SYNC_KEYS.includes(key)) {
            isSyncingFromRemote.current = true;
            localStorage.setItem(key, JSON.stringify(value));
            window.dispatchEvent(new CustomEvent('local-storage-change', { detail: { key } }));
            isSyncingFromRemote.current = false;
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dashboard_data' },
        (payload) => {
          const { key, value } = payload.new;
          if (SYNC_KEYS.includes(key)) {
            isSyncingFromRemote.current = true;
            localStorage.setItem(key, JSON.stringify(value));
            window.dispatchEvent(new CustomEvent('local-storage-change', { detail: { key } }));
            isSyncingFromRemote.current = false;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { isReady };
}
