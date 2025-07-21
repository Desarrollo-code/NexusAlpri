// src/components/colorful-calendar.tsx
'use client';

import React, { useMemo } from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek } from 'date-fns';
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
                "relative p-1.5 flex flex-col bg-card group transition-colors hover:bg-muted/50 cursor-pointer min-h-[120px] overflow-hidden",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground/50",
                isSameDay(day, selectedDay) && "bg-accent/40"
            )}
        >
            <div className="flex justify-end mb-1 flex-shrink-0">
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
            <div className="flex-grow overflow-y-auto space-y-1 min-h-0 pr-1">
                {daySpecificEvents.map(event => (
                    <button key={event.id} onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        className="w-full text-left text-xs flex items-center gap-1.5 truncate p-1 rounded-sm hover:bg-background/80"
                    >
                        <div className={cn("h-2 w-2 rounded-full flex-shrink-0", getEventColorClass(event.color, 'bg'))}></div>
                        <span className="truncate">{event.title}</span>
                    </button>
                ))}
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

  const multiDayEvents = useMemo(() => {
    const eventPositions: Record<string, { top: number, event: CalendarEvent }[]> = {};
    
    // Sort events to prioritize longer events
    const sorted = [...events].sort((a,b) => {
        const aDuration = new Date(a.end).getTime() - new Date(a.start).getTime();
        const bDuration = new Date(b.end).getTime() - new Date(b.start).getTime();
        return bDuration - aDuration;
    });

    for (const event of sorted) {
        if (!event.allDay && isSameDay(new Date(event.start), new Date(event.end))) continue;

        let topPosition = 0;
        let placed = false;

        while (!placed) {
            let weekIsFree = true;
            let dayToCheck = new Date(event.start);

            while(dayToCheck <= new Date(event.end)) {
                 const dayKey = format(dayToCheck, 'yyyy-MM-dd');
                 if(eventPositions[dayKey]?.some(p => p.top === topPosition)) {
                     weekIsFree = false;
                     break;
                 }
                 dayToCheck.setDate(dayToCheck.getDate() + 1);
            }
            
            if (weekIsFree) {
                let dayToPlace = new Date(event.start);
                 while(dayToPlace <= new Date(event.end)) {
                    const dayKey = format(dayToPlace, 'yyyy-MM-dd');
                    if (!eventPositions[dayKey]) eventPositions[dayKey] = [];
                    eventPositions[dayKey].push({top: topPosition, event});
                    dayToPlace.setDate(dayToPlace.getDate() + 1);
                 }
                 placed = true;
                 (event as any).topPosition = topPosition; // Add position to event object
            } else {
                topPosition++;
            }
        }
    }
    return sorted.filter(e => e.allDay || !isSameDay(new Date(e.start), new Date(e.end)));
  }, [events]);


  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("grid grid-cols-7 grid-rows-[auto] auto-rows-fr h-full gap-px bg-border rounded-lg overflow-hidden relative", className)}>
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground bg-card">{day}</div>
        ))}
        {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
                 {week.map((day, dayIndex) => {
                    const isCurrentMonth = day.getMonth() === month.getMonth();
                    const isToday = isSameDay(day, today);
                    return <DayCell key={day.toString()} day={day} isCurrentMonth={isCurrentMonth} isToday={isToday} onDateSelect={onDateSelect} onEventClick={onEventClick} events={events} selectedDay={selectedDay} />;
                 })}
                 
                {multiDayEvents.filter(event => {
                    const start = new Date(event.start);
                    const end = new Date(event.end);
                    return start <= week[6] && end >= week[0];
                }).map(event => {
                    const start = new Date(event.start);
                    const end = new Date(event.end);
                    const eventStartDay = start < week[0] ? week[0] : start;
                    const eventEndDay = end > week[6] ? week[6] : end;

                    const startCol = eventStartDay.getDay() + 1;
                    const endCol = eventEndDay.getDay() + 1;
                    const span = endCol - startCol + 1;

                    return (
                        <div key={event.id}
                             className={cn("absolute h-6 rounded text-white text-xs px-2 flex items-center truncate cursor-pointer z-10 hover:opacity-80 transition-opacity", getEventColorClass(event.color, 'bg'))}
                             style={{
                                gridRow: weekIndex + 2,
                                gridColumn: `${startCol} / span ${span}`,
                                top: `${3.75 + (((event as any).topPosition ?? 0) * 1.6)}rem` // Adjusted positioning
                             }}
                             onClick={(e) => { e.stopPropagation(); onEventClick(event); }}>
                             {event.title}
                        </div>
                    );
                })}

            </React.Fragment>
        ))}
      </div>
    </TooltipProvider>
  );
}
