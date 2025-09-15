'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  ViewColumnsIcon,
  Square3Stack3DIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useCalendar, renderCategoryIcon } from '@/context/CalendarContext';
import { useSchedulingResults } from '@/context/SchedulingResultsContext';
import { CalendarEvent, CalendarView, EventCategory } from '@/types/calendar';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import EventModal from '@/components/EventModal';
import TaskManager from '@/components/TaskManager';
import CalendarActions from '@/components/CalendarActions';

// Import React Big Calendar styles
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup localizer
const localizer = momentLocalizer(moment);

// Custom event component for React Big Calendar
const CustomEvent = ({ event }: { event: CalendarEvent }) => {
  return (
    <div className="flex items-center space-x-2 p-1">
      <div 
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: event.category.color }}
      />
      <span className="text-sm font-medium truncate">{event.title}</span>
      {event.priority === 'urgent' && (
        <span className="text-red-500 text-xs">!</span>
      )}
    </div>
  );
};

// Custom day cell component to show scheduling assignments
const CustomDayCell = ({ date, getAssignmentsForDate }: { 
  date: Date; 
  getAssignmentsForDate: (date: string) => { shiftType: string; startTime: string; endTime: string; providerName: string }[]; 
}) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const assignments = getAssignmentsForDate(dateStr);
  
  if (assignments.length === 0) return null;
  
  return (
    <div className="absolute top-1 right-1 z-10">
      <div className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg">
        {assignments.length}
      </div>
      {assignments.length > 0 && (
        <div className="absolute top-6 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-2 shadow-lg min-w-48 z-20 opacity-0 hover:opacity-100 transition-opacity">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Scheduled Shifts ({assignments.length})
          </div>
          {assignments.slice(0, 3).map((assignment, idx) => (
            <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              • {assignment.shiftType} ({assignment.startTime}-{assignment.endTime}): {assignment.providerName}
            </div>
          ))}
          {assignments.length > 3 && (
            <div className="text-xs text-blue-500 font-medium">
              +{assignments.length - 3} more shifts...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function ModernCalendar() {
  const { 
    state, 
    navigateNext, 
    navigatePrevious, 
    navigateToToday,
    getEventsForDate,
    dispatch 
  } = useCalendar();

  const { 
    results: schedulingResults, 
    getAssignmentsForDate, 
    hasResults 
  } = useSchedulingResults();

  // Show mini calendar only on non-mobile by default; this will be adjusted
  // after mount based on actual viewport size to avoid SSR mismatch.
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<CalendarEvent | null>(null);
  const [eventModalInitialDate, setEventModalInitialDate] = useState<Date | undefined>(undefined);
  const [sidebarTab, setSidebarTab] = useState<'calendar' | 'tasks' | 'categories'>('calendar');
  const [showCalendarActions, setShowCalendarActions] = useState(false);

  const [isSmallScreen, setIsSmallScreen] = useState(true);

  useEffect(() => {
    const onResize = () => setIsSmallScreen(window.innerWidth < 640);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Toggle mini calendar visibility based on screen size
  useEffect(() => {
    setShowMiniCalendar(!isSmallScreen);
  }, [isSmallScreen]);

  // Convert calendar events to React Big Calendar format with filtering
  const calendarEvents = useMemo(() => {
    let filteredEvents = state.events; // Use all events from state directly
    
    console.log('Total events:', state.events.length);
    console.log('Selected categories:', selectedCategories);
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query))
      );
      console.log('After search filter:', filteredEvents.length);
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        selectedCategories.includes(event.category.id)
      );
      console.log('After category filter:', filteredEvents.length);
    }
    
    console.log('Final filtered events:', filteredEvents.length);
    
    return filteredEvents.map(event => ({
      ...event,
      start: event.start,
      end: event.end,
      resource: event,
    }));
  }, [state.events, searchQuery, selectedCategories]);

  // Handle view change
  const handleViewChange = useCallback((view: View) => {
    const viewMap: Record<View, CalendarView> = {
      month: 'month',
      week: 'week',
      day: 'day',
      agenda: 'agenda',
      work_week: 'week',
    };
    dispatch({ type: 'SET_VIEW', payload: viewMap[view] });
  }, [dispatch]);

  // Handle date navigation
  const handleNavigate = useCallback((newDate: Date) => {
    dispatch({ type: 'SET_DATE', payload: newDate });
  }, [dispatch]);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    dispatch({ type: 'SELECT_EVENT', payload: event });
    setSelectedEventForEdit(event);
    setShowEventModal(true);
  }, [dispatch]);

  // Handle slot selection
  const handleSelectSlot = useCallback(({ start }: { start: Date; end: Date }) => {
    dispatch({ type: 'SELECT_DATE', payload: start });
    setEventModalInitialDate(start);
    setSelectedEventForEdit(null);
    setShowEventModal(true);
  }, [dispatch]);

  // Handle opening new event modal
  const handleOpenEventModal = () => {
    setSelectedEventForEdit(null);
    setEventModalInitialDate(state.currentDate);
    setShowEventModal(true);
  };

  // Handle closing event modal
  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setSelectedEventForEdit(null);
    setEventModalInitialDate(undefined);
  };

  // Custom event style getter
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const style = {
      backgroundColor: event.category.color,
      borderRadius: '8px',
      opacity: event.status === 'cancelled' ? 0.5 : 1,
      color: 'white',
      border: 'none',
      display: 'block',
      fontSize: '12px',
      padding: '2px 8px',
    };

    if (event.priority === 'urgent') {
      style.backgroundColor = '#EF4444';
    } else if (event.priority === 'high') {
      style.backgroundColor = '#F59E0B';
    }

    return { style };
  }, []);

  // Mini calendar component
  const MiniCalendar = () => {
    const [miniDate, setMiniDate] = useState(state.currentDate);

    const daysInMonth = useMemo(() => {
      const start = startOfWeek(startOfMonth(miniDate));
      const end = endOfWeek(endOfMonth(miniDate));
      const days = [];
      let day = start;
      
      while (day <= end) {
        days.push(new Date(day));
        day = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      }
      
      return days;
    }, [miniDate]);

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(miniDate, 'MMMM yyyy')}
          </h3>
          <div className="flex space-x-1">
            <button
              onClick={() => setMiniDate(subMonths(miniDate, 1))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMiniDate(addMonths(miniDate, 1))}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, miniDate);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, state.currentDate);
            const hasEvents = getEventsForDate(day).length > 0;
            
            return (
              <button
                key={index}
                onClick={() => handleNavigate(day)}
                className={`
                  p-2 text-sm rounded-lg transition-all duration-200 relative
                  ${isCurrentMonth 
                    ? 'text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                    : 'text-gray-400 dark:text-gray-600'
                  }
                  ${isToday ? 'bg-blue-100 dark:bg-blue-900/30 font-semibold' : ''}
                  ${isSelected ? 'bg-blue-500 text-white' : ''}
                `}
              >
                {format(day, 'd')}
                {hasEvents && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const ViewButton = ({ view, icon: Icon, label, isActive }: {
    view: CalendarView;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    isActive: boolean;
  }) => (
    <button
      onClick={() => dispatch({ type: 'SET_VIEW', payload: view })}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200
        ${isActive
          ? 'bg-blue-500 text-white shadow-lg'
          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect border-b border-gray-200/50 dark:border-gray-700/50 px-4 sm:px-6 py-4 shadow-xl hover-glow"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          {/* Left side - Navigation and Date */}
          <div className="flex items-center space-x-3 sm:space-x-6 w-full sm:w-auto">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setShowMiniCalendar(!showMiniCalendar)}
                className="mini-calendar-toggle p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors sm:block hidden"
              >
                <Bars3Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                Calendar
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={navigatePrevious}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              
              <button
                onClick={navigateToToday}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
              >
                Today
              </button>
              
              <button
                onClick={navigateNext}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white ml-4">
                {format(state.currentDate, 'MMMM yyyy')}
              </h2>
            </div>
          </div>

          {/* Right side - View controls and actions */}
          <div className="flex items-center space-x-4 flex-wrap">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 w-48 sm:w-64 md:w-96"
              />
            </div>

            {/* View buttons */}
            <div className="flex items-center space-x-2">
              {/* On small screens collapse view controls into a select */}
              {isSmallScreen ? (
                <select
                  value={state.currentView}
                  onChange={(e) => dispatch({ type: 'SET_VIEW', payload: e.target.value as CalendarView })}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm"
                >
                  <option value="month">Month</option>
                  <option value="week">Week</option>
                  <option value="day">Day</option>
                </select>
              ) : (
                <>
                  <ViewButton 
                    view="month" 
                    icon={CalendarDaysIcon} 
                    label="Month" 
                    isActive={state.currentView === 'month'} 
                  />
                  <ViewButton 
                    view="week" 
                    icon={ViewColumnsIcon} 
                    label="Week" 
                    isActive={state.currentView === 'week'} 
                  />
                  <ViewButton 
                view="day" 
                icon={Square3Stack3DIcon} 
                label="Day" 
                isActive={state.currentView === 'day'} 
              />
                </>
              )}
              <ViewButton 
                view="agenda" 
                icon={ClockIcon} 
                label="Agenda" 
                isActive={state.currentView === 'agenda'} 
              />
            </div>

            {/* Add event button */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowCalendarActions(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:from-green-600 hover:to-teal-600 transition-all duration-200 shadow-lg"
              >
                <span>Actions</span>
              </button>
              
              <button 
                onClick={handleOpenEventModal}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Event</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with mini calendar and tasks */}
        <AnimatePresence>
          {showMiniCalendar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="calendar-sidebar bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 overflow-hidden flex flex-col shadow-xl lg:relative lg:transform-none"
            >
              {/* Sidebar tabs */}
              <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex space-x-2 glass-effect rounded-xl p-1">
                  <button
                    onClick={() => setSidebarTab('calendar')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      sidebarTab === 'calendar'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white glass-button'
                    }`}
                  >
                    Calendar
                  </button>
                  <button
                    onClick={() => setSidebarTab('tasks')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      sidebarTab === 'tasks'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white glass-button'
                    }`}
                  >
                    Tasks
                  </button>
                  <button
                    onClick={() => setSidebarTab('categories')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      sidebarTab === 'categories'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Categories
                  </button>
                </div>
              </div>

              {/* Sidebar content */}
              <div className="flex-1 overflow-y-auto p-6">
                {sidebarTab === 'calendar' && <MiniCalendar />}
                
                {sidebarTab === 'tasks' && <TaskManager />}
                
                {sidebarTab === 'categories' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Event Categories
                    </h3>
                    <div className="space-y-2">
                      {state.categories.map((category: EventCategory) => (
                        <label key={category.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.id)}
                            onChange={(e) => {
                              console.log('Checkbox changed for category:', category.id, 'checked:', e.target.checked);
                              console.log('Current selectedCategories before change:', selectedCategories);
                              
                              if (e.target.checked) {
                                const newSelection = [...selectedCategories, category.id];
                                console.log('Adding category, new selection:', newSelection);
                                setSelectedCategories(newSelection);
                              } else {
                                const newSelection = selectedCategories.filter(id => id !== category.id);
                                console.log('Removing category, new selection:', newSelection);
                                setSelectedCategories(newSelection);
                              }
                            }}
                            className="rounded"
                          />
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {renderCategoryIcon(category.icon || 'UserIcon', 'w-5 h-5 text-gray-600 dark:text-gray-300')}
                              <span className="font-medium text-gray-900 dark:text-white">
                                {category.name}
                              </span>
                            </div>
                            {category.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Calendar view */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="calendar-main flex-1 p-3 sm:p-6"
        >
          <div className="calendar-wrapper glass-effect rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 h-full overflow-hidden hover-glow animate-fade-in-up">
            {/* Show empty state message when no events */}
            {calendarEvents.length === 0 && state.currentView === 'agenda' && (
              <div className="calendar-empty-state flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <CalendarDaysIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No events in this range</h3>
                  <p className="text-sm opacity-75">Create your first event to get started</p>
                  <button
                    onClick={() => setShowEventModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors text-sm font-medium flex items-center space-x-2 mx-auto"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Event</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Show scheduling results summary if available */}
            {hasResults && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                      📅 Scheduling Results Loaded
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      {schedulingResults?.summary?.totalAssignments} assignments across {schedulingResults?.summary?.totalProviders} providers
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              view={state.currentView as View}
              onView={handleViewChange}
              date={state.currentDate}
              onNavigate={handleNavigate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              components={{
                event: CustomEvent,
                month: {
                  dateHeader: ({ date }: { date: Date }) => (
                    <div className="relative">
                      <span>{format(date, 'd')}</span>
                      {hasResults && <CustomDayCell date={date} getAssignmentsForDate={getAssignmentsForDate} />}
                    </div>
                  ),
                },
              }}
              messages={{
                noEventsInRange: 'No events in this range',
                showMore: (total: number) => `+${total} more`,
              }}
              formats={{
                timeGutterFormat: 'HH:mm',
                dayHeaderFormat: (date: Date) => format(date, 'EEE M/d'),
                dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) => 
                  `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`,
                monthHeaderFormat: 'MMMM yyyy',
                agendaDateFormat: 'EEE MMM dd',
                agendaTimeFormat: 'HH:mm',
                agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => 
                  `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
              }}
              className="modern-calendar"
            />
          </div>
        </motion.div>

        {/* Event Modal */}
        <EventModal
          isOpen={showEventModal}
          onClose={handleCloseEventModal}
          event={selectedEventForEdit}
          initialDate={eventModalInitialDate}
        />

        {/* Calendar Actions Modal */}
        <CalendarActions
          isOpen={showCalendarActions}
          onClose={() => setShowCalendarActions(false)}
        />
      </div>
    </div>
  );
}