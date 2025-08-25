// src/components/colorful-calendar.tsx
'use client';

import React, { useMemo } from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, isWithinInterval, subDays } from 'date-fns';
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
    
    const daySpecificEvents = useMemo(() => {
        return events
            .filter(event => {
                 try {
                    const eventStart = new Date(event.start);
                    const eventEnd = new Date(event.end);
                    // Asegura que los eventos que terminan a medianoche se incluyan en el día anterior.
                    const adjustedEnd = eventEnd.getHours() === 0 && eventEnd.getMinutes() === 0 ? subDays(eventEnd, 1) : eventEnd;
                    return isWithinInterval(day, { start: eventStart, end: adjustedEnd });
                } catch (e) {
                    // Si las fechas son inválidas, no mostrar el evento.
                    return false;
                }
            })
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }, [events, day]);


    const dotEvents = useMemo(() => {
        const uniqueColors = new Set<string>();
        daySpecificEvents.forEach(event => {
            if (event.color) uniqueColors.add(event.color);
        });
        return Array.from(uniqueColors).slice(0, 4);
    }, [daySpecificEvents]);

    return (
        <div
            onClick={() => onDateSelect(day)}
            className={cn(
                "relative p-1.5 flex flex-col bg-card group transition-colors hover:bg-muted/50 cursor-pointer",
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
            
             <div className="flex-grow overflow-y-auto space-y-1 min-h-0 pr-1 thin-scrollbar">
                {daySpecificEvents.map(event => (
                    <div 
                        key={event.id}
                        className={cn("text-xs p-1 rounded-md truncate text-white", getEventColorClass(event.color, 'bg'))}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                    >
                        {event.title}
                    </div>
                ))}
            </div>

            {dotEvents.length > 0 && (
                 <div className="flex justify-center items-center gap-1 pt-1 flex-shrink-0 md:hidden">
                    {dotEvents.map((color, index) => (
                         <div key={index} className={cn("h-1.5 w-1.5 rounded-full", getEventColorClass(color, 'bg'))}></div>
                    ))}
                 </div>
            )}
        </div>
    );
});
DayCell.displayName = "DayCell";


export default function ColorfulCalendar({ month, events, selectedDay, onDateSelect, onEventClick, className }: ColorfulCalendarProps) {
  const today = new Date();

  const { weeks } = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    
    const weeksArray: Date[][] = [];
    let weekIndex = 0;
    while (days.length) {
        // Ensure the last week is filled up to 7 days
        const weekSlice = days.splice(0, 7);
        weeksArray.push(weekSlice);
        weekIndex++;
    }
    // Fill the last week if it's not a full 7 days
    if(weeksArray.length > 0) {
        const lastWeek = weeksArray[weeksArray.length - 1];
        while(lastWeek.length < 7) {
            lastWeek.push(new Date(lastWeek[lastWeek.length - 1].getTime() + 24 * 60 * 60 * 1000));
        }
    }
    
    return { weeks: weeksArray };
  }, [month]);
  
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
                    return <DayCell key={day.toString()} day={day} isCurrentMonth={isCurrentMonth} isToday={isToday} onDateSelect={onDateSelect} onEventClick={onEventClick} events={events} selectedDay={selectedDay} />;
                 })}
            </React.Fragment>
        ))}
      </div>
    </TooltipProvider>
  );
}
