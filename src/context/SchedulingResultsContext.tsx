'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PersistentStorage } from '@/lib/persistentStorage';

const SCHEDULING_RESULTS_STORAGE_KEY = 'scheduling-results-v1';

export interface SchedulingAssignment {
  date: string;
  shiftId: string;
  shiftType: string;
  providerId: string;
  providerName: string;
  startTime: string;
  endTime: string;
}

export interface SchedulingResults {
  assignments: SchedulingAssignment[];
  runId: string;
  timestamp: string;
  solverType: 'local' | 'serverless';
  summary?: {
    totalAssignments: number;
    totalProviders: number;
    totalShifts: number;
  };
}

interface SchedulingResultsContextType {
  results: SchedulingResults | null;
  setResults: (results: SchedulingResults | null) => void;
  getAssignmentsForDate: (date: string) => SchedulingAssignment[];
  hasResults: boolean;
}

const SchedulingResultsContext = createContext<SchedulingResultsContextType | undefined>(undefined);

export function SchedulingResultsProvider({ children }: { children: React.ReactNode }) {
  // Initialize state with persisted data if available
  const [results, setResultsState] = useState<SchedulingResults | null>(() => {
    return PersistentStorage.load<SchedulingResults>(SCHEDULING_RESULTS_STORAGE_KEY);
  });

  // Enhanced setResults that also persists to storage
  const setResults = useCallback((newResults: SchedulingResults | null) => {
    setResultsState(newResults);
    
    if (newResults) {
      PersistentStorage.save(SCHEDULING_RESULTS_STORAGE_KEY, newResults);
    } else {
      PersistentStorage.remove(SCHEDULING_RESULTS_STORAGE_KEY);
    }
  }, []);

  // Load data on mount (for hydration in Next.js)
  useEffect(() => {
    if (results === null) {
      const stored = PersistentStorage.load<SchedulingResults>(SCHEDULING_RESULTS_STORAGE_KEY);
      if (stored) {
        setResultsState(stored);
      }
    }
  }, [results]);

  const getAssignmentsForDate = useCallback((date: string): SchedulingAssignment[] => {
    if (!results) return [];
    return results.assignments.filter(assignment => assignment.date === date);
  }, [results]);

  const hasResults = !!results && results.assignments.length > 0;

  return (
    <SchedulingResultsContext.Provider value={{
      results,
      setResults,
      getAssignmentsForDate,
      hasResults
    }}>
      {children}
    </SchedulingResultsContext.Provider>
  );
}

export function useSchedulingResults() {
  const context = useContext(SchedulingResultsContext);
  if (context === undefined) {
    throw new Error('useSchedulingResults must be used within a SchedulingResultsProvider');
  }
  return context;
}