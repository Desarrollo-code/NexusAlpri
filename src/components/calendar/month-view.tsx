// src/components/calendar/month-view.tsx
'use client';
import React from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, isSameMonth, getDay, isBefore, isAfter, differenceInCalendarDays, max, min } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';

const getEventColorClass = (color?: string): string => {
  const colorMap: Record<string, string> = {
    blue: 'bg-event-blue text-white',
    green: 'bg-event-green text-white',
    red: 'bg-event-red text-white',
    orange: 'bg-event-orange text-white',
  };
  return colorMap[color as string] || 'bg-primary text-primary-foreground';
};

const DayCell = ({ day, month, onDateSelect, onEventClick, eventsForDay }: { 
    day: Date, 
    month: Date, 
    onDateSelect: (d: Date) => void,
    onEventClick: (e: CalendarEvent) => void,
    eventsForDay: CalendarEvent[]
}) => {
    const today = new Date();
    const holiday = isHoliday(day, 'CO');
    
    return (
        <div
            onClick={() => onDateSelect(day)}
            className={cn(
                "relative p-1 flex flex-col bg-card group transition-colors hover:bg-muted/50 cursor-pointer border-r border-b",
                !isSameMonth(day, month) && "bg-muted/30 text-muted-foreground/50",
                "min-h-[120px]"
            )}
        >
            <time
                dateTime={format(day, 'yyyy-MM-dd')}
                className={cn("flex items-center justify-center text-xs sm:text-sm rounded-full h-7 w-7",
                    isSameDay(day, today) && "bg-primary text-primary-foreground font-bold",
                    holiday && "text-red-500 font-semibold"
                )}
            >
                {format(day, 'd')}
            </time>
             <div className="mt-1 space-y-1 overflow-hidden">
                {eventsForDay.slice(0, 3).map(event => (
                    <div 
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        className={cn(
                            "text-xs p-1 rounded-md truncate cursor-pointer font-semibold",
                            getEventColorClass(event.color)
                        )}
                    >
                        {event.title}
                    </div>
                ))}
                {eventsForDay.length > 3 && (
                    <div className="text-xs font-bold text-primary">+ {eventsForDay.length - 3} más</div>
                )}
            </div>
        </div>
    );
}


interface MonthViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
    onSlotClick: (date: Date) => void;
}

export function MonthView({ currentDate, events, onEventClick, onSlotClick }: MonthViewProps) {
  const weeks = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    const weeksArray: Date[][] = [];
    while (days.length) {
        weeksArray.push(days.splice(0, 7));
    }
    return weeksArray;
  }, [currentDate]);

  const eventsByDay = React.useMemo(() => {
      const map = new Map<string, CalendarEvent[]>();
      events.forEach(event => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        const daysInEvent = eachDayOfInterval({start, end});
        daysInEvent.forEach(day => {
             const dayKey = format(day, 'yyyy-MM-dd');
             if(!map.has(dayKey)) map.set(dayKey, []);
             map.get(dayKey)!.push(event);
        });
      });
      return map;
  }, [events]);

  return (
    <div className="flex flex-col h-full">
        <div className="grid grid-cols-7 flex-shrink-0">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground border-b border-r">{day}</div>
            ))}
        </div>
        <div className="flex-grow grid grid-cols-1" style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
             {weeks.map((week, weekIndex) => (
                 <div key={weekIndex} className="grid grid-cols-7">
                    {week.map(day => {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const dayEvents = eventsByDay.get(dayKey) || [];
                        return (
                            <DayCell 
                                key={day.toString()}
                                day={day}
                                month={currentDate}
                                onDateSelect={onSlotClick}
                                onEventClick={onEventClick}
                                eventsForDay={dayEvents}
                            />
                        )
                    })}
                 </div>
            ))}
        </div>
    </div>
  );
}
