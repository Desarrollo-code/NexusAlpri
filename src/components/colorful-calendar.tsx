// src/components/colorful-calendar.tsx
'use client';

import React, { useMemo } from 'react';
import { type DayContentProps } from 'react-day-picker';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { Calendar } from '@/components/ui/calendar';

interface ColorfulCalendarProps extends Omit<React.ComponentProps<typeof Calendar>, 'onSelect'> {
  events: CalendarEvent[];
  onDateSelect: (date: Date, eventsOnDay: CalendarEvent[]) => void;
  className?: string;
}

interface CustomDayContentProps extends DayContentProps {
    eventsByDay: Record<string, CalendarEvent[]>;
}

const getEventColorClass = (color?: string): string => {
  switch (color) {
    case 'blue': return 'bg-event-blue';
    case 'green': return 'bg-event-green';
    case 'red': return 'bg-event-red';
    case 'orange': return 'bg-event-orange';
    default: return 'bg-primary';
  }
};

function CustomDayContent(props: CustomDayContentProps) {
    const { date, activeModifiers, displayMonth } = props;
    const dayKey = format(date, 'yyyy-MM-dd');
    const eventsForDay = props.eventsByDay[dayKey] || [];
    const isOutside = props.date.getMonth() !== displayMonth.getMonth();
    
    if (eventsForDay.length > 0 && !isOutside) {
        // For simplicity, we use the color of the first event of the day.
        const dayColor = getEventColorClass(eventsForDay[0].color);
        return (
            <div className={cn(
                "relative w-full h-full flex items-center justify-center rounded-full text-white font-bold",
                dayColor
            )}>
                {format(date, 'd')}
            </div>
        );
    }
    
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {format(date, 'd')}
        </div>
    );
}

export default function ColorfulCalendar({
  events,
  onDateSelect,
  className,
  ...props
}: ColorfulCalendarProps) {
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      const dayKey = format(new Date(event.start), 'yyyy-MM-dd');
      if (!grouped[dayKey]) grouped[dayKey] = [];
      grouped[dayKey].push(event);
    }
    return grouped;
  }, [events]);

  const handleDayClick = (day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const eventsOnDay = eventsByDay[dayKey] || [];
    onDateSelect(day, eventsOnDay);
  };
  
  // Modifiers to apply custom styles
  const eventDays = Object.keys(eventsByDay).map(dayStr => new Date(dayStr.replace(/-/g, '/')));

  return (
    <Calendar
      {...props}
      onDayClick={handleDayClick}
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
          "hover:bg-accent rounded-full transition-colors",
        ),
        day_today: "text-primary font-bold border border-primary",
        day_outside: "day-outside text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_selected: "", // We handle selection via onDayClick, so we clear default selection styles.
      }}
    />
  );
}
