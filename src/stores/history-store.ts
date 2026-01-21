'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface HistoryItem {
  id: string;
  timestamp: string; // ISO string for serialization
  inputFormat: string;
  outputFormat: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

interface HistoryState {
  items: HistoryItem[];
  maxItems: number;

  // Actions
  addItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  getFilteredItems: (filter: HistoryFilter) => HistoryItem[];
}

export interface HistoryFilter {
  status?: 'success' | 'error' | 'all';
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

const MAX_HISTORY_ITEMS = 100;

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: [],
      maxItems: MAX_HISTORY_ITEMS,

      addItem: (itemData) => {
        const newItem: HistoryItem = {
          ...itemData,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };

        set((state) => {
          // Add new item at the beginning
          const updatedItems = [newItem, ...state.items];

          // Keep only the max allowed items (FIFO - remove oldest)
          if (updatedItems.length > state.maxItems) {
            return { items: updatedItems.slice(0, state.maxItems) };
          }

          return { items: updatedItems };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      clearAll: () => {
        set({ items: [] });
      },

      getFilteredItems: (filter) => {
        const { items } = get();

        return items.filter((item) => {
          // Filter by status
          if (filter.status && filter.status !== 'all' && item.status !== filter.status) {
            return false;
          }

          // Filter by date range
          const itemDate = new Date(item.timestamp);
          if (filter.dateFrom && itemDate < filter.dateFrom) {
            return false;
          }
          if (filter.dateTo && itemDate > filter.dateTo) {
            return false;
          }

          // Filter by search query
          if (filter.searchQuery) {
            const query = filter.searchQuery.toLowerCase();
            const matchesFileName = item.fileName.toLowerCase().includes(query);
            const matchesFormat =
              item.inputFormat.toLowerCase().includes(query) ||
              item.outputFormat.toLowerCase().includes(query);
            if (!matchesFileName && !matchesFormat) {
              return false;
            }
          }

          return true;
        });
      },
    }),
    {
      name: 'csv-converter-history',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Export utility function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Export utility function to format date
export function formatDate(isoString: string, locale: string = 'en'): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Export history as JSON
export function exportHistoryAsJson(items: HistoryItem[]): string {
  return JSON.stringify(items, null, 2);
}
