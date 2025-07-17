// src/components/colorful-calendar.tsx
'use client';

import React, { useMemo } from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ColorfulCalendarProps {
  month: Date;
  events: CalendarEvent[];
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

export default function ColorfulCalendar({ month, events, onDateSelect, onEventClick, className }: ColorfulCalendarProps) {
  const today = new Date();

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    
    const weeksArray: Date[][] = [];
    while (days.length) {
      weeksArray.push(days.splice(0, 7));
    }
    return weeksArray;
  }, [month]);

  const sortedEvents = useMemo(() => events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()), [events]);

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("grid grid-cols-7 grid-rows-[auto_repeat(6,1fr)] h-full gap-px bg-border", className)}>
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground bg-card">{day}</div>
        ))}
        {weeks.flat().map((day, index) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = day.getMonth() === month.getMonth();
          const isToday = isSameDay(day, today);
          const holiday = isHoliday(day, 'CO');

          const dayEvents = sortedEvents.filter(event =>
            isSameDay(day, new Date(event.start)) && !event.allDay && differenceInDays(new Date(event.end), new Date(event.start)) === 0
          );
          
          return (
            <div
              key={dayKey}
              onClick={() => onDateSelect(day)}
              className={cn("relative p-1.5 flex flex-col bg-card group transition-colors hover:bg-muted/50 cursor-pointer",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground/50"
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
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <button key={event.id} onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                    className="w-full text-left text-xs flex items-center gap-1.5 truncate p-1 rounded-sm"
                  >
                    <div className={cn("h-2 w-2 rounded-full flex-shrink-0", getEventColorClass(event.color, 'bg'))}></div>
                    <span className="truncate">{event.title}</span>
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <p className="text-xs text-muted-foreground">+ {dayEvents.length - 2} más</p>
                )}
              </div>
            </div>
          );
        })}
        {/* Render multi-day events */}
        {sortedEvents.filter(e => e.allDay || differenceInDays(new Date(e.end), new Date(e.start)) > 0).map((event, eventIndex) => {
          const start = new Date(event.start);
          const end = new Date(event.end);

          const startWeekIndex = weeks.findIndex(w => w.some(d => isSameDay(d, start)));
          const endWeekIndex = weeks.findIndex(w => w.some(d => isSameDay(d, end)));

          if (startWeekIndex === -1) return null;

          const renderSegments = [];
          for (let w = startWeekIndex; w <= (endWeekIndex === -1 ? startWeekIndex : endWeekIndex); w++) {
            const week = weeks[w];
            if (!week) continue;

            const weekStart = week[0];
            const weekEnd = week[6];
            const eventStartInWeek = start > weekStart ? start : weekStart;
            const eventEndInWeek = end < weekEnd ? end : weekEnd;
            
            const startIndex = week.findIndex(d => isSameDay(d, eventStartInWeek));
            const endIndex = week.findIndex(d => isSameDay(d, eventEndInWeek));

            if (startIndex === -1) continue;
            
            const span = (endIndex === -1 ? 6 : endIndex) - startIndex + 1;
            
            const topOffset = 2.5 + (eventIndex % 3) * 1.5;

            renderSegments.push(
              <div
                key={`${event.id}-${w}`}
                onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                className={cn(
                  "absolute h-5 rounded-md text-white text-xs px-2 flex items-center truncate cursor-pointer z-10 hover:opacity-80 transition-opacity",
                  getEventColorClass(event.color)
                )}
                style={{
                  gridColumn: `${startIndex + 1} / span ${span}`,
                  gridRow: `${w + 2}`,
                  top: `${topOffset}rem`,
                }}
              >
                {event.title}
              </div>
            );
          }
          return renderSegments;
        })}
      </div>
    </TooltipProvider>
  );
}
