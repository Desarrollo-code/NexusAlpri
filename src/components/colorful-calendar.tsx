// src/components/colorful-calendar.tsx
'use client';

import React, { useMemo } from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, isWithinInterval, getDay, differenceInDays, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const MAX_LANES = 2; // Show 2 lanes, then "+X more"

const getEventColorClass = (color?: string): string => {
  const colorMap = {
    blue: 'bg-event-blue border-blue-600 text-white',
    green: 'bg-event-green border-green-600 text-white',
    red: 'bg-event-red border-red-600 text-white',
    orange: 'bg-event-orange border-orange-600 text-white',
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
              const diffA = differenceInDays(new Date(b.end), new Date(a.start));
              const diffB = differenceInDays(new Date(a.end), new Date(b.start));
              if (diffA !== diffB) return diffA - diffB;
              return new Date(a.start).getTime() - new Date(b.start).getTime();
          });
          
          const lanes: (CalendarEvent | null)[][] = Array.from({ length: 10 }, () => Array(7).fill(null));
          const positionedEvents: any[] = [];
          const dailyEventCounts: Record<string, number> = {};

          eventsInWeek.forEach(event => {
            const start = new Date(event.start);
            const end = new Date(event.end);
            
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                if (d >= weekStart && d <= weekEnd) {
                    const dayKey = format(d, 'yyyy-MM-dd');
                    dailyEventCounts[dayKey] = (dailyEventCounts[dayKey] || 0) + 1;
                }
            }
        });

          eventsInWeek.forEach(event => {
              const start = new Date(event.start);
              const end = new Date(event.end);
              const eventStartDay = start < weekStart ? 0 : getDay(start);
              const eventEndDay = end > weekEnd ? 6 : getDay(end);
              
              let placed = false;
              for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
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
          });

          return { positionedEvents, moreCounts: dailyEventCounts };
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
            <div className="flex flex-col flex-grow">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 h-full relative border-b">
                        {week.map((day) => {
                             const dayKey = format(day, 'yyyy-MM-dd');
                             const holiday = isHoliday(day, 'CO');
                             const { moreCounts } = positionedEventsByWeek[weekIndex];
                             const totalEventsToday = moreCounts[dayKey] || 0;
                             const moreCount = totalEventsToday > MAX_LANES ? totalEventsToday - MAX_LANES : 0;

                             return (
                                 <div
                                    key={day.toString()}
                                    onClick={() => onDateSelect(day)}
                                    className={cn(
                                        "relative p-1.5 flex flex-col bg-card group transition-colors hover:bg-muted/50 cursor-pointer min-h-[120px] sm:min-h-[140px] border-r",
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
                                        <div className="text-xs text-primary font-semibold pl-1 mt-auto absolute bottom-1 left-1 z-10 hover:underline">{moreCount} más...</div>
                                    )}
                                </div>
                             )
                        })}

                        {/* Events Layer for the week */}
                         <div className="absolute top-8 left-0 right-0 h-auto pointer-events-none grid grid-cols-7 gap-px p-1">
                            {positionedEventsByWeek[weekIndex].positionedEvents.filter(e => e.lane < MAX_LANES).map(event => (
                                <div
                                    key={event.id}
                                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                    className={cn(
                                        "h-6 pointer-events-auto cursor-pointer px-1 text-xs font-semibold flex items-center truncate",
                                        getEventColorClass(event.color),
                                        event.isStart && 'rounded-l-lg',
                                        event.isEnd && 'rounded-r-lg',
                                    )}
                                    style={{
                                        top: `${(event.lane || 0) * 1.75}rem`, // 1.5rem height + 0.25rem gap
                                        gridColumnStart: event.startDay + 1,
                                        gridColumnEnd: `span ${event.span}`,
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
