'use client';

import { createContext, useContext, ReactNode } from 'react';
import { db, MOCK_USER_ID } from '@/lib/local-storage/db';
import * as storage from '@/lib/local-storage/storage';
import * as helpers from '@/lib/local-storage/helpers';

interface LocalStorageContextState {
  db: typeof db;
  storage: typeof storage;
  helpers: typeof helpers;
  userId: string;
  isLoading: boolean;
}

const LocalStorageContext = createContext<LocalStorageContextState | undefined>(undefined);

export const LocalStorageProvider = ({ children }: { children: ReactNode }) => {
  const value = {
    db,
    storage,
    helpers,
    userId: MOCK_USER_ID,
    isLoading: false, // IndexedDB is always ready
  };

  return (
    <LocalStorageContext.Provider value={value}>
      {children}
    </LocalStorageContext.Provider>
  );
};

export const useLocalStorage = () => {
  const context = useContext(LocalStorageContext);
  if (context === undefined) {
    throw new Error('useLocalStorage must be used within a LocalStorageProvider');
  }
  return context;
};

// Convenience hooks
export const useDatabase = () => {
  const { db } = useLocalStorage();
  return db;
};

export const useUserId = () => {
  const { userId } = useLocalStorage();
  return userId;
};
