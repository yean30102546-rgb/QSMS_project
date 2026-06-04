'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { fetchAllCases, fetchItemMaster, ReworkCase } from '../services/api';
import { getStatistics, sortCasesByStatus } from '../utils/helpers';

interface MasterItem {
  itemNumber: string;
  itemCode: string;
  itemName: string;
}

interface ReworkDataContextType {
  cases: ReworkCase[];
  isLoadingCases: boolean;
  caseError: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadCases: () => Promise<void>;
  stats: ReturnType<typeof getStatistics>;
  itemMaster: MasterItem[];
  isLoadingMaster: boolean;
  loadMasterData: () => Promise<void>;
  updateCasesLocally: (updater: (prev: ReworkCase[]) => ReworkCase[]) => void;
}

const ReworkDataContext = createContext<ReworkDataContextType | undefined>(undefined);

export function ReworkDataProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<ReworkCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [caseError, setCaseError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [itemMaster, setItemMaster] = useState<MasterItem[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);

  const loadCases = useCallback(async () => {
    try {
      setIsLoadingCases(true);
      setCaseError(null);
      const result = await fetchAllCases();
      if (result.success && result.data) {
        setCases(sortCasesByStatus(result.data));
      } else {
        throw new Error(result.error || 'Failed to load cases');
      }
    } catch (error) {
      setCaseError(error instanceof Error ? error.message : 'Failed to load cases');
    } finally {
      setIsLoadingCases(false);
    }
  }, []);

  const loadMasterData = useCallback(async () => {
    try {
      setIsLoadingMaster(true);
      const result = await fetchItemMaster();
      if (result.success && result.data) {
        setItemMaster(result.data);
      }
    } catch (error) {
      console.error('Error loading master data:', error);
    } finally {
      setIsLoadingMaster(false);
    }
  }, []);

  // Update cases locally without refetching (for optimistic UI)
  const updateCasesLocally = useCallback((updater: (prev: ReworkCase[]) => ReworkCase[]) => {
    setCases((prev) => updater(prev));
  }, []);

  useEffect(() => {
    loadMasterData();
    loadCases();
  }, [loadMasterData, loadCases]);

  const stats = getStatistics(cases);

  return (
    <ReworkDataContext.Provider
      value={{
        cases,
        isLoadingCases,
        caseError,
        searchQuery,
        setSearchQuery,
        loadCases,
        stats,
        itemMaster,
        isLoadingMaster,
        loadMasterData,
        updateCasesLocally,
      }}
    >
      {children}
    </ReworkDataContext.Provider>
  );
}

export function useReworkData() {
  const context = useContext(ReworkDataContext);
  if (context === undefined) {
    throw new Error('useReworkData must be used within a ReworkDataProvider');
  }
  return context;
}
