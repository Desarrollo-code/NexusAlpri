// src/components/colorful-calendar.tsx
'use client';

import React from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, isSameMonth, getDay, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

const MAX_LANES = 2; // Number of event bars to show before "+X more"

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

interface DayCellProps {
  day: Date;
  month: Date;
  selectedDay: Date;
  onDateSelect: (date: Date) => void;
  isMobile: boolean;
  events: CalendarEvent[];
}

const DayCell: React.FC<DayCellProps> = ({ day, month, selectedDay, onDateSelect, isMobile, events }) => {
    const today = new Date();
    const dayKey = format(day, 'yyyy-MM-dd');
    const holiday = isHoliday(day, 'CO');
    
    return (
        <div
            onClick={() => onDateSelect(day)}
            className={cn(
                "relative p-1 flex flex-col bg-card group transition-colors hover:bg-muted/50 cursor-pointer min-h-[80px] sm:min-h-[120px] border-r border-b",
                !isSameMonth(day, month) && "bg-muted/30 text-muted-foreground/50",
                isSameDay(day, selectedDay) && "bg-primary/10"
            )}
        >
            <div className="flex justify-between items-center mb-1 flex-shrink-0">
                <time
                    dateTime={dayKey}
                    className={cn("flex items-center justify-center text-xs sm:text-sm rounded-full",
                        isMobile ? "h-6 w-6" : "h-7 w-7",
                        isSameDay(day, today) && "bg-primary text-primary-foreground font-bold",
                        holiday && "text-red-500 font-semibold"
                    )}
                >
                    {format(day, 'd')}
                </time>
                 {isMobile && events.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
            </div>
            
        </div>
    );
};

const processEventsForWeek = (week: Date[], allEvents: CalendarEvent[]) => {
    const weekStart = week[0];
    const weekEnd = week[6];

    const relevantEvents = allEvents.filter(event => 
        new Date(event.end) >= weekStart && new Date(event.start) <= weekEnd
    ).sort((a,b) => (new Date(b.end).getTime() - new Date(b.start).getTime()) - (new Date(a.end).getTime() - new Date(a.start).getTime()));

    const positionedEvents: any[] = [];
    const lanes: (Date | null)[] = Array(MAX_LANES).fill(null);
    const dayEventCounts: Record<string, number> = {};

    week.forEach(day => dayEventCounts[format(day, 'yyyy-MM-dd')] = 0);

    relevantEvents.forEach(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      dayEventCounts[format(eventStart, 'yyyy-MM-dd')]++;
      
      let startCol = (isBefore(eventStart, weekStart) ? 0 : getDay(eventStart));
      let endCol = (isBefore(weekEnd, eventEnd) ? 6 : getDay(eventEnd));
      let span = endCol - startCol + 1;
      
      let laneIndex = -1;
      for (let i = 0; i < MAX_LANES; i++) {
        if (!lanes[i] || isBefore(lanes[i]!, eventStart)) {
          laneIndex = i;
          break;
        }
      }

      if (laneIndex !== -1) {
        lanes[laneIndex] = eventEnd;
        positionedEvents.push({ ...event, startCol, span, lane: laneIndex });
      }
    });

    return { positionedEvents, dayEventCounts };
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
  
  const weeks = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 }); // Dom-Sab
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    const weeksArray: Date[][] = [];
    while (days.length) {
        weeksArray.push(days.splice(0, 7));
    }
    return weeksArray;
  }, [month]);

  const positionedEventsByWeek = React.useMemo(() => weeks.map(week => processEventsForWeek(week, events)), [weeks, events]);

  return (
    <TooltipProvider delayDuration={100}>
        <div className={cn("flex flex-col h-full bg-card border-l border-t rounded-lg", className)}>
            <div className="grid grid-cols-7 flex-shrink-0">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, i) => (
                <div key={`${day}-${i}`} className="p-2 text-center text-xs font-semibold text-muted-foreground border-b border-r">{day.substring(0, 1)}</div>
                ))}
            </div>
            <div className="flex flex-col flex-grow relative">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 flex-grow">
                        {week.map((day) => {
                             const dayEvents = events.filter(event => isSameDay(new Date(event.start), day));
                             return (
                                <DayCell
                                    key={day.toString()}
                                    day={day}
                                    month={month}
                                    selectedDay={selectedDay}
                                    onDateSelect={onDateSelect}
                                    isMobile={isMobile}
                                    events={dayEvents}
                                />
                             )
                        })}
                         {!isMobile && (
                          <div className="absolute top-0 left-0 h-full w-full grid grid-rows-6 pointer-events-none">
                              <div className="row-start-1 grid grid-cols-7 relative h-full">
                                {positionedEventsByWeek[weekIndex].positionedEvents.map(event => (
                                    <div
                                        key={event.id}
                                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                        className={cn(
                                            "absolute h-6 pointer-events-auto cursor-pointer px-1 text-xs font-semibold flex items-center truncate rounded-md",
                                            getEventColorClass(event.color)
                                        )}
                                        style={{
                                            gridColumnStart: event.startCol + 1,
                                            gridColumnEnd: `span ${event.span}`,
                                            top: `${1.75 * event.lane}rem`, // 1.5rem height + 0.25rem gap
                                            left: 0,
                                            right: 0,
                                        }}
                                    >
                                        {event.title}
                                    </div>
                                ))}
                              </div>
                           </div>
                         )}
                    </div>
                ))}
            </div>
        </div>
    </TooltipProvider>
  );
}
