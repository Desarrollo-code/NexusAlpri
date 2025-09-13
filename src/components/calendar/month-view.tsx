// src/components/calendar/month-view.tsx
'use client';
import React, { useMemo } from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, isSameMonth, getDay, isBefore, isAfter, differenceInCalendarDays, max, min } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';

const getEventColorClass = (color?: string): string => {
  const colorMap: Record<string, string> = {
    blue: 'bg-event-blue',
    green: 'bg-event-green',
    red: 'bg-event-red',
    orange: 'bg-event-orange',
  };
  return colorMap[color as string] || 'bg-primary';
};

const DayCell = ({ day, month, onDateSelect }: { 
    day: Date, 
    month: Date, 
    onDateSelect: (d: Date) => void,
}) => {
    const today = new Date();
    const holiday = isHoliday(day, 'CO');
    
    return (
        <div
            onClick={() => onDateSelect(day)}
            className={cn(
                "relative p-1 flex flex-col bg-card group transition-colors hover:bg-muted/50 cursor-pointer border-r border-b",
                !isSameMonth(day, month) && "bg-muted/30 text-muted-foreground/50",
                "min-h-[120px]"
            )}
        >
            <time
                dateTime={format(day, 'yyyy-MM-dd')}
                className={cn("flex items-center justify-center text-xs sm:text-sm rounded-full h-7 w-7",
                    isSameDay(day, today) && "bg-primary text-primary-foreground font-bold",
                    holiday && "text-red-500 font-semibold"
                )}
            >
                {format(day, 'd')}
            </time>
        </div>
    );
}

interface WeekRowProps {
  week: Date[];
  events: CalendarEvent[];
  onEventClick: (e: CalendarEvent) => void;
  onSlotClick: (d: Date) => void;
}

const WeekRow = ({ week, events, onEventClick, onSlotClick }: WeekRowProps) => {
    const weekStart = week[0];
    const weekEnd = week[6];

    const { multiDayEventsWithLanes, singleDayEventsByDay } = useMemo(() => {
        const singleDayEvents: CalendarEvent[] = [];
        const multiDayEvents: CalendarEvent[] = [];

        events.forEach(event => {
            const start = new Date(event.start);
            const end = new Date(event.end);
            if (isBefore(start, weekEnd) && isAfter(end, weekStart)) {
                if (isSameDay(start, end)) {
                    singleDayEvents.push(event);
                } else {
                    multiDayEvents.push(event);
                }
            }
        });
        
        multiDayEvents.sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        const lanes: CalendarEvent[][] = [];
        multiDayEvents.forEach(event => {
            let placed = false;
            for (let i = 0; i < lanes.length; i++) {
                const lane = lanes[i];
                if (lane.every(e => new Date(event.start) >= new Date(e.end) || new Date(event.end) <= new Date(e.start))) {
                    lane.push(event);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                lanes.push([event]);
            }
        });

        const singleDayEventsByDay = new Map<string, CalendarEvent[]>();
        singleDayEvents.forEach(event => {
            const dayKey = format(new Date(event.start), 'yyyy-MM-dd');
            if(!singleDayEventsByDay.has(dayKey)) singleDayEventsByDay.set(dayKey, []);
            singleDayEventsByDay.get(dayKey)!.push(event);
        });

        return { multiDayEventsWithLanes: lanes, singleDayEventsByDay };
    }, [weekStart, weekEnd, events]);

    return (
        <div className="grid grid-cols-7 relative">
            {week.map((day) => (
                <DayCell 
                    key={day.toISOString()}
                    day={day}
                    month={weekStart}
                    onDateSelect={onSlotClick}
                />
            ))}
            <div className="absolute top-8 left-0 right-0 h-full pointer-events-none">
                {multiDayEventsWithLanes.map((lane, laneIndex) => (
                    <div key={laneIndex} className="absolute w-full" style={{ top: `${laneIndex * 24}px`, height: '22px' }}>
                        {lane.map(event => {
                            const eventStart = new Date(event.start);
                            const eventEnd = new Date(event.end);

                            const startDayIndex = getDay(max([eventStart, weekStart]));
                            const endDayIndex = getDay(min([eventEnd, weekEnd]));

                            const span = endDayIndex - startDayIndex + 1;
                            if (span <= 0) return null;
                            
                            const isStartOfEvent = isSameDay(eventStart, week[startDayIndex]);
                            const isEndOfEvent = isSameDay(eventEnd, week[endDayIndex]);

                            return (
                                <div
                                    key={event.id}
                                    onClick={() => onEventClick(event)}
                                    className={cn(
                                        "absolute h-full px-2 text-xs font-semibold text-primary-foreground flex items-center truncate cursor-pointer pointer-events-auto",
                                        getEventColorClass(event.color),
                                        isStartOfEvent ? 'rounded-l-md' : '',
                                        isEndOfEvent ? 'rounded-r-md' : ''
                                    )}
                                    style={{
                                        left: `calc(${(100 / 7) * startDayIndex}% + 1px)`,
                                        width: `calc(${(100 / 7) * span}% - 2px)`,
                                    }}
                                >
                                    {event.title}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
             <div className="absolute top-8 left-0 right-0 grid grid-cols-7 h-full pointer-events-none">
                 {week.map((day, dayIndex) => {
                     const dayKey = format(day, 'yyyy-MM-dd');
                     const dayEvents = singleDayEventsByDay.get(dayKey) || [];
                     const multiDayLanesCount = multiDayEventsWithLanes.length;
                     const availableLanes = 3 - multiDayLanesCount;

                     return (
                         <div key={dayKey} className="relative px-1 pt-px" style={{ paddingTop: `${multiDayLanesCount * 24}px`}}>
                            <div className="space-y-1 pointer-events-auto">
                                {dayEvents.slice(0, availableLanes).map(event => (
                                     <div 
                                        key={event.id}
                                        onClick={() => onEventClick(event)}
                                        className={cn(
                                            "text-xs p-1 rounded-md truncate cursor-pointer font-semibold text-primary-foreground",
                                            getEventColorClass(event.color)
                                        )}
                                    >
                                        {event.title}
                                    </div>
                                ))}
                                {dayEvents.length > availableLanes && (
                                    <div className="text-xs font-bold text-primary pl-1">+ {dayEvents.length - availableLanes} más</div>
                                )}
                            </div>
                         </div>
                     )
                 })}
             </div>
        </div>
    )
}

interface MonthViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
    onSlotClick: (date: Date) => void;
}

export function MonthView({ currentDate, events, onEventClick, onSlotClick }: MonthViewProps) {
  const weeks = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }); // Sunday start for week array
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    const weeksArray: Date[][] = [];
    while (days.length) {
        weeksArray.push(days.splice(0, 7));
    }
    return weeksArray;
  }, [currentDate]);

  return (
    <div className="flex flex-col h-full">
        <div className="grid grid-cols-7 flex-shrink-0">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground border-b border-r">{day}</div>
            ))}
        </div>
        <div className="flex-grow grid grid-cols-1" style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
             {weeks.map((week, weekIndex) => (
                 <WeekRow
                    key={weekIndex}
                    week={week}
                    events={events}
                    onEventClick={onEventClick}
                    onSlotClick={onSlotClick}
                 />
            ))}
        </div>
    </div>
  );
}
