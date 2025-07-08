'use client';

import React, { useMemo } from 'react';
import { type DayContentProps } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { Calendar } from '@/components/ui/calendar';

interface ColorfulCalendarProps {
  events: CalendarEvent[];
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  className?: string;
}

const getEventColorClass = (color?: string): string => {
  switch (color) {
    case 'blue':
      return 'bg-event-blue';
    case 'green':
      return 'bg-event-green';
    case 'red':
      return 'bg-event-red';
    case 'orange':
      return 'bg-event-orange';
    case 'default':
    default:
      return 'bg-event-default';
  }
};

function CustomDayContent(props: DayContentProps) {
  const { date, activeModifiers } = props;
  const { eventsForDay } = activeModifiers as { eventsForDay?: CalendarEvent[] };
  const hasEvents = eventsForDay && eventsForDay.length > 0;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <span className={cn(hasEvents && "font-bold")}>
        {format(date, 'd')}
      </span>
      {hasEvents && (
        <div className="absolute bottom-1.5 flex justify-center items-center space-x-1">
          {eventsForDay.slice(0, 3).map((event) => (
            <div
              key={event.id}
              className={cn('h-2 w-2 rounded-full', getEventColorClass(event.color))}
              title={event.title}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ColorfulCalendar({
  events,
  selectedDate,
  onDateSelect,
  className,
}: ColorfulCalendarProps) {
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      const day = format(new Date(event.start), 'yyyy-MM-dd');
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(event);
    }
    return grouped;
  }, [events]);

  const modifiers = useMemo(() => ({
    weekends: { dayOfWeek: [0, 6] as const },
    eventsForDay: (date: Date) => {
      const dayKey = format(date, 'yyyy-MM-dd');
      return eventsByDay[dayKey] || [];
    },
  }), [eventsByDay]);

  const modifierClassNames = useMemo(() => ({
    weekends: 'text-destructive',
  }), []);

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={onDateSelect}
      locale={es}
      modifiers={modifiers}
      modifierClassNames={modifierClassNames}
      components={{
        DayContent: CustomDayContent,
      }}
      className={className}
    />
  );
}
