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
    blue: 'bg-blue-500 border-blue-600',
    green: 'bg-green-500 border-green-600',
    red: 'bg-red-500 border-red-600',
    orange: 'bg-orange-500 border-orange-600',
  };
  const colorKey = color as keyof typeof colorMap;
  return colorMap[colorKey] || 'bg-primary border-primary/80';
};

interface ColorfulCalendarProps {
    month: Date;
    events: CalendarEvent[];
    selectedDay: Date;
    onDateSelect: (date: Date) => void;
    onEventClick: (event: CalendarEvent) => void;
    className?: string;
}

const DayCell = ({ day, isCurrentMonth, isToday, onDateSelect, selectedDay }: {
    day: Date,
    isCurrentMonth: boolean,
    isToday: boolean,
    onDateSelect: (d: Date) => void,
    selectedDay: Date
}) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const holiday = isHoliday(day, 'CO');
    
    return (
        <div
            onClick={() => onDateSelect(day)}
            className={cn(
                "relative p-1.5 flex flex-col bg-card group transition-colors hover:bg-muted/50 cursor-pointer h-[120px] sm:h-[140px] border-b border-r",
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
        </div>
    );
};

export default function ColorfulCalendar({ month, events, selectedDay, onDateSelect, onEventClick, className }: ColorfulCalendarProps) {
  const today = new Date();

  // Genera las semanas del calendario.
  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 }); // Dom-Sab
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    
    const weeksArray: Date[][] = [];
    while (days.length) {
        weeksArray.push(days.splice(0, 7));
    }
    
    return weeksArray;
  }, [month]);
  
  const weeklyEvents = useMemo(() => {
    return weeks.map(week => {
      const weekStart = week[0];
      const weekEnd = week[6];

      const eventsInWeek = events.filter(event => 
          new Date(event.start) <= weekEnd && new Date(event.end) >= weekStart
      );
      
      const sortedEvents = eventsInWeek.sort((a, b) => {
          const diffA = differenceInDays(new Date(a.end), new Date(a.start));
          const diffB = differenceInDays(new Date(b.end), new Date(b.start));
          if (diffA !== diffB) return diffB - diffA; // Longer events first
          return new Date(a.start).getTime() - new Date(b.start).getTime(); // Then by start date
      });

      const layout: any[][] = []; // This will hold the event layout for the week

      for (const event of sortedEvents) {
        let placed = false;
        for (let lane = 0; lane < layout.length; lane++) {
          let isLaneFree = true;
          for (let i = 0; i < 7; i++) {
            const day = week[i];
            if (isWithinInterval(day, { start: new Date(event.start), end: new Date(event.end) }) && layout[lane][i]) {
              isLaneFree = false;
              break;
            }
          }
          if (isLaneFree) {
            for (let i = 0; i < 7; i++) {
              const day = week[i];
              if (isWithinInterval(day, { start: new Date(event.start), end: new Date(event.end) })) {
                layout[lane][i] = event;
              }
            }
            placed = true;
            break;
          }
        }
        if (!placed) {
          const newLane = new Array(7).fill(null);
          for (let i = 0; i < 7; i++) {
            const day = week[i];
            if (isWithinInterval(day, { start: new Date(event.start), end: new Date(event.end) })) {
              newLane[i] = event;
            }
          }
          layout.push(newLane);
        }
      }

      const positionedEvents = [];
      const processedEventIds = new Set();
      
      for(let laneIndex = 0; laneIndex < layout.length; laneIndex++) {
        for(let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const event = layout[laneIndex][dayIndex];
            if(event && !processedEventIds.has(event.id)) {
                let span = 1;
                for(let i = dayIndex + 1; i < 7; i++) {
                    if(layout[laneIndex][i]?.id === event.id) {
                        span++;
                    } else {
                        break;
                    }
                }
                positionedEvents.push({
                    event,
                    startCol: dayIndex + 1,
                    span,
                    lane: laneIndex,
                });
                processedEventIds.add(event.id);
            }
        }
      }

      return positionedEvents;
    });
  }, [weeks, events]);

  return (
    <TooltipProvider delayDuration={100}>
        <div className={cn("flex flex-col h-full bg-card border-l border-t rounded-lg", className)}>
            <div className="grid grid-cols-7 flex-shrink-0">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, i) => (
                <div key={`${day}-${i}`} className="p-2 text-center text-xs font-semibold text-muted-foreground border-b border-r">{day}</div>
                ))}
            </div>
            <div className="grid grid-rows-6 flex-grow relative">
                {/* Day Grid Layer */}
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 h-full">
                        {week.map((day) => {
                            const isCurrentMonth = day.getMonth() === month.getMonth();
                            const isToday = isSameDay(day, today);
                            return (
                                <DayCell 
                                    key={day.toString()} 
                                    day={day} 
                                    isCurrentMonth={isCurrentMonth} 
                                    isToday={isToday} 
                                    onDateSelect={onDateSelect} 
                                    selectedDay={selectedDay}
                                />
                            );
                        })}
                    </div>
                ))}
                {/* Events Layer */}
                 <div className="absolute inset-0 grid grid-rows-6 pointer-events-none">
                     {weeklyEvents.map((weekLayout, weekIndex) => (
                         <div key={weekIndex} className="relative grid grid-cols-7 h-full pt-8">
                             {weekLayout.map(({ event, startCol, span, lane }) => (
                                <div
                                    key={event.id + weekIndex}
                                    className="absolute h-6 pointer-events-auto cursor-pointer px-1"
                                    style={{
                                        gridColumnStart: startCol,
                                        gridColumnEnd: `span ${span}`,
                                        top: `${lane * 1.65}rem` // 1.5rem for height + 0.15rem for gap
                                    }}
                                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                >
                                     <div className={cn("w-full h-full rounded text-white text-xs truncate flex items-center px-2", getEventColorClass(event.color))}>
                                        {event.title}
                                    </div>
                                </div>
                             ))}
                         </div>
                     ))}
                 </div>
            </div>
        </div>
    </TooltipProvider>
  );
}
