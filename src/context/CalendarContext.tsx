'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  BriefcaseIcon,
  UserIcon,
  HeartIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { 
  CalendarState, 
  CalendarAction, 
  CalendarView, 
  CalendarEvent, 
  Task, 
  EventCategory,
  CalendarFilter,
  CalendarSettings,
  EventStatus,
  TaskStatus
} from '@/types/calendar';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';

// Icon mapping for categories
export const CategoryIconMap: { [key: string]: React.FC<{ className?: string }> } = {
  'BriefcaseIcon': BriefcaseIcon,
  'UserIcon': UserIcon,
  'HeartIcon': HeartIcon,
  'GlobeAltIcon': GlobeAltIcon,
  'AcademicCapIcon': AcademicCapIcon,
  'UsersIcon': UsersIcon,
};

// Helper function to render category icon
export const renderCategoryIcon = (iconName: string, className: string = 'w-4 h-4') => {
  const IconComponent = CategoryIconMap[iconName];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
};

// Default categories
const defaultCategories: EventCategory[] = [
  { id: '1', name: 'Work', color: '#3B82F6', description: 'Work-related events', icon: 'BriefcaseIcon' },
  { id: '2', name: 'Personal', color: '#10B981', description: 'Personal activities', icon: 'UserIcon' },
  { id: '3', name: 'Health', color: '#F59E0B', description: 'Health and fitness', icon: 'HeartIcon' },
  { id: '4', name: 'Travel', color: '#8B5CF6', description: 'Travel and trips', icon: 'GlobeAltIcon' },
  { id: '5', name: 'Education', color: '#EF4444', description: 'Learning and courses', icon: 'AcademicCapIcon' },
  { id: '6', name: 'Social', color: '#EC4899', description: 'Social events and meetings', icon: 'UsersIcon' },
];

// Default settings
const defaultSettings: CalendarSettings = {
  defaultView: 'month',
  weekStartsOn: 1, // Monday
  timeFormat: '24h',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  workingHours: {
    start: '09:00',
    end: '17:00',
  },
  workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  showWeekends: true,
  showWeekNumbers: true,
  eventDuration: 60,
  snapToGrid: true,
  gridSize: 15,
  notifications: {
    email: true,
    browser: true,
    sound: false,
  },
  theme: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    accent: '#10B981',
    background: '#FFFFFF',
    text: '#111827',
  },
};

// Default filter
const defaultFilter: CalendarFilter = {
  categories: [],
  priorities: [],
  statuses: [],
  tags: [],
  showCompleted: true,
  showPrivate: true,
};

// Initial state
const initialState: CalendarState = {
  events: [],
  tasks: [],
  categories: defaultCategories,
  timeBlocks: [],
  currentView: 'month',
  currentDate: new Date(),
  selectedDate: undefined,
  selectedEvent: undefined,
  selectedTask: undefined,
  filter: defaultFilter,
  settings: defaultSettings,
  isLoading: false,
  isDragMode: false,
  showSidebar: true,
  showMiniCalendar: true,
  viewRange: {
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  },
};

// Calendar reducer
function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'SET_VIEW':
      return {
        ...state,
        currentView: action.payload,
        viewRange: calculateViewRange(state.currentDate, action.payload, state.settings.weekStartsOn),
      };

    case 'SET_DATE':
      return {
        ...state,
        currentDate: action.payload,
        viewRange: calculateViewRange(action.payload, state.currentView, state.settings.weekStartsOn),
      };

    case 'ADD_EVENT':
      return {
        ...state,
        events: [...state.events, action.payload],
      };

    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id ? action.payload : event
        ),
      };

    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload),
        selectedEvent: state.selectedEvent?.id === action.payload ? undefined : state.selectedEvent,
      };

    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
        selectedTask: state.selectedTask?.id === action.payload ? undefined : state.selectedTask,
      };

    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id ? action.payload : category
        ),
      };

    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload),
      };

    case 'SET_FILTER':
      return {
        ...state,
        filter: { ...state.filter, ...action.payload },
      };

    case 'SET_SETTINGS':
      const newSettings = { ...state.settings, ...action.payload };
      return {
        ...state,
        settings: newSettings,
        viewRange: calculateViewRange(state.currentDate, state.currentView, newSettings.weekStartsOn),
      };

    case 'SELECT_EVENT':
      return {
        ...state,
        selectedEvent: action.payload,
      };

    case 'SELECT_TASK':
      return {
        ...state,
        selectedTask: action.payload,
      };

    case 'SELECT_DATE':
      return {
        ...state,
        selectedDate: action.payload,
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        showSidebar: !state.showSidebar,
      };

    case 'TOGGLE_MINI_CALENDAR':
      return {
        ...state,
        showMiniCalendar: !state.showMiniCalendar,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'TOGGLE_DRAG_MODE':
      return {
        ...state,
        isDragMode: !state.isDragMode,
      };

    case 'BULK_ADD_EVENTS':
      return {
        ...state,
        events: [...state.events, ...action.payload],
      };

    case 'BULK_DELETE_EVENTS':
      return {
        ...state,
        events: state.events.filter(event => !action.payload.includes(event.id)),
      };

    case 'SET_VIEW_RANGE':
      return {
        ...state,
        viewRange: action.payload,
      };

    default:
      return state;
  }
}

