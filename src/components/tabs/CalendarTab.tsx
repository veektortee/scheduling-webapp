'use client';

import { CalendarProvider } from '@/context/CalendarContext';
import ModernCalendar from '@/components/ModernCalendar';
import '@/styles/modern-calendar.css';

export default function CalendarTab() {
  return (
    <CalendarProvider>
      <div className="h-screen">
        <ModernCalendar />
      </div>
    </CalendarProvider>
  );
}
