// src/components/colorful-calendar.tsx
'use client';

import React from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, isSameMonth, getDay, isBefore, isAfter, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';
import { useIsMobile } from '@/hooks/use-mobile';

const MAX_LANES_DESKTOP = 3;
const MAX_LANES_MOBILE = 2; 

const getEventColorClass = (color?: string): string => {
  const colorMap: Record<string, string> = {
    blue: 'bg-event-blue',
    green: 'bg-event-green',
    red: 'bg-event-red',
    orange: 'bg-event-orange',
  };
  return colorMap[color as string] || 'bg-primary';
};

const getEventBorderColorClass = (color?: string): string => {
  const colorMap: Record<string, string> = {
    blue: 'border-event-blue',
    green: 'border-event-green',
    red: 'border-event-red',
    orange: 'border-event-orange',
  };
  return colorMap[color as string] || 'border-primary';
}


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

    // Muestra eventos de un solo día como puntos
    const singleDayEvents = eventsForDay.filter(e => differenceInCalendarDays(new Date(e.end), new Date(e.start)) === 0);
    const moreCount = singleDayEvents.length > 2 ? singleDayEvents.length - 2 : 0;
    
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
                {singleDayEvents.slice(0, 2).map(event => (
                     <div key={event.id} onClick={(e) => { e.stopPropagation(); onEventClick(event); }} className={cn("text-xs flex items-start gap-1.5 p-1 rounded-md text-foreground truncate cursor-pointer")}>
                        <div className={cn("h-2 w-2 rounded-full mt-1 flex-shrink-0", getEventColorClass(event.color))} />
                        <span className="truncate flex-grow font-medium">{event.title}</span>
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

  const dailyEvents = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    weeks.flat().forEach(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        const dayEvents = events.filter(event => {
             const eventStart = new Date(event.start);
             const eventEnd = new Date(event.end);
             return !isAfter(day, eventEnd) && !isBefore(day, eventStart);
        }).sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        map.set(dayKey, dayEvents);
    });
    return map;
  }, [events, weeks]);


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
                         const eventsForDay = dailyEvents.get(dayKey) || [];
                         
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
            ))}
        </div>
    </div>
  );
}
