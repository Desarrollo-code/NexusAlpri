// src/components/calendar/month-view.tsx
'use client';
import React, { useMemo } from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, isSameMonth, getDay, isBefore, isAfter, differenceInCalendarDays, max, min } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';
import { ScrollArea } from '../ui/scroll-area';

const getEventColorClass = (color?: string): string => {
  const colorMap: Record<string, string> = {
    blue: 'bg-event-blue',
    green: 'bg-event-green',
    red: 'bg-event-red',
    orange: 'bg-event-orange',
  };
  return colorMap[color as string] || 'bg-primary';
};

const DayCell = ({ day, month, onDateSelect, events, onEventClick }: { 
    day: Date, 
    month: Date, 
    onDateSelect: (d: Date) => void,
    events: CalendarEvent[],
    onEventClick: (e: CalendarEvent) => void,
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
             <ScrollArea className="flex-grow pr-1 thin-scrollbar">
                <div className="space-y-1 mt-1">
                    {events.map(event => (
                        <div 
                            key={event.id}
                            onClick={(e) => {e.stopPropagation(); onEventClick(event);}}
                            className={cn(
                                "text-xs p-1 rounded-md truncate cursor-pointer font-semibold text-primary-foreground",
                                getEventColorClass(event.color)
                            )}
                        >
                            {event.title}
                        </div>
                    ))}
                </div>
            </ScrollArea>
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
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }); // Sunday start for week array
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    const weeksArray: Date[][] = [];
    while (days.length) {
        weeksArray.push(days.splice(0, 7));
    }
    return weeksArray;
  }, [currentDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(event => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        for (let day = start; day <= end; day.setDate(day.getDate() + 1)) {
             const dayKey = format(day, 'yyyy-MM-dd');
             if (!map.has(dayKey)) {
                map.set(dayKey, []);
             }
             // Add event only once per day to avoid duplicates in the list
             if (!map.get(dayKey)?.some(e => e.id === event.id)) {
                 map.get(dayKey)!.push(event);
             }
        }
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
                                key={day.toISOString()}
                                day={day}
                                month={currentDate}
                                onDateSelect={onSlotClick}
                                events={dayEvents}
                                onEventClick={onEventClick}
                            />
                        )
                    })}
                </div>
            ))}
        </div>
    </div>
  );
}
