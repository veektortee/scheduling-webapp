export type CalendarView = 'month' | 'week' | 'day' | 'agenda' | 'year';

export type EventPriority = 'low' | 'medium' | 'high' | 'urgent';
export type EventStatus = 'confirmed' | 'tentative' | 'cancelled' | 'completed';
export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'cancelled';

export interface EventCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
  icon?: string;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every N days/weeks/months/years
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc.
  dayOfMonth?: number;
  weekOfMonth?: number; // 1st, 2nd, 3rd, 4th, last (-1)
  monthOfYear?: number;
  endDate?: Date;
  count?: number; // Number of occurrences
}

export interface Reminder {
  id: string;
  type: 'email' | 'notification' | 'popup';
  minutesBefore: number;
  message?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  category: EventCategory;
  priority: EventPriority;
  status: EventStatus;
  color?: string;
  attendees?: string[];
  reminders: Reminder[];
  attachments: Attachment[];
  recurrence?: RecurrenceRule;
  parentEventId?: string; // For recurring events
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPrivate: boolean;
  url?: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: EventPriority;
  dueDate?: Date;
  startDate?: Date;
  completedAt?: Date;
  assignee?: string;
  category: EventCategory;
  tags: string[];
  subtasks: SubTask[];
  progress: number; // 0-100
  estimatedHours?: number;
  actualHours?: number;
  dependencies: string[]; // Task IDs
  attachments: Attachment[];
  reminders: Reminder[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isRecurring: boolean;
  recurrence?: RecurrenceRule;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface TimeBlock {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'work' | 'break' | 'meeting' | 'focus' | 'personal';
  color: string;
  isFlexible: boolean; // Can be moved automatically
}

export interface CalendarFilter {
  categories: string[];
  priorities: EventPriority[];
  statuses: EventStatus[];
  tags: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  showCompleted: boolean;
  showPrivate: boolean;
}

export interface CalendarSettings {
  defaultView: CalendarView;
  weekStartsOn: number; // 0=Sunday, 1=Monday
  timeFormat: '12h' | '24h';
  timezone: string;
  workingHours: {
    start: string; // HH:mm format
    end: string;
  };
  workingDays: number[]; // 0=Sunday, 1=Monday, etc.
  showWeekends: boolean;
  showWeekNumbers: boolean;
  eventDuration: number; // Default duration in minutes
  snapToGrid: boolean;
  gridSize: number; // Minutes
  notifications: {
    email: boolean;
    browser: boolean;
    sound: boolean;
  };
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export interface CalendarState {
  events: CalendarEvent[];
  tasks: Task[];
  categories: EventCategory[];
  timeBlocks: TimeBlock[];
  currentView: CalendarView;
  currentDate: Date;
  selectedDate?: Date;
  selectedEvent?: CalendarEvent;
  selectedTask?: Task;
  filter: CalendarFilter;
  settings: CalendarSettings;
  isLoading: boolean;
  isDragMode: boolean;
  showSidebar: boolean;
  showMiniCalendar: boolean;
  viewRange: {
    start: Date;
    end: Date;
  };
}

export type CalendarAction =
  | { type: 'SET_VIEW'; payload: CalendarView }
  | { type: 'SET_DATE'; payload: Date }
  | { type: 'ADD_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_EVENT'; payload: CalendarEvent }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: EventCategory }
  | { type: 'UPDATE_CATEGORY'; payload: EventCategory }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_FILTER'; payload: Partial<CalendarFilter> }
  | { type: 'SET_SETTINGS'; payload: Partial<CalendarSettings> }
  | { type: 'SELECT_EVENT'; payload: CalendarEvent | undefined }
  | { type: 'SELECT_TASK'; payload: Task | undefined }
  | { type: 'SELECT_DATE'; payload: Date | undefined }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_MINI_CALENDAR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_DRAG_MODE' }
  | { type: 'BULK_ADD_EVENTS'; payload: CalendarEvent[] }
  | { type: 'BULK_DELETE_EVENTS'; payload: string[] }
  | { type: 'SET_VIEW_RANGE'; payload: { start: Date; end: Date } };

export interface EventFormData {
  title: string;
  description: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location: string;
  categoryId: string;
  priority: EventPriority;
  status: EventStatus;
  attendees: string[];
  tags: string[];
  reminders: Reminder[];
  recurrence?: RecurrenceRule;
  isPrivate: boolean;
  url: string;
  notes: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: EventPriority;
  dueDate?: Date;
  startDate?: Date;
  categoryId: string;
  tags: string[];
  assignee: string;
  estimatedHours?: number;
  subtasks: string[];
  isRecurring: boolean;
  recurrence?: RecurrenceRule;
}

export interface CalendarExportOptions {
  format: 'ics' | 'csv' | 'json' | 'pdf';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeEvents: boolean;
  includeTasks: boolean;
  includeCategories: string[];
}

export interface CalendarImportResult {
  success: boolean;
  eventsAdded: number;
  tasksAdded: number;
  errors: string[];
  warnings: string[];
}

// Utility types
export type EventOccurrence = CalendarEvent & {
  originalEventId?: string;
  occurrenceDate: Date;
};

export interface DayEvents {
  date: Date;
  events: CalendarEvent[];
  tasks: Task[];
  timeBlocks: TimeBlock[];
}

export interface WeekView {
  weekStart: Date;
  weekEnd: Date;
  days: DayEvents[];
}

export interface MonthView {
  monthStart: Date;
  monthEnd: Date;
  weeks: WeekView[];
}