'use client';

import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { SchedulingCase, Shift, Provider } from '@/types/scheduling';
import { DEFAULT_CASE } from '@/lib/scheduling';

const LAST_RESULTS_STORAGE_KEY = 'scheduling-last-results-v1';

interface SolverResults {
  run_id: string;
  output_directory: string;
  timestamp: string;
  solver_type: string;
  results?: unknown;
  statistics?: Record<string, unknown>;
}

interface SchedulingState {
  case: SchedulingCase;
  selectedDate: string | null;
  selectedProvider: number | null;
  isLoading: boolean;
  error: string | null;
  lastResults: SolverResults | null;
}

type SchedulingAction =
  | { type: 'LOAD_CASE'; payload: SchedulingCase }
  | { type: 'UPDATE_CASE'; payload: Partial<SchedulingCase> }
  | { type: 'SELECT_DATE'; payload: string | null }
  | { type: 'SELECT_PROVIDER'; payload: number | null }
  | { type: 'ADD_SHIFT'; payload: Shift }
  | { type: 'UPDATE_SHIFT'; payload: { index: number; shift: Shift } }
  | { type: 'DELETE_SHIFT'; payload: number }
  | { type: 'ADD_PROVIDER'; payload: Provider }
  | { type: 'UPDATE_PROVIDER'; payload: { index: number; provider: Provider } }
  | { type: 'DELETE_PROVIDER'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RESULTS'; payload: SolverResults | null }
  | { type: 'GENERATE_DAYS'; payload: string[] };

const initialState: SchedulingState = {
  case: DEFAULT_CASE,
  selectedDate: null,
  selectedProvider: null,
  isLoading: false,
  error: null,
  lastResults: null,
};

// Function to load initial state with localStorage data
function getInitialState(): SchedulingState {
  if (typeof window === 'undefined') {
    return initialState;
  }
  
  try {
    const storedResults = localStorage.getItem(LAST_RESULTS_STORAGE_KEY);
    if (storedResults) {
      const parsedResults = JSON.parse(storedResults);
      // Check if data is not too old (24 hours)
      const age = Date.now() - new Date(parsedResults.timestamp).getTime();
      if (age < 24 * 60 * 60 * 1000) {
        return {
          ...initialState,
          lastResults: parsedResults,
        };
      } else {
        // Clear old data
        localStorage.removeItem(LAST_RESULTS_STORAGE_KEY);
      }
    }
  } catch (error) {
    console.warn('Failed to load lastResults from localStorage:', error);
    localStorage.removeItem(LAST_RESULTS_STORAGE_KEY);
  }
  
  return initialState;
}

function schedulingReducer(state: SchedulingState, action: SchedulingAction): SchedulingState {
  switch (action.type) {
    case 'LOAD_CASE':
      return {
        ...state,
        case: action.payload,
        error: null,
      };
    case 'UPDATE_CASE':
      return {
        ...state,
        case: { ...state.case, ...action.payload },
      };
    case 'SELECT_DATE':
      return {
        ...state,
        selectedDate: action.payload,
      };
    case 'SELECT_PROVIDER':
      return {
        ...state,
        selectedProvider: action.payload,
      };
    case 'ADD_SHIFT':
      return {
        ...state,
        case: {
          ...state.case,
          shifts: [...state.case.shifts, action.payload],
        },
      };
    case 'UPDATE_SHIFT':
      return {
        ...state,
        case: {
          ...state.case,
          shifts: state.case.shifts.map((shift, index) =>
            index === action.payload.index ? action.payload.shift : shift
          ),
        },
      };
    case 'DELETE_SHIFT':
      return {
        ...state,
        case: {
          ...state.case,
          shifts: state.case.shifts.filter((_, index) => index !== action.payload),
        },
      };
    case 'ADD_PROVIDER':
      return {
        ...state,
        case: {
          ...state.case,
          providers: [...state.case.providers, action.payload],
        },
      };
    case 'UPDATE_PROVIDER':
      return {
        ...state,
        case: {
          ...state.case,
          providers: state.case.providers.map((provider, index) =>
            index === action.payload.index ? action.payload.provider : provider
          ),
        },
      };
    case 'DELETE_PROVIDER':
      return {
        ...state,
        case: {
          ...state.case,
          providers: state.case.providers.filter((_, index) => index !== action.payload),
        },
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'SET_RESULTS':
      // Save to localStorage when results are updated
      if (typeof window !== 'undefined') {
        try {
          if (action.payload) {
            localStorage.setItem(LAST_RESULTS_STORAGE_KEY, JSON.stringify(action.payload));
          } else {
            localStorage.removeItem(LAST_RESULTS_STORAGE_KEY);
          }
        } catch (error) {
          console.warn('Failed to save lastResults to localStorage:', error);
        }
      }
      return {
        ...state,
        lastResults: action.payload,
      };
    case 'GENERATE_DAYS':
      return {
        ...state,
        case: {
          ...state.case,
          calendar: {
            ...state.case.calendar,
            days: action.payload,
          },
        },
      };
    default:
      return state;
  }
}

const SchedulingContext = createContext<{
  state: SchedulingState;
  dispatch: React.Dispatch<SchedulingAction>;
} | undefined>(undefined);

export function SchedulingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(schedulingReducer, initialState, getInitialState);

  // Effect to handle localStorage loading after hydration (for Next.js SSR)
  useEffect(() => {
    if (typeof window !== 'undefined' && state.lastResults === null) {
      try {
        const storedResults = localStorage.getItem(LAST_RESULTS_STORAGE_KEY);
        if (storedResults) {
          const parsedResults = JSON.parse(storedResults);
          const age = Date.now() - new Date(parsedResults.timestamp).getTime();
          if (age < 24 * 60 * 60 * 1000) {
            dispatch({ type: 'SET_RESULTS', payload: parsedResults });
          }
        }
      } catch (error) {
        console.warn('Failed to load lastResults on mount:', error);
      }
    }
  }, [state.lastResults]);

  return (
    <SchedulingContext.Provider value={{ state, dispatch }}>
      {children}
    </SchedulingContext.Provider>
  );
}

export function useScheduling() {
  const context = useContext(SchedulingContext);
  if (context === undefined) {
    throw new Error('useScheduling must be used within a SchedulingProvider');
  }
  return context;
}
