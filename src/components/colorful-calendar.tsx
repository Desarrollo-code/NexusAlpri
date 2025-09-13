// src/components/colorful-calendar.tsx
'use client';

import React from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, isSameMonth, getDay, isBefore, isAfter, differenceInCalendarDays, max, min } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';
import { useIsMobile } from '@/hooks/use-mobile';


const getEventColorClass = (color?: string, type: 'bg' | 'border' | 'text' = 'bg'): string => {
  const colorMap: Record<string, Record<string, string>> = {
    blue: { bg: 'bg-event-blue/20', border: 'border-event-blue', text: 'text-event-blue' },
    green: { bg: 'bg-event-green/20', border: 'border-event-green', text: 'text-event-green' },
    red: { bg: 'bg-event-red/20', border: 'border-event-red', text: 'text-event-red' },
    orange: { bg: 'bg-event-orange/20', border: 'border-event-orange', text: 'text-event-orange' },
    primary: { bg: 'bg-primary/20', border: 'border-primary', text: 'text-primary' },
  };
  const safeColor = color || 'primary';
  return (colorMap[safeColor] || colorMap.primary)[type];
};


interface DayCellProps {
  day: Date;
  month: Date;
  selectedDay: Date;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  eventsForDay: CalendarEvent[];
}

const DayCell: React.FC<DayCellProps> = ({ day, month, selectedDay, onDateSelect, onEventClick, eventsForDay }) => {
    const today = new Date();
    const dayKey = format(day, 'yyyy-MM-dd');
    const holiday = isHoliday(day, 'CO');

    const moreCount = eventsForDay.length > 2 ? eventsForDay.length - 2 : 0;
    
    return (
        <div
            onClick={() => onDateSelect(day)}
            className={cn(
                "relative p-1.5 flex flex-col bg-card group transition-colors hover:bg-muted/50 cursor-pointer border-r border-b",
                !isSameMonth(day, month) && "bg-muted/30 text-muted-foreground/50",
                isSameDay(day, selectedDay) && "bg-primary/10",
                "min-h-[120px]"
            )}
        >
            <div className="flex justify-between items-center mb-1 flex-shrink-0">
                <time
                    dateTime={dayKey}
                    className={cn("flex items-center justify-center text-xs sm:text-sm rounded-full h-7 w-7",
                        isSameDay(day, today) && "bg-primary text-primary-foreground font-bold",
                        holiday && "text-red-500 font-semibold"
                    )}
                >
                    {format(day, 'd')}
                </time>
            </div>
             <div className="mt-1 space-y-1">
                {eventsForDay.slice(0, 2).map(event => (
                     <div 
                        key={event.id} 
                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }} 
                        className={cn(
                            "text-xs p-1 rounded-md truncate cursor-pointer font-semibold border",
                            getEventColorClass(event.color, 'bg'),
                            getEventColorClass(event.color, 'border'),
                            getEventColorClass(event.color, 'text'),
                        )}
                    >
                        {event.title}
                     </div>
                ))}
            </div>

             {moreCount > 0 && (
                <div className="text-xs font-semibold text-primary mt-auto pl-1">+ {moreCount} más</div>
            )}
        </div>
    );
};


interface ColorfulCalendarProps {
    month: Date;
    events: CalendarEvent[];
    selectedDay: Date;
    onDateSelect: (date: Date) => void;
    onEventClick: (event: CalendarEvent) => void;
    className?: string;
}

export default function ColorfulCalendar({ month, events, selectedDay, onDateSelect, onEventClick, className }: ColorfulCalendarProps) {

  const weeks = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    const weeksArray: Date[][] = [];
    while (days.length) {
        weeksArray.push(days.splice(0, 7));
    }
    return weeksArray;
  }, [month]);

  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        const dateRange = eachDayOfInterval({ start: eventStart, end: eventEnd });
        dateRange.forEach(date => {
            const dayKey = format(date, 'yyyy-MM-dd');
            if (!map.has(dayKey)) {
                map.set(dayKey, []);
            }
            map.get(dayKey)!.push(event);
        })
    });
    return map;
  }, [events]);

  return (
    <div className={cn("flex flex-col h-full bg-card border-l border-t rounded-lg", className)}>
        <div className="grid grid-cols-7 flex-shrink-0">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground border-b border-r">{day}</div>
            ))}
        </div>
        <div className="flex-grow grid grid-cols-1" style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
            {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 relative">
                         {week.map((day) => {
                             const dayKey = format(day, 'yyyy-MM-dd');
                             const eventsForDay = eventsByDay.get(dayKey) || [];
                             return (
                                 <DayCell
                                     key={day.toString()}
                                     day={day}
                                     month={month}
                                     selectedDay={selectedDay}
                                     onDateSelect={onDateSelect}
                                     onEventClick={onEventClick}
                                     eventsForDay={eventsForDay}
                                 />
                             )
                         })}
                    </div>
                )
            )}
        </div>
    </div>
  );
}