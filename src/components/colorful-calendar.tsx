// src/components/colorful-calendar.tsx
'use client';

import React, { useMemo } from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, differenceInDays, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ColorfulCalendarProps {
  month: Date;
  events: CalendarEvent[];
  selectedDay: Date;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  className?: string;
}

const getEventColorClass = (color?: string, type: 'bg' | 'text' = 'bg'): string => {
  const colorMap = {
    blue: { bg: 'bg-event-blue', text: 'text-event-blue' },
    green: { bg: 'bg-event-green', text: 'text-event-green' },
    red: { bg: 'bg-event-red', text: 'text-event-red' },
    orange: { bg: 'bg-event-orange', text: 'text-event-orange' },
  };
  const colorKey = color as keyof typeof colorMap;
  return (colorMap[colorKey] && colorMap[colorKey][type]) || (type === 'bg' ? 'bg-primary' : 'text-primary');
};

const DayCell = React.memo(({ day, isCurrentMonth, isToday, onDateSelect, onEventClick, events, selectedDay }: {
    day: Date,
    isCurrentMonth: boolean,
    isToday: boolean,
    onDateSelect: (d: Date) => void,
    onEventClick: (e: CalendarEvent) => void,
    events: CalendarEvent[],
    selectedDay: Date,
}) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const holiday = isHoliday(day, 'CO');
    
    // Filter events that happen on this specific day but are NOT multi-day/all-day
    const daySpecificEvents = events.filter(event => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        const isSingleDayEvent = isSameDay(start, end) && !event.allDay;
        return isSameDay(start, day) && isSingleDayEvent;
    });

    return (
        <div
            onClick={() => onDateSelect(day)}
            className={cn(
                "relative p-1.5 flex flex-col bg-card group transition-colors hover:bg-muted/50 cursor-pointer min-h-[100px]",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground/50",
                isSameDay(day, selectedDay) && "bg-accent/40"
            )}
        >
            <div className="flex justify-end mb-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <time
                            dateTime={dayKey}
                            className={cn("flex items-center justify-center h-7 w-7 rounded-full text-sm",
                                isToday && "bg-primary text-primary-foreground",
                                holiday && "text-event-orange font-bold"
                            )}
                        >
                            {format(day, 'd')}
                        </time>
                    </TooltipTrigger>
                    {holiday && <TooltipContent><p>{holiday.name}</p></TooltipContent>}
                </Tooltip>
            </div>
            <div className="space-y-1 overflow-hidden">
                {daySpecificEvents.slice(0, 2).map(event => (
                    <button key={event.id} onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        className="w-full text-left text-xs flex items-center gap-1.5 truncate p-1 rounded-sm hover:bg-background/80"
                    >
                        <div className={cn("h-2 w-2 rounded-full flex-shrink-0", getEventColorClass(event.color, 'bg'))}></div>
                        <span className="truncate">{event.title}</span>
                    </button>
                ))}
                {daySpecificEvents.length > 2 && (
                    <p className="text-xs text-muted-foreground pl-1">+ {daySpecificEvents.length - 2} más</p>
                )}
            </div>
        </div>
    );
});
DayCell.displayName = "DayCell";


export default function ColorfulCalendar({ month, events, selectedDay, onDateSelect, onEventClick, className }: ColorfulCalendarProps) {
  const today = new Date();

  const { weeks, daysInGrid } = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    
    const weeksArray: Date[][] = [];
    while (days.length) {
      weeksArray.push(days.splice(0, 7));
    }
    return { weeks: weeksArray, daysInGrid: eachDayOfInterval({ start, end }) };
  }, [month]);

  const sortedEvents = useMemo(() => events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()), [events]);

  const multiDayEvents = useMemo(() => {
      return sortedEvents
          .filter(e => e.allDay || differenceInDays(new Date(e.end), new Date(e.start)) >= 1)
          .map(event => {
              const start = new Date(event.start);
              const end = new Date(event.end);
              return { ...event, start, end };
          });
  }, [sortedEvents]);


  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("grid grid-cols-7 grid-rows-[auto_repeat(6,1fr)] h-full gap-px bg-border rounded-lg overflow-hidden", className)}>
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground bg-card">{day}</div>
        ))}
        {daysInGrid.map((day, index) => {
            const isCurrentMonth = day.getMonth() === month.getMonth();
            const isToday = isSameDay(day, today);
            return <DayCell key={index} day={day} isCurrentMonth={isCurrentMonth} isToday={isToday} onDateSelect={onDateSelect} onEventClick={onEventClick} events={events} selectedDay={selectedDay} />;
        })}
        {multiDayEvents.map((event, eventIndex) => {
            const startIdx = daysInGrid.findIndex(d => isSameDay(d, event.start));
            const endIdx = daysInGrid.findIndex(d => isSameDay(d, event.end));

            if (startIdx === -1 && endIdx === -1) return null; // Event not in this view

            const firstDayOfWeek = startOfWeek(month);
            const eventStart = event.start < firstDayOfWeek ? firstDayOfWeek : event.start;
            const eventStartIdx = daysInGrid.findIndex(d => isSameDay(d, eventStart));

            const lastDayOfWeek = endOfWeek(endOfMonth(month));
            const eventEnd = event.end > lastDayOfWeek ? lastDayOfWeek : event.end;
            const eventEndIdx = daysInGrid.findIndex(d => isSameDay(d, eventEnd));

            const gridRow = Math.floor(eventStartIdx / 7) + 2;
            const gridColumnStart = (eventStartIdx % 7) + 1;
            const span = (eventEndIdx - eventStartIdx) + 1;
            
            if (eventStartIdx === -1) return null;

            return (
                 <div
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                    className={cn(
                        "absolute h-6 rounded-md text-white text-xs px-2 flex items-center truncate cursor-pointer z-10 hover:opacity-80 transition-opacity",
                        getEventColorClass(event.color, 'bg')
                    )}
                    style={{
                        gridRow: gridRow,
                        gridColumn: `${gridColumnStart} / span ${span > 0 ? span : 1}`,
                        top: `${2 + (eventIndex % 4) * 1.75}rem`,
                    }}
                >
                    {event.title}
                </div>
            );
        })}
      </div>
    </TooltipProvider>
  );
}
