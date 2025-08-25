// src/components/colorful-calendar.tsx
'use client';

import React from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, isSameMonth, getDay, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';
import { useIsMobile } from '@/hooks/use-mobile';

const MAX_LANES_DESKTOP = 2;
const MAX_LANES_MOBILE = 2; 

const getEventColorClass = (color?: string): string => {
  const colorMap: Record<string, string> = {
    blue: 'bg-event-blue border-blue-600 text-white',
    green: 'bg-event-green border-green-600 text-white',
    red: 'bg-event-red border-red-600 text-white',
    orange: 'bg-event-orange border-orange-600 text-white',
  };
  return colorMap[color as string] || 'bg-primary border-primary/80 text-primary-foreground';
};

const processEventsForWeek = (week: Date[], allEvents: CalendarEvent[]) => {
    const weekStart = week[0];
    const weekEnd = week[6];

    const relevantEvents = allEvents
        .filter(event => new Date(event.end) >= weekStart && new Date(event.start) <= weekEnd)
        .sort((a, b) => {
            const durationA = new Date(a.end).getTime() - new Date(a.start).getTime();
            const durationB = new Date(b.end).getTime() - new Date(b.start).getTime();
            if (durationA !== durationB) return durationB - durationA;
            return new Date(a.start).getTime() - new Date(b.start).getTime();
        });

    const positionedEvents: any[] = [];
    const lanes: (Date | null)[] = Array(10).fill(null);
    const dailyEventCounts: Record<string, number> = {};
    week.forEach(day => dailyEventCounts[format(day, 'yyyy-MM-dd')] = 0);

    relevantEvents.forEach(event => {
        const eventStart = new Date(event.start);
        
        let currentDay = new Date(eventStart < weekStart ? weekStart : eventStart);
        while (currentDay <= weekEnd && currentDay <= new Date(event.end)) {
            const dayKey = format(currentDay, 'yyyy-MM-dd');
            if (dailyEventCounts[dayKey] !== undefined) {
              dailyEventCounts[dayKey]++;
            }
            currentDay.setDate(currentDay.getDate() + 1);
        }

        let startCol = isBefore(eventStart, weekStart) ? 0 : getDay(eventStart);
        let endCol = isBefore(weekEnd, new Date(event.end)) ? 6 : getDay(new Date(event.end));
        let span = endCol - startCol + 1;

        let laneIndex = -1;
        for (let i = 0; i < lanes.length; i++) {
            let laneIsFree = true;
            for (let d = startCol; d <= endCol; d++) {
                if (lanes[i] && !isBefore(lanes[i]!, week[d])) {
                    laneIsFree = false;
                    break;
                }
            }
            if (laneIsFree) {
                laneIndex = i;
                break;
            }
        }
        
        if (laneIndex !== -1) {
            lanes[laneIndex] = new Date(event.end);
            positionedEvents.push({
                ...event,
                startCol: startCol + 1,
                span,
                lane: laneIndex,
                startsInWeek: !isBefore(eventStart, weekStart),
                endsInWeek: !isBefore(weekEnd, new Date(event.end)),
            });
        }
    });

    return { positionedEvents, dailyEventCounts };
};


interface DayCellProps {
  day: Date;
  month: Date;
  selectedDay: Date;
  onDateSelect: (date: Date) => void;
  moreCount: number;
}

const DayCell: React.FC<DayCellProps> = ({ day, month, selectedDay, onDateSelect, moreCount }) => {
    const today = new Date();
    const dayKey = format(day, 'yyyy-MM-dd');
    const holiday = isHoliday(day, 'CO');
    
    return (
        <div
            onClick={() => onDateSelect(day)}
            className={cn(
                "relative p-1.5 flex flex-col bg-card group transition-colors hover:bg-muted/50 cursor-pointer min-h-[120px] border-r border-b",
                !isSameMonth(day, month) && "bg-muted/30 text-muted-foreground/50",
                isSameDay(day, selectedDay) && "bg-primary/10"
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
  const MAX_LANES = isMobile ? MAX_LANES_MOBILE : MAX_LANES_DESKTOP;
  
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

  const positionedEventsByWeek = React.useMemo(() => weeks.map(week => processEventsForWeek(week, events)), [weeks, events]);

  return (
    <div className={cn("flex flex-col h-full bg-card border-l border-t rounded-lg", className)}>
        <div className="grid grid-cols-7 flex-shrink-0">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground border-b border-r">{day}</div>
            ))}
        </div>
        <div className="flex-grow grid grid-cols-1" style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
            {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 relative">
                     {week.map((day) => {
                         const dayKey = format(day, 'yyyy-MM-dd');
                         const { dailyEventCounts } = positionedEventsByWeek[weekIndex];
                         const totalEventsToday = dailyEventCounts[dayKey] || 0;
                         const moreCount = totalEventsToday > MAX_LANES ? totalEventsToday - MAX_LANES : 0;
                         
                         return (
                             <DayCell
                                 key={day.toString()}
                                 day={day}
                                 month={month}
                                 selectedDay={selectedDay}
                                 onDateSelect={onDateSelect}
                                 moreCount={moreCount}
                             />
                         )
                     })}
                     <div className="absolute inset-0 grid grid-cols-7 pointer-events-none p-1 pt-10 gap-y-1">
                         {positionedEventsByWeek[weekIndex].positionedEvents
                            .filter(event => event.lane < MAX_LANES)
                            .map(event => (
                                 <div
                                    key={event.id}
                                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                    className={cn(
                                        "pointer-events-auto cursor-pointer px-2 py-0.5 text-xs font-semibold flex items-center truncate transition-colors h-6",
                                        getEventColorClass(event.color),
                                        event.startsInWeek && "rounded-l-md",
                                        event.endsInWeek && "rounded-r-md"
                                    )}
                                    style={{
                                        gridColumnStart: event.startCol,
                                        gridColumnEnd: `span ${event.span}`,
                                        gridRowStart: 1, 
                                        marginTop: `${event.lane * 1.75}rem`
                                    }}
                                >
                                    {event.title}
                                </div>
                             ))}
                     </div>
                </div>
            ))}
        </div>
    </div>
  );
}
