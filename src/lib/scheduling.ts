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
    // Generate days from now until year 2070 by default so UI has a long horizon
    days: generateUntilYear(2070),
    weekend_days: ["Saturday", "Sunday"]
  },
  shifts: [],
  providers: [],
  provider_types: ['Staff', 'Manager', 'Supervisor', 'Lead']
};

export async function loadCaseFromFile(): Promise<SchedulingCase | null> {
  try {
    const response = await fetch('/case_oct.json');
    if (!response.ok) {
      throw new Error('Failed to load case file');
    }
    const caseData = await response.json();

    // Generate fresh calendar dates instead of using the hardcoded ones.
    // Use a long horizon up to 2070 so the UI isn't constrained to a small window.
    const freshCalendar = {
      ...caseData.calendar,
      days: generateUntilYear(2070)
    };

    return {
      ...caseData,
      calendar: freshCalendar
    };
  } catch (error) {
    console.error('Error loading case file:', error);
    // Return default case with generated dates if file loading fails
    return {
      ...DEFAULT_CASE,
      calendar: {
        ...DEFAULT_CASE.calendar,
        days: generateUntilYear(2070)
      }
    };
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

export function generateDateRange(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    days.push(dateStr);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
}

export function generateCurrentMonth(): string[] {
  const now = new Date();
  return generateMonth(now.getFullYear(), now.getMonth() + 1);
}

export function generateNextMonths(months: number = 3): string[] {
  const days: string[] = [];
  const now = new Date();
  
  for (let i = 0; i < months; i++) {
    const year = now.getFullYear();
    const month = now.getMonth() + 1 + i;
    const adjustedYear = year + Math.floor((month - 1) / 12);
    const adjustedMonth = ((month - 1) % 12) + 1;
    days.push(...generateMonth(adjustedYear, adjustedMonth));
  }
  
  return days;
}

// Generate all dates from now until the end of the specified year (inclusive).
export function generateUntilYear(endYear: number): string[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(endYear, 11, 31); // December 31 of endYear
  return generateDateRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
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