// Helper function to calculate view range
function calculateViewRange(date: Date, view: CalendarView, weekStartsOn: number) {
  switch (view) {
    case 'month':
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      return {
        start: startOfWeek(monthStart, { weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6 }),
        end: endOfWeek(monthEnd, { weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6 }),
      };
    
    case 'week':
      return {
        start: startOfWeek(date, { weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6 }),
        end: endOfWeek(date, { weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6 }),
      };
    
    case 'day':
      return {
        start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59),
      };
    
    case 'agenda':
      return {
        start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        end: addDays(date, 30),
      };
    
    case 'year':
      return {
        start: new Date(date.getFullYear(), 0, 1),
        end: new Date(date.getFullYear(), 11, 31),
      };
    
    default:
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
  }
}

// Context
const CalendarContext = createContext<{
  state: CalendarState;
  dispatch: React.Dispatch<CalendarAction>;
  // Utility functions
  getEventsForDate: (date: Date) => CalendarEvent[];
  getTasksForDate: (date: Date) => Task[];
  getFilteredEvents: () => CalendarEvent[];
  getFilteredTasks: () => Task[];
  getCategoryById: (id: string) => EventCategory | undefined;
  navigateToDate: (date: Date) => void;
  navigateToToday: () => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
  createEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  toggleEventCompletion: (eventId: string) => void;
  toggleTaskCompletion: (taskId: string) => void;
  duplicateEvent: (eventId: string) => void;
  exportCalendar: (options?: Record<string, unknown>) => Promise<string>;
  importCalendar: (data: string) => Promise<{ success: boolean; eventsAdded?: number; error?: string }>;
} | null>(null);

