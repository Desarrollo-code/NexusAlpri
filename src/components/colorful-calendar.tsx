// src/components/colorful-calendar.tsx
'use client';

import React, { useMemo } from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, isWithinInterval, getDay, differenceInDays, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const getEventColorClass = (color?: string): string => {
  const colorMap = {
    blue: 'bg-blue-500 border-blue-600 text-white',
    green: 'bg-green-500 border-green-600 text-white',
    red: 'bg-red-500 border-red-600 text-white',
    orange: 'bg-orange-500 border-orange-600 text-white',
  };
  const colorKey = color as keyof typeof colorMap;
  return colorMap[colorKey] || 'bg-primary border-primary/80 text-primary-foreground';
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
  const today = new Date();
  const MAX_LANES = 2; // Show max 2 events + "more" indicator

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
  
  const positionedEventsByWeek = useMemo(() => {
      return weeks.map(week => {
          const weekStart = week[0];
          const weekEnd = week[6];

          const eventsInWeek = events.filter(event => 
              new Date(event.start) <= weekEnd && new Date(event.end) >= weekStart
          );

          eventsInWeek.sort((a, b) => {
              const diffA = differenceInDays(new Date(a.end), new Date(a.start));
              const diffB = differenceInDays(new Date(b.end), new Date(b.start));
              if (diffA !== diffB) return diffB - diffA;
              return new Date(a.start).getTime() - new Date(b.start).getTime();
          });

          const lanes: (CalendarEvent | null)[][] = Array.from({ length: MAX_LANES }, () => Array(7).fill(null));
          const positionedEvents: any[] = [];
          const moreCounts: Record<string, number> = {};
          
          eventsInWeek.forEach(event => {
              const start = new Date(event.start);
              const end = new Date(event.end);
              const eventStartDay = start < weekStart ? 0 : getDay(start);
              const eventEndDay = end > weekEnd ? 6 : getDay(end);
              
              let placed = false;
              for (let laneIndex = 0; laneIndex < MAX_LANES; laneIndex++) {
                  let canPlace = true;
                  for (let i = eventStartDay; i <= eventEndDay; i++) {
                      if (lanes[laneIndex][i]) {
                          canPlace = false;
                          break;
                      }
                  }
                  if (canPlace) {
                      for (let i = eventStartDay; i <= eventEndDay; i++) {
                          lanes[laneIndex][i] = event;
                      }
                      positionedEvents.push({
                          ...event,
                          startDay: eventStartDay,
                          span: eventEndDay - eventStartDay + 1,
                          isStart: start >= weekStart,
                          isEnd: end <= weekEnd,
                          lane: laneIndex,
                      });
                      placed = true;
                      break;
                  }
              }

              if (!placed) {
                   for (let i = eventStartDay; i <= eventEndDay; i++) {
                       const dayKey = format(week[i], 'yyyy-MM-dd');
                       moreCounts[dayKey] = (moreCounts[dayKey] || 0) + 1;
                   }
              }
          });

          return { positionedEvents, moreCounts };
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
            <div className="grid grid-rows-6 flex-grow">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 h-full relative">
                        {week.map((day) => {
                             const dayKey = format(day, 'yyyy-MM-dd');
                             const holiday = isHoliday(day, 'CO');
                             const { moreCounts } = positionedEventsByWeek[weekIndex];
                             const moreCount = moreCounts[dayKey] || 0;

                             return (
                                 <div
                                    key={day.toString()}
                                    onClick={() => onDateSelect(day)}
                                    className={cn(
                                        "relative p-1.5 flex flex-col bg-card group transition-colors hover:bg-muted/50 cursor-pointer h-[120px] sm:h-[140px] border-b border-r",
                                        !isSameMonth(day, month) && "bg-muted/30 text-muted-foreground/50",
                                        isSameDay(day, selectedDay) && "bg-primary/10"
                                    )}
                                >
                                    <div className="flex justify-end items-start mb-1 flex-shrink-0">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <time
                                                    dateTime={dayKey}
                                                    className={cn("flex items-center justify-center h-7 w-7 rounded-full text-sm",
                                                        isSameDay(day, today) && "bg-primary text-primary-foreground font-bold",
                                                        holiday && "text-red-500 font-semibold"
                                                    )}
                                                >
                                                    {format(day, 'd')}
                                                </time>
                                            </TooltipTrigger>
                                            {holiday && <TooltipContent><p>{holiday.name}</p></TooltipContent>}
                                        </Tooltip>
                                    </div>
                                    {moreCount > 0 && (
                                        <div className="text-xs text-muted-foreground font-semibold pl-1 mt-auto z-10">{moreCount} más...</div>
                                    )}
                                </div>
                             )
                        })}

                        {/* Events Layer for the week */}
                        <div className="absolute top-10 left-0 right-0 h-full pointer-events-none grid grid-cols-7 gap-px">
                            {positionedEventsByWeek[weekIndex].positionedEvents.map(event => (
                                <div
                                    key={event.id}
                                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                    className={cn(
                                        "absolute h-6 pointer-events-auto cursor-pointer px-1 text-xs font-semibold flex items-center truncate",
                                        getEventColorClass(event.color),
                                        event.isStart && 'rounded-l-lg',
                                        event.isEnd && 'rounded-r-lg',
                                    )}
                                    style={{
                                        top: `${(event.lane || 0) * 1.75}rem`, // 1.5rem height + 0.25rem gap
                                        left: `calc(${(event.startDay / 7) * 100}% + 1px)`,
                                        width: `calc(${(event.span / 7) * 100}% - 2px)`,
                                    }}
                                >
                                    {event.isStart && event.title}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </TooltipProvider>
  );
}
