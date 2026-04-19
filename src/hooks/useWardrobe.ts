"use client";

import { useState, useEffect } from 'react';
import { WardrobeItem } from '@/types/wardrobe';
import { SYNC_KEYS } from '@/lib/sync-keys';
import { setSyncedItem } from '@/lib/storage';
import { useStorageSubscription } from '@/hooks/useStorageSubscription';

const STORAGE_KEY = SYNC_KEYS.WARDROBE_INVENTORY;

export function useWardrobe() {
  const items = useStorageSubscription<WardrobeItem[]>(STORAGE_KEY, []);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const saveItems = (newItems: WardrobeItem[]) => {
    setSyncedItem(STORAGE_KEY, JSON.stringify(newItems));
  };

  const addItem = (item: Omit<WardrobeItem, 'id' | 'createdAt'>) => {
    const newItem: WardrobeItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    saveItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<WardrobeItem>) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    saveItems(newItems);
  };

  const deleteItem = (id: string) => {
    saveItems(items.filter(item => item.id !== id));
  };

  return {
    items,
    isLoaded,
    addItem,
    updateItem,
    deleteItem
  };
}
