// src/components/colorful-calendar.tsx
'use client';

import React, { useMemo } from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, isWithinInterval, getDay, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const getEventColorClass = (color?: string, type: 'bg' | 'text' = 'bg'): string => {
  const colorMap = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-500' },
    green: { bg: 'bg-green-500', text: 'text-green-500' },
    red: { bg: 'bg-red-500', text: 'text-red-500' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-500' },
  };
  const colorKey = color as keyof typeof colorMap;
  return (colorMap[colorKey] && colorMap[colorKey][type]) || (type === 'bg' ? 'bg-primary' : 'text-primary');
};

interface ColorfulCalendarProps {
    month: Date;
    events: CalendarEvent[];
    selectedDay: Date;
    onDateSelect: (date: Date) => void;
    onEventClick: (event: CalendarEvent) => void;
    className?: string;
}

const DayCell = React.memo(({ day, isCurrentMonth, isToday, onDateSelect, selectedDay }: {
    day: Date,
    isCurrentMonth: boolean,
    isToday: boolean,
    onDateSelect: (d: Date) => void,
    selectedDay: Date,
}) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const holiday = isHoliday(day, 'CO');
    
    return (
        <div
            onClick={() => onDateSelect(day)}
            className={cn(
                "relative p-1.5 flex flex-col bg-card group transition-colors hover:bg-muted/50 cursor-pointer h-full",
                 !isCurrentMonth && "bg-muted/30 text-muted-foreground/50",
                 isSameDay(day, selectedDay) && "bg-accent/40"
            )}
        >
            <div className="flex justify-end items-start mb-1 flex-shrink-0">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <time
                            dateTime={dayKey}
                            className={cn("flex items-center justify-center h-7 w-7 rounded-full text-sm",
                                isToday && "bg-primary text-primary-foreground",
                                holiday && "text-orange-500 font-bold"
                            )}
                        >
                            {format(day, 'd')}
                        </time>
                    </TooltipTrigger>
                    {holiday && <TooltipContent><p>{holiday.name}</p></TooltipContent>}
                </Tooltip>
            </div>
            <div className="flex-grow min-h-[60px]" />
        </div>
    );
});
DayCell.displayName = "DayCell";


export default function ColorfulCalendar({ month, events, selectedDay, onDateSelect, onEventClick, className }: ColorfulCalendarProps) {
  const today = new Date();

  const { weeks, firstDayOfCalendar } = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    
    const weeksArray: Date[][] = [];
    while (days.length) {
        weeksArray.push(days.splice(0, 7));
    }
    
    return { weeks: weeksArray, firstDayOfCalendar: start };
  }, [month]);
  
  const weeklyEvents = useMemo(() => {
      return weeks.map(week => {
          const weekStart = week[0];
          const weekEnd = week[6];
          const weekEvents = events.filter(event => 
              new Date(event.start) <= weekEnd && new Date(event.end) >= weekStart
          );
          
          weekEvents.sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());

          const layout: CalendarEvent[][] = [];
          for (const event of weekEvents) {
              let placed = false;
              for (const row of layout) {
                  const lastEvent = row[row.length - 1];
                  if (new Date(event.start) > new Date(lastEvent.end)) {
                      row.push(event);
                      placed = true;
                      break;
                  }
              }
              if (!placed) {
                  layout.push([event]);
              }
          }
          return layout;
      });
  }, [weeks, events]);

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("grid grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] h-full gap-px bg-border rounded-lg relative overflow-hidden", className)}>
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
          <div key={`${day}-${i}`} className="p-2 text-center text-xs font-semibold text-muted-foreground bg-card">{day}</div>
        ))}
        {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
                 {week.map((day) => {
                    const isCurrentMonth = day.getMonth() === month.getMonth();
                    const isToday = isSameDay(day, today);
                    return <DayCell key={day.toString()} day={day} isCurrentMonth={isCurrentMonth} isToday={isToday} onDateSelect={onDateSelect} selectedDay={selectedDay} />;
                 })}
                  <div className="col-span-7 row-start-2 row-end-[8] grid grid-cols-7 grid-rows-6 pointer-events-none">
                     {weeklyEvents[weekIndex]?.map((row, rowIndex) => (
                         row.map(event => {
                             const eventStart = new Date(event.start);
                             const eventEnd = new Date(event.end);
                             const weekStart = week[0];
                             const weekEnd = week[6];
                             
                             const startDayIndex = eventStart < weekStart ? 0 : getDay(eventStart);
                             const endDayIndex = eventEnd > weekEnd ? 6 : getDay(eventEnd);
                             
                             const span = endDayIndex - startDayIndex + 1;
                             
                             return (
                                <div
                                    key={event.id}
                                    className="absolute p-1 pointer-events-auto cursor-pointer"
                                    style={{
                                        top: `${(weekIndex * (100/6)) + (rowIndex * 1.5)}%`,
                                        left: `${startDayIndex * (100/7)}%`,
                                        width: `${span * (100/7)}%`,
                                        marginTop: '3.5rem', 
                                    }}
                                    onClick={() => onEventClick(event)}
                                >
                                    <div className={cn("w-full h-full text-xs p-1 rounded-md truncate text-white", getEventColorClass(event.color, 'bg'))}>
                                        {event.title}
                                    </div>
                                </div>
                             )
                         })
                     ))}
                 </div>
            </React.Fragment>
        ))}
      </div>
    </TooltipProvider>
  );
}