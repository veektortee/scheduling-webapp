// Types for the scheduling system based on the existing JSON structure

export interface Solver {
  max_time_in_seconds: number;
  phase1_fraction: number;
  relative_gap: number;
  num_threads: number;
}

export interface Weights {
  hard: {
    slack_consec: number;
  };
  soft: {
    [key: string]: number; // Fixed ESLint any type
  };
}

export interface Objective {
  hard: number;
  soft: number;
  fair: number;
}

export interface Constants {
  solver: Solver;
  weights: Weights;
  objective: Objective;
}

export interface RunConfig {
  out: string;
  k: number;
  L: number;
  seed: number;
  time: number;
}

export interface Calendar {
  days: string[];
  weekend_days: string[];
}

export interface Shift {
  id: string;
  date: string;
  type: string;
  start: string;
  end: string;
  allowed_provider_types: string[];
}

export interface Provider {
  id?: string;
  name?: string;
  type?: string;
  forbidden_days_hard?: string[];
  forbidden_days_soft: string[];
  preferred_days_hard?: { [key: string]: string[] };
  preferred_days_soft?: { [key: string]: string[] };
  limits?: {
    min_total?: number;
    max_total?: number | null;
    type_ranges?: { [key: string]: { min: number; max: number } }; // Fixed ESLint any type
  };
  max_consecutive_days?: number | null;
}

export interface SchedulingCase {
  constants: Constants;
  run: RunConfig;
  calendar: Calendar;
  shifts: Shift[];
  providers: Provider[];
  // List of available provider types that can be assigned to providers and used by shifts
  provider_types?: string[];
}

export interface ShiftType {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  allowedProviderTypes: string[];
}

export const DEFAULT_SHIFT_TYPES: ShiftType[] = [
  // MD Templates
  { id: 'MD_Day', name: 'MD Day', startTime: '08:00', endTime: '18:00', allowedProviderTypes: ['MD'] },
  { id: 'MD_Night', name: 'MD Night', startTime: '18:00', endTime: '08:00', allowedProviderTypes: ['MD'] },
  
  // NP Templates
  { id: 'NP_Day', name: 'NP Day', startTime: '09:00', endTime: '17:00', allowedProviderTypes: ['NP'] },
  { id: 'NP_Night', name: 'NP Night', startTime: '19:00', endTime: '07:00', allowedProviderTypes: ['NP'] },

  // PA Templates
  { id: 'PA_Day', name: 'PA Day', startTime: '08:30', endTime: '18:30', allowedProviderTypes: ['PA'] },
  { id: 'PA_Swing', name: 'PA Swing', startTime: '12:00', endTime: '22:00', allowedProviderTypes: ['PA'] },

  // Mixed Type Templates
  { id: 'Flex_Day', name: 'Flex Day', startTime: '08:00', endTime: '16:00', allowedProviderTypes: ['MD', 'NP', 'PA'] },
  { id: 'Flex_Night', name: 'Flex Night', startTime: '20:00', endTime: '08:00', allowedProviderTypes: ['MD', 'NP'] },
];

export const WEEKDAY_NAMES = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];
