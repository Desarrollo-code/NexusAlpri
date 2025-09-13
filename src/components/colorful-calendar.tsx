// src/components/colorful-calendar.tsx
'use client';

import React from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, isSameMonth, getDay, isBefore, isAfter, differenceInCalendarDays, max, min } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';
import { useIsMobile } from '@/hooks/use-mobile';


const getEventColorClass = (color?: string, type: 'bg' | 'border' = 'bg'): string => {
  const colorMap: Record<string, string> = {
    blue: type === 'bg' ? 'bg-event-blue' : 'border-event-blue',
    green: type === 'bg' ? 'bg-event-green' : 'border-event-green',
    red: type === 'bg' ? 'bg-event-red' : 'border-event-red',
    orange: type === 'bg' ? 'bg-event-orange' : 'border-event-orange',
  };
  return colorMap[color as string] || (type === 'bg' ? 'bg-primary' : 'border-primary');
};


interface ProcessedEvent {
  event: CalendarEvent;
  startDayOfWeek: number;
  span: number;
  lane: number;
  startsInWeek: boolean;
  endsInWeek: boolean;
}

const processEventsForWeek = (week: Date[], events: CalendarEvent[], maxLanes: number): { singleDay: Map<string, CalendarEvent[]>, multiDay: ProcessedEvent[] } => {
  const weekStart = week[0];
  const weekEnd = week[6];
  const weeklyMultiDayEvents: ProcessedEvent[] = [];
  const singleDayEvents = new Map<string, CalendarEvent[]>();

  const relevantEvents = events.filter(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return !isAfter(eventStart, weekEnd) && !isBefore(eventEnd, weekStart);
  });

  for (const event of relevantEvents) {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    if (differenceInCalendarDays(eventEnd, eventStart) === 0) {
      const dayKey = format(eventStart, 'yyyy-MM-dd');
      if (!singleDayEvents.has(dayKey)) singleDayEvents.set(dayKey, []);
      singleDayEvents.get(dayKey)?.push(event);
      continue;
    }

    const start = max([eventStart, weekStart]);
    const end = min([eventEnd, weekEnd]);
    const startDayOfWeek = getDay(start);
    const span = differenceInCalendarDays(end, start) + 1;

    weeklyMultiDayEvents.push({
      event,
      startDayOfWeek,
      span,
      lane: -1, // Placeholder
      startsInWeek: isSameDay(eventStart, start),
      endsInWeek: isSameDay(eventEnd, end),
    });
  }

  // Lane assignment
  weeklyMultiDayEvents.sort((a,b) => a.startDayOfWeek - b.startDayOfWeek || b.span - a.span);
  const lanes: (number[] | null)[] = Array(maxLanes).fill(null);
  for (const processedEvent of weeklyMultiDayEvents) {
      let assigned = false;
      for (let i = 0; i < lanes.length; i++) {
          let laneIsFree = true;
          if (lanes[i]) {
              for (let dayIndex = processedEvent.startDayOfWeek; dayIndex < processedEvent.startDayOfWeek + processedEvent.span; dayIndex++) {
                  if ((lanes[i] as number[])[dayIndex]) {
                      laneIsFree = false;
                      break;
                  }
              }
          }
          if (laneIsFree) {
              if (!lanes[i]) lanes[i] = Array(7).fill(0);
              for (let dayIndex = processedEvent.startDayOfWeek; dayIndex < processedEvent.startDayOfWeek + processedEvent.span; dayIndex++) {
                  (lanes[i] as number[])[dayIndex] = 1;
              }
              processedEvent.lane = i;
              assigned = true;
              break;
          }
      }
      if (!assigned) processedEvent.lane = -1; // Won't be rendered if no lane
  }

  return { singleDay: singleDayEvents, multiDay: weeklyMultiDayEvents.filter(e => e.lane !== -1) };
};


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

    const moreCount = eventsForDay.length > 2 ? eventsForDay.length - 2 : 0;
    
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
                {eventsForDay.slice(0, 2).map(event => (
                     <div 
                        key={event.id} 
                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }} 
                        className={cn(
                            "text-xs p-1 rounded-md truncate cursor-pointer text-white font-semibold",
                            getEventColorClass(event.color)
                        )}
                    >
                        {event.title}
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
  const isMobile = useIsMobile();
  const maxLanes = isMobile ? 2 : 3;

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

  return (
    <div className={cn("flex flex-col h-full bg-card border-l border-t rounded-lg", className)}>
        <div className="grid grid-cols-7 flex-shrink-0">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground border-b border-r">{day}</div>
            ))}
        </div>
        <div className="flex-grow grid grid-cols-1" style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
            {weeks.map((week, weekIndex) => {
                const { singleDay, multiDay } = processEventsForWeek(week, events, maxLanes);

                return (
                    <div key={weekIndex} className="grid grid-cols-7 relative">
                        {multiDay.map(({ event, startDayOfWeek, span, lane, startsInWeek, endsInWeek }) => (
                           <div
                              key={event.id}
                              onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                              className={cn(
                                'absolute text-xs font-medium text-white px-2 py-0.5 mt-10 cursor-pointer truncate',
                                getEventColorClass(event.color),
                                startsInWeek ? 'rounded-l-md' : '',
                                endsInWeek ? 'rounded-r-md' : '',
                              )}
                              style={{
                                top: `${lane * 24}px`,
                                left: `calc(${startDayOfWeek} / 7 * 100% + 2px)`,
                                width: `calc(${span} / 7 * 100% - 4px)`,
                              }}
                           >
                               {event.title}
                           </div>
                        ))}
                         {week.map((day) => {
                             const dayKey = format(day, 'yyyy-MM-dd');
                             const eventsForDay = singleDay.get(dayKey) || [];
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
                )
            })}
        </div>
    </div>
  );
}
