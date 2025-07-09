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
    case 'yellow':
      return 'bg-event-yellow';
    case 'purple':
      return 'bg-event-purple';
    case 'cyan':
      return 'bg-event-cyan';
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
    
    // Cap at 6 points to avoid visual clutter
    const pointsToShow = eventsForDay.slice(0, 6); 
    const totalPoints = pointsToShow.length;
    
    // Distribute points across a 140-degree arc at the bottom of the cell.
    const arcDegrees = 140; 
    const radius = 45; // As a percentage of the parent's half-width/height

    return (
        <div className="relative w-full h-full flex items-center justify-center group">
            {/* The date number */}
            <span className={cn(
                "z-10",
                "group-aria-selected:font-semibold"
            )}>
                {format(date, 'd')}
            </span>

            {/* Semicircle container for event dots */}
            {hasEvents && (
                <div className="absolute w-full h-full top-0 left-0 pointer-events-none">
                    {pointsToShow.map((event, index) => {
                        // We start from an angle of 20 degrees to 160 degrees to form the bottom arc
                        const angleDeg = totalPoints > 1
                          ? (180 - arcDegrees) / 2 + (arcDegrees / (totalPoints - 1)) * index
                          : 90; // Center if only one dot
                        
                        const angleRad = (angleDeg * Math.PI) / 180;
                        
                        // Calculate position. We use sin for Y because 90deg is straight down.
                        const x = radius * Math.cos(angleRad);
                        const y = radius * Math.sin(angleRad);
                        
                        const style = {
                            left: `calc(50% + ${x}%)`,
                            top: `calc(50% + ${y}%)`,
                            // We also translate to center the dot itself
                            transform: 'translate(-50%, -50%)',
                        };

                        return (
                            <div
                                key={`${event.id}-${index}`}
                                className="absolute"
                                style={style}
                            >
                                <div
                                    className={cn(
                                        'h-[6px] w-[6px] rounded-full',
                                        getEventColorClass(event.color)
                                    )}
                                    title={event.title}
                                />
                            </div>
                        );
                    })}
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
