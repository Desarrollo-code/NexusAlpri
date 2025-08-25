// src/components/colorful-calendar.tsx
'use client';

import React, { useMemo } from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, isWithinInterval, getDay, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const getEventColorClass = (color?: string): string => {
  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
  };
  const colorKey = color as keyof typeof colorMap;
  return colorMap[colorKey] || 'bg-primary';
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
                "relative p-1.5 flex flex-col bg-card group transition-colors hover:bg-muted/50 cursor-pointer h-full border-b border-r",
                 !isCurrentMonth && "bg-muted/30 text-muted-foreground/50",
                 isSameDay(day, selectedDay) && "bg-primary/10"
            )}
        >
            <div className="flex justify-end items-start mb-1 flex-shrink-0">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <time
                            dateTime={dayKey}
                            className={cn("flex items-center justify-center h-7 w-7 rounded-full text-sm",
                                isToday && "bg-primary text-primary-foreground font-bold",
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

  const { weeks } = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    
    const weeksArray: Date[][] = [];
    while (days.length) {
        weeksArray.push(days.splice(0, 7));
    }
    
    return { weeks: weeksArray };
  }, [month]);
  
  const weeklyEvents = useMemo(() => {
    return weeks.map(week => {
        const weekStart = week[0];
        const weekEnd = week[6];
        const weekEvents = events.filter(event => 
            new Date(event.start) <= weekEnd && new Date(event.end) >= weekStart
        );
        
        weekEvents.sort((a, b) => {
            const diff = differenceInDays(new Date(b.end), new Date(b.start)) - differenceInDays(new Date(a.end), new Date(a.start));
            if (diff !== 0) return diff;
            return new Date(a.start).getTime() - new Date(b.start).getTime();
        });

        const layout: { event: CalendarEvent, lane: number }[] = [];
        const lanes: (Date | null)[][] = Array(10).fill(null).map(() => Array(7).fill(null));

        for (const event of weekEvents) {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            
            const startDayIndex = eventStart < weekStart ? 0 : getDay(eventStart);
            const endDayIndex = eventEnd > weekEnd ? 6 : getDay(eventEnd);
            
            let placed = false;
            for (let i = 0; i < lanes.length; i++) {
                let canPlace = true;
                for (let j = startDayIndex; j <= endDayIndex; j++) {
                    if (lanes[i][j]) {
                        canPlace = false;
                        break;
                    }
                }
                if (canPlace) {
                    for (let j = startDayIndex; j <= endDayIndex; j++) {
                       lanes[i][j] = eventEnd;
                    }
                    layout.push({ event, lane: i });
                    placed = true;
                    break;
                }
            }
        }
        return layout;
    });
  }, [weeks, events]);

  return (
    <TooltipProvider delayDuration={100}>
        <div className="flex flex-col h-full bg-card border-l border-t rounded-lg">
            <div className="grid grid-cols-7 flex-shrink-0">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
                <div key={`${day}-${i}`} className="p-2 text-center text-xs font-semibold text-muted-foreground border-b border-r">{day}</div>
                ))}
            </div>
            <div className="grid grid-rows-6 flex-grow relative">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 relative h-full">
                        {week.map((day) => {
                            const isCurrentMonth = day.getMonth() === month.getMonth();
                            const isToday = isSameDay(day, today);
                            return <DayCell key={day.toString()} day={day} isCurrentMonth={isCurrentMonth} isToday={isToday} onDateSelect={onDateSelect} selectedDay={selectedDay} />;
                        })}
                         {weeklyEvents[weekIndex].map(({ event, lane }) => {
                             const eventStart = new Date(event.start);
                             const eventEnd = new Date(event.end);
                             const weekStart = week[0];
                             const weekEnd = week[6];

                             const startCol = eventStart < weekStart ? 1 : getDay(eventStart) + 1;
                             const endCol = eventEnd > weekEnd ? 8 : getDay(eventEnd) + 2;

                             return (
                                <div
                                    key={event.id + weekIndex}
                                    onClick={() => onEventClick(event)}
                                    className="absolute p-px cursor-pointer"
                                    style={{
                                        gridColumnStart: startCol,
                                        gridColumnEnd: endCol,
                                        gridRowStart: 1,
                                        top: `${2.2 + (lane * 1.5)}rem`,
                                        zIndex: 10 + lane,
                                    }}
                                >
                                    <div className={cn("w-full h-5 text-xs px-1 rounded truncate text-white flex items-center", getEventColorClass(event.color))}>
                                        {event.title}
                                    </div>
                                </div>
                             )
                         })}
                    </div>
                ))}
            </div>
        </div>
    </TooltipProvider>
  );
}