// Provider component
export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(calendarReducer, initialState);

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('calendarState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Restore dates as Date objects
        if (parsed.events) {
          parsed.events = parsed.events.map((event: Record<string, unknown>) => ({
            ...event,
            start: new Date(event.start as string),
            end: new Date(event.end as string),
            createdAt: new Date(event.createdAt as string),
            updatedAt: new Date(event.updatedAt as string),
          }));
        }
        if (parsed.tasks) {
          parsed.tasks = parsed.tasks.map((task: Record<string, unknown>) => ({
            ...task,
            dueDate: task.dueDate ? new Date(task.dueDate as string) : undefined,
            startDate: task.startDate ? new Date(task.startDate as string) : undefined,
            completedAt: task.completedAt ? new Date(task.completedAt as string) : undefined,
            createdAt: new Date(task.createdAt as string),
            updatedAt: new Date(task.updatedAt as string),
          }));
        }
        dispatch({ type: 'BULK_ADD_EVENTS', payload: parsed.events || [] });
        if (parsed.tasks) {
          parsed.tasks.forEach((task: Task) => {
            dispatch({ type: 'ADD_TASK', payload: task });
          });
        }
        if (parsed.categories) {
          parsed.categories.forEach((category: EventCategory) => {
            dispatch({ type: 'ADD_CATEGORY', payload: category });
          });
        }
        if (parsed.settings) {
          dispatch({ type: 'SET_SETTINGS', payload: parsed.settings });
        }
      } catch (error) {
        console.error('Failed to load calendar state:', error);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    const stateToSave = {
      events: state.events,
      tasks: state.tasks,
      categories: state.categories.filter(cat => !defaultCategories.find(dc => dc.id === cat.id)),
      settings: state.settings,
    };
    localStorage.setItem('calendarState', JSON.stringify(stateToSave));
  }, [state.events, state.tasks, state.categories, state.settings]);

  // Utility functions
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return state.events.filter(event => {
      if (event.allDay) {
        return isSameDay(event.start, date);
      }
      return (
        (isSameDay(event.start, date) || isSameDay(event.end, date)) ||
        (event.start <= date && event.end >= date)
      );
    });
  };

  const getTasksForDate = (date: Date): Task[] => {
    return state.tasks.filter(task => {
      if (task.dueDate && isSameDay(task.dueDate, date)) return true;
      if (task.startDate && isSameDay(task.startDate, date)) return true;
      return false;
    });
  };

  const getFilteredEvents = (): CalendarEvent[] => {
    let filtered = state.events;

    if (state.filter.categories.length > 0) {
      filtered = filtered.filter(event => 
        state.filter.categories.includes(event.category.id)
      );
    }

    if (state.filter.priorities.length > 0) {
      filtered = filtered.filter(event => 
        state.filter.priorities.includes(event.priority)
      );
    }

    if (state.filter.statuses.length > 0) {
      filtered = filtered.filter(event => 
        state.filter.statuses.includes(event.status)
      );
    }

    if (state.filter.tags.length > 0) {
      filtered = filtered.filter(event => 
        event.tags.some(tag => state.filter.tags.includes(tag))
      );
    }

    if (!state.filter.showCompleted) {
      filtered = filtered.filter(event => event.status !== 'completed');
    }

    if (!state.filter.showPrivate) {
      filtered = filtered.filter(event => !event.isPrivate);
    }

    if (state.filter.searchQuery) {
      const query = state.filter.searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const getFilteredTasks = (): Task[] => {
    const filtered = state.tasks;
    // Apply similar filtering logic for tasks
    return filtered;
  };

  const getCategoryById = (id: string): EventCategory | undefined => {
    return state.categories.find(category => category.id === id);
  };

  const navigateToDate = (date: Date) => {
    dispatch({ type: 'SET_DATE', payload: date });
  };

  const navigateToToday = () => {
    dispatch({ type: 'SET_DATE', payload: new Date() });
  };

  const navigateNext = () => {
    const nextDate = new Date(state.currentDate);
    switch (state.currentView) {
      case 'day':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'week':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'month':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'year':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    dispatch({ type: 'SET_DATE', payload: nextDate });
  };

  const navigatePrevious = () => {
    const prevDate = new Date(state.currentDate);
    switch (state.currentView) {
      case 'day':
        prevDate.setDate(prevDate.getDate() - 1);
        break;
      case 'week':
        prevDate.setDate(prevDate.getDate() - 7);
        break;
      case 'month':
        prevDate.setMonth(prevDate.getMonth() - 1);
        break;
      case 'year':
        prevDate.setFullYear(prevDate.getFullYear() - 1);
        break;
    }
    dispatch({ type: 'SET_DATE', payload: prevDate });
  };

  const createEvent = (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dispatch({ type: 'ADD_EVENT', payload: newEvent });
  };

  const createTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dispatch({ type: 'ADD_TASK', payload: newTask });
  };

  const toggleEventCompletion = (eventId: string) => {
    const event = state.events.find(e => e.id === eventId);
    if (event) {
      const updatedEvent = {
        ...event,
        status: event.status === 'completed' ? 'confirmed' : 'completed' as EventStatus,
        updatedAt: new Date(),
      };
      dispatch({ type: 'UPDATE_EVENT', payload: updatedEvent });
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = {
        ...task,
        status: (task.status === 'completed' ? 'todo' : 'completed') as TaskStatus,
        completedAt: task.status === 'completed' ? undefined : new Date(),
        progress: task.status === 'completed' ? 0 : 100,
        updatedAt: new Date(),
      };
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    }
  };

  const duplicateEvent = (eventId: string) => {
    const event = state.events.find(e => e.id === eventId);
    if (event) {
      const duplicatedEvent = {
        ...event,
        title: `${event.title} (Copy)`,
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dispatch({ type: 'ADD_EVENT', payload: duplicatedEvent });
    }
  };

  const exportCalendar = async (): Promise<string> => {
    // Implementation for exporting calendar data
    return JSON.stringify({
      events: getFilteredEvents(),
      tasks: getFilteredTasks(),
      categories: state.categories,
    });
  };

  const importCalendar = async (data: string): Promise<{ success: boolean; eventsAdded?: number; error?: string }> => {
    // Implementation for importing calendar data
    try {
      const parsed = JSON.parse(data);
      if (parsed.events) {
        dispatch({ type: 'BULK_ADD_EVENTS', payload: parsed.events });
      }
      return { success: true, eventsAdded: parsed.events?.length || 0 };
    } catch {
      return { success: false, error: 'Invalid data format' };
    }
  };

  const value = {
    state,
    dispatch,
    getEventsForDate,
    getTasksForDate,
    getFilteredEvents,
    getFilteredTasks,
    getCategoryById,
    navigateToDate,
    navigateToToday,
    navigateNext,
    navigatePrevious,
    createEvent,
    createTask,
    toggleEventCompletion,
    toggleTaskCompletion,
    duplicateEvent,
    exportCalendar,
    importCalendar,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

// Hook to use calendar context
export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}