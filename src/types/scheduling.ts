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
  { id: 'MD_D', name: 'Day Shift', startTime: '08:00', endTime: '16:00', allowedProviderTypes: ['MD'] },
  { id: 'MD_S1', name: 'Swing 1', startTime: '10:00', endTime: '18:00', allowedProviderTypes: ['MD'] },
  { id: 'MD_S2', name: 'Swing 2', startTime: '12:00', endTime: '20:00', allowedProviderTypes: ['MD'] },
  { id: 'MD_S3', name: 'Swing 3', startTime: '14:00', endTime: '22:00', allowedProviderTypes: ['MD'] },
  { id: 'MD_N', name: 'Night Shift', startTime: '20:00', endTime: '08:00', allowedProviderTypes: ['MD'] },
  { id: 'MD_PEDS', name: 'Pediatrics', startTime: '08:00', endTime: '16:00', allowedProviderTypes: ['MD'] },
];

export const WEEKDAY_NAMES = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];
