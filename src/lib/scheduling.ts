import { SchedulingCase } from '@/types/scheduling';

export const DEFAULT_CASE: SchedulingCase = {
  constants: {
    solver: {
      max_time_in_seconds: 125999.99999999999,
      phase1_fraction: 0.4,
      relative_gap: 0.00001,
      num_threads: 16
    },
    weights: {
      hard: {
        slack_consec: 1
      },
      soft: {}
    },
    objective: {
      hard: 1,
      soft: 1,
      fair: 0
    }
  },
  run: {
    out: "Demo5",
    k: 4,
    L: 50,
    seed: 1234,
    time: 1500.0
  },
  calendar: {
    days: [],
    weekend_days: ["Saturday", "Sunday"]
  },
  shifts: [],
  providers: []
};

export async function loadCaseFromFile(): Promise<SchedulingCase | null> {
  try {
    const response = await fetch('/case_oct.json');
    if (!response.ok) {
      throw new Error('Failed to load case file');
    }
    const caseData = await response.json();
    return caseData;
  } catch (error) {
    console.error('Error loading case file:', error);
    return null;
  }
}

export function generateMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = date.toISOString().split('T')[0];
    days.push(dateStr);
  }
  
  return days;
}

export function formatTime(time: string): string {
  // Convert time string to HH:MM format
  if (time.includes('T')) {
    return time.split('T')[1].substring(0, 5);
  }
  return time;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}
