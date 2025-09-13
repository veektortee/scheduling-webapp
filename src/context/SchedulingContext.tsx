'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { SchedulingCase, Shift, Provider } from '@/types/scheduling';
import { DEFAULT_CASE } from '@/lib/scheduling';

const LAST_RESULTS_STORAGE_KEY = 'scheduling-last-results-v1';
const SCHEDULING_STATE_STORAGE_KEY = 'scheduling-state-v1';

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
  hasLoadedFromStorage: boolean; // Track if we loaded from localStorage
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
  hasLoadedFromStorage: false,
};

// Function to save scheduling state to localStorage
function saveSchedulingState(state: SchedulingState): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stateToSave = {
      case: state.case,
      selectedDate: state.selectedDate,
      selectedProvider: state.selectedProvider,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(SCHEDULING_STATE_STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.warn('Failed to save scheduling state to localStorage:', error);
  }
}

// Function to load initial state with localStorage data
function getInitialState(): SchedulingState {
  if (typeof window === 'undefined') {
    return initialState;
  }
  
  let loadedState = { ...initialState };
  let hasLoadedSchedulingData = false;
  
  try {
    // Load scheduling state
    const storedState = localStorage.getItem(SCHEDULING_STATE_STORAGE_KEY);
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      // Check if data is not too old (7 days for scheduling data)
      const age = Date.now() - new Date(parsedState.timestamp).getTime();
      if (age < 7 * 24 * 60 * 60 * 1000) {
        loadedState = {
          ...loadedState,
          case: parsedState.case || loadedState.case,
          selectedDate: parsedState.selectedDate || loadedState.selectedDate,
          selectedProvider: parsedState.selectedProvider !== undefined ? parsedState.selectedProvider : loadedState.selectedProvider,
        };
        hasLoadedSchedulingData = true;
      } else {
        // Clear old scheduling data
        localStorage.removeItem(SCHEDULING_STATE_STORAGE_KEY);
      }
    }
  } catch (error) {
    console.warn('Failed to load scheduling state from localStorage:', error);
    localStorage.removeItem(SCHEDULING_STATE_STORAGE_KEY);
  }
  
  try {
    // Load results state (existing logic)
    const storedResults = localStorage.getItem(LAST_RESULTS_STORAGE_KEY);
    if (storedResults) {
      const parsedResults = JSON.parse(storedResults);
      // Check if data is not too old (24 hours)
      const age = Date.now() - new Date(parsedResults.timestamp).getTime();
      if (age < 24 * 60 * 60 * 1000) {
        loadedState.lastResults = parsedResults;
      } else {
        // Clear old data
        localStorage.removeItem(LAST_RESULTS_STORAGE_KEY);
      }
    }
  } catch (error) {
    console.warn('Failed to load lastResults from localStorage:', error);
    localStorage.removeItem(LAST_RESULTS_STORAGE_KEY);
  }
  
  loadedState.hasLoadedFromStorage = hasLoadedSchedulingData;
  return loadedState;
}

function schedulingReducer(state: SchedulingState, action: SchedulingAction): SchedulingState {
  let newState: SchedulingState;
  
  switch (action.type) {
    case 'LOAD_CASE':
      // Only load case data if we haven't already loaded from storage
      if (state.hasLoadedFromStorage) {
        console.log('Ignoring LOAD_CASE because state was loaded from localStorage');
        return state;
      }
      newState = {
        ...state,
        case: action.payload,
        error: null,
      };
      break;
    case 'UPDATE_CASE':
      newState = {
        ...state,
        case: { ...state.case, ...action.payload },
      };
      break;
    case 'SELECT_DATE':
      newState = {
        ...state,
        selectedDate: action.payload,
      };
      break;
    case 'SELECT_PROVIDER':
      newState = {
        ...state,
        selectedProvider: action.payload,
      };
      break;
    case 'ADD_SHIFT':
      newState = {
        ...state,
        case: {
          ...state.case,
          shifts: [...state.case.shifts, action.payload],
        },
      };
      break;
    case 'UPDATE_SHIFT':
      newState = {
        ...state,
        case: {
          ...state.case,
          shifts: state.case.shifts.map((shift, index) =>
            index === action.payload.index ? action.payload.shift : shift
          ),
        },
      };
      break;
    case 'DELETE_SHIFT':
      newState = {
        ...state,
        case: {
          ...state.case,
          shifts: state.case.shifts.filter((_, index) => index !== action.payload),
        },
      };
      break;
    case 'ADD_PROVIDER':
      newState = {
        ...state,
        case: {
          ...state.case,
          providers: [...state.case.providers, action.payload],
        },
      };
      break;
    case 'UPDATE_PROVIDER':
      newState = {
        ...state,
        case: {
          ...state.case,
          providers: state.case.providers.map((provider, index) =>
            index === action.payload.index ? action.payload.provider : provider
          ),
        },
      };
      break;
    case 'DELETE_PROVIDER':
      newState = {
        ...state,
        case: {
          ...state.case,
          providers: state.case.providers.filter((_, index) => index !== action.payload),
        },
      };
      break;
    case 'SET_LOADING':
      newState = {
        ...state,
        isLoading: action.payload,
      };
      break;
    case 'SET_ERROR':
      newState = {
        ...state,
        error: action.payload,
      };
      break;
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
      newState = {
        ...state,
        lastResults: action.payload,
      };
      break;
    case 'GENERATE_DAYS':
      newState = {
        ...state,
        case: {
          ...state.case,
          calendar: {
            ...state.case.calendar,
            days: action.payload,
          },
        },
      };
      break;
    default:
      return state;
  }

  // Save scheduling state for persistence (except for loading and error states)
  if (action.type !== 'SET_LOADING' && 
      action.type !== 'SET_ERROR' && 
      action.type !== 'SET_RESULTS') {
    saveSchedulingState(newState);
    // Mark that we now have saved state
    newState.hasLoadedFromStorage = true;
  }

  return newState;
}

const SchedulingContext = createContext<{
  state: SchedulingState;
  dispatch: React.Dispatch<SchedulingAction>;
} | undefined>(undefined);

export function SchedulingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(schedulingReducer, initialState, getInitialState);

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
