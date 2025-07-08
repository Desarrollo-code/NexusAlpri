// src/components/colorful-calendar.tsx
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

interface CustomDayContentProps extends DayContentProps {
    eventsByDay: Record<string, CalendarEvent[]>;
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

function CustomDayContent(props: CustomDayContentProps) {
    const { date, eventsByDay } = props;
    const dayKey = format(date, 'yyyy-MM-dd');
    const eventsForDay = eventsByDay[dayKey] || [];
    const hasEvents = eventsForDay.length > 0;

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
            <span className={cn(hasEvents && "font-bold")}>
                {format(date, 'd')}
            </span>
            {hasEvents && (
                <div className="absolute bottom-1.5 flex justify-center items-center space-x-1.5">
                {eventsForDay.slice(0, 4).map((event) => (
                    <div
                        key={event.id}
                        className={cn('h-2.5 w-2.5 rounded-full', getEventColorClass(event.color))}
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

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={onDateSelect}
      locale={es}
      components={{
        DayContent: (dayProps) => <CustomDayContent {...dayProps} eventsByDay={eventsByDay} />,
      }}
      className={className}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 w-full",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-base font-semibold",
        nav: "space-x-1 flex items-center",
        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-center text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "flex-1 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 aspect-square",
        day: cn(
          "w-full h-full p-0 font-normal aria-selected:opacity-100",
          "flex items-center justify-center rounded-full"
        ),
        day_selected: "bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:bg-secondary/90",
        day_today: "bg-secondary text-secondary-foreground",
        day_outside: "day-outside text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        day_weekend: "text-destructive",
      }}
    />
  );
}
