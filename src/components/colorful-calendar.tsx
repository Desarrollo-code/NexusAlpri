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

const getEventColorClass = (color?: string): string => {
  switch (color) {
    case 'blue': return 'bg-event-blue';
    case 'green': return 'bg-event-green';
    case 'red': return 'bg-event-red';
    case 'orange': return 'bg-event-orange';
    default: return 'bg-primary';
  }
};

function CustomDayContent(props: DayContentProps & { eventsByDay: Record<string, CalendarEvent[]> }) {
  const { date, displayMonth } = props;
  const dayKey = format(date, 'yyyy-MM-dd');
  const eventsForDay = props.eventsByDay[dayKey] || [];
  const isOutside = props.date.getMonth() !== displayMonth.getMonth();

  return (
    <div className="relative w-full h-full flex flex-col p-1 overflow-hidden">
      <time dateTime={format(date, 'yyyy-MM-dd')} className={cn(
        "self-start text-sm rounded-full h-6 w-6 flex items-center justify-center",
        isSameDay(date, new Date()) && "bg-primary text-primary-foreground font-bold",
        isOutside && "text-muted-foreground/50"
      )}>
        {format(date, 'd')}
      </time>
      <div className="flex-grow mt-1 space-y-0.5">
        {eventsForDay.slice(0, 2).map(event => (
          <div key={event.id} className="w-full text-left flex items-center gap-1">
             <div className={cn('h-1.5 w-1.5 rounded-full', getEventColorClass(event.color))} />
             <span className="text-xs text-foreground/80 truncate">{event.title}</span>
          </div>
        ))}
        {eventsForDay.length > 2 && (
          <div className="text-muted-foreground text-xs">+ {eventsForDay.length - 2} más</div>
        )}
      </div>
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

  const handleDayClick = (day: Date | undefined) => {
    if (!day) return;
    const dayKey = format(day, 'yyyy-MM-dd');
    const eventsOnDay = eventsByDay[dayKey] || [];
    onDateSelect(day, eventsOnDay);
  };
  
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
        caption_label: "text-lg font-semibold text-primary",
        nav: "space-x-1 flex items-center",
        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-center text-[0.8rem] pb-2",
        row: "flex w-full mt-2 gap-1",
        cell: cn(
          "flex-1 text-sm p-0 relative focus-within:relative focus-within:z-20 aspect-square",
          "rounded-lg border bg-card/50 transition-colors hover:bg-accent/10"
        ),
        day: "w-full h-full",
        day_today: "border-2 border-primary",
        day_selected: "",
        day_outside: "day-outside text-muted-foreground opacity-50 bg-muted/20",
        day_disabled: "text-muted-foreground opacity-50",
      }}
    />
  );
}
