// src/components/colorful-calendar.tsx
'use client';

import React, { useMemo } from 'react';
import { type DayContentProps } from 'react-day-picker';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { isHoliday } from '@/lib/holidays';

interface ColorfulCalendarProps extends Omit<React.ComponentProps<typeof Calendar>, 'onSelect'> {
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  className?: string;
  selected?: Date;
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
  const holiday = isHoliday(date, 'CO'); // Check for Colombian holidays

  return (
    <div className="relative w-full h-full flex flex-col p-1 overflow-hidden">
      <time dateTime={format(date, 'yyyy-MM-dd')} className={cn(
        "self-end text-sm z-10",
        isOutside && "text-muted-foreground/50",
        !!holiday && "text-event-orange font-semibold"
      )}>
        {format(date, 'd')}
      </time>
       {eventsForDay.length > 0 && !isOutside && (
         <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-center items-center gap-1">
            {eventsForDay.slice(0, 3).map((event) => (
                <div key={event.id} className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", getEventColorClass(event.color))} />
            ))}
            {eventsForDay.length > 3 && (
                <span className="text-xs text-muted-foreground -ml-0.5">+</span>
            )}
         </div>
       )}
    </div>
  );
}

export default function ColorfulCalendar({
  events,
  onDateSelect,
  selected,
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
    onDateSelect(day);
  };
  
  return (
    <Calendar
      {...props}
      onDayClick={handleDayClick}
      selected={selected}
      locale={es}
      components={{
        DayContent: (dayProps) => <CustomDayContent {...dayProps} eventsByDay={eventsByDay} />,
      }}
      showOutsideDays={true}
      disableNavigation
      className={className}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 w-full",
        caption: "hidden", // Hide the default caption
        nav: "hidden", // Hide the default nav buttons
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-center text-sm pb-2",
        row: "flex w-full mt-2 gap-1",
        cell: cn(
          "flex-1 p-0 relative focus-within:relative focus-within:z-20 aspect-[4/3]",
          "rounded-lg border bg-card/50 transition-colors hover:bg-accent/10"
        ),
        day: "w-full h-full",
        day_today: "border-2 border-primary",
        day_selected: "bg-accent/20 border-primary",
        day_outside: "day-outside text-muted-foreground opacity-30 bg-muted/20",
        day_disabled: "text-muted-foreground opacity-50",
      }}
    />
  );
}
