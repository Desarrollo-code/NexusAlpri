// src/components/colorful-calendar.tsx
'use client';

import React from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, isSameMonth, getDay, isBefore, isAfter, differenceInCalendarDays, max, min } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';
import { useIsMobile } from '@/hooks/use-mobile';


const getEventColorClass = (color?: string): string => {
  const colorMap: Record<string, string> = {
    blue: 'bg-event-blue text-white',
    green: 'bg-event-green text-white',
    red: 'bg-event-red text-white',
    orange: 'bg-event-orange text-white',
  };
  return colorMap[color as string] || 'bg-primary text-primary-foreground';
};


const DayCell = ({ day, month, selectedDay, onDateSelect }: { day: Date, month: Date, selectedDay: Date, onDateSelect: (d: Date) => void }) => {
    const today = new Date();
    const dayKey = format(day, 'yyyy-MM-dd');
    const holiday = isHoliday(day, 'CO');
    
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
    );
}

const WeekRow = ({ week, month, events, selectedDay, onDateSelect, onEventClick }: { week: Date[], month: Date, events: CalendarEvent[], selectedDay: Date, onDateSelect: (d:Date)=>void, onEventClick: (e:CalendarEvent)=>void }) => {
    const eventsInWeek = events.filter(event => 
        isBefore(new Date(event.start), endOfWeek(week[0], {weekStartsOn: 0})) && 
        isAfter(new Date(event.end), startOfWeek(week[0], {weekStartsOn: 0}))
    );
    
    const singleDayEvents = eventsInWeek.filter(e => differenceInCalendarDays(new Date(e.end), new Date(e.start)) === 0);
    const multiDayEvents = eventsInWeek.filter(e => differenceInCalendarDays(new Date(e.end), new Date(e.start)) > 0);

    const eventsByDay = React.useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        singleDayEvents.forEach(event => {
            const dayKey = format(new Date(event.start), 'yyyy-MM-dd');
            if (!map.has(dayKey)) map.set(dayKey, []);
            map.get(dayKey)!.push(event);
        });
        return map;
    }, [singleDayEvents]);

    const multiDayLanes = React.useMemo(() => {
        const lanes: (CalendarEvent | null)[][] = [];
        const sortedMultiDay = multiDayEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        for (const event of sortedMultiDay) {
            let placed = false;
            for (const lane of lanes) {
                if (lane.every(e => !e || new Date(event.start) >= new Date(e.end) || new Date(event.end) <= new Date(e.start))) {
                    lane.push(event);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                lanes.push([event]);
            }
        }
        return lanes;
    }, [multiDayEvents]);

    return (
        <div className="grid grid-cols-7 relative">
            {week.map((day) => {
                 const dayKey = format(day, 'yyyy-MM-dd');
                 const dayEvents = eventsByDay.get(dayKey) || [];
                 const totalEvents = dayEvents.length + multiDayEvents.filter(e => isSameDay(day, new Date(e.start)) || (isBefore(new Date(e.start), day) && isAfter(new Date(e.end), day))).length;

                 return (
                    <div key={day.toString()} className="relative">
                        <DayCell day={day} month={month} selectedDay={selectedDay} onDateSelect={onDateSelect} />
                        <div className="absolute top-10 left-0 right-0 p-1 space-y-1">
                             {dayEvents.slice(0, 2).map(event => (
                                 <div 
                                    key={event.id}
                                    onClick={() => onEventClick(event)}
                                    className={cn(
                                        "text-xs p-1 rounded-md truncate cursor-pointer font-semibold",
                                        getEventColorClass(event.color)
                                    )}
                                >
                                    {event.title}
                                </div>
                            ))}
                             {totalEvents > 2 && <div className="text-xs font-semibold text-primary mt-auto pl-1">+ {totalEvents - 2} más</div>}
                        </div>
                    </div>
                );
            })}
             <div className="absolute top-10 left-0 right-0 h-full pointer-events-none">
                {multiDayLanes.map((lane, laneIndex) => (
                     <div key={laneIndex} className="absolute w-full" style={{ top: `${laneIndex * 28}px`, height: '24px' }}>
                        {lane.map(event => {
                             if (!event) return null;
                            const eventStart = new Date(event.start);
                            const eventEnd = new Date(event.end);
                            const weekStart = week[0];
                            const weekEnd = week[6];

                            const startDay = getDay(max([eventStart, weekStart]));
                            const endDay = getDay(min([eventEnd, weekEnd]));
                            
                            const span = endDay - startDay + 1;

                            return (
                                <div
                                    key={event.id}
                                    onClick={() => onEventClick(event)}
                                    className={cn(
                                        "absolute h-full px-2 text-xs font-semibold flex items-center truncate cursor-pointer pointer-events-auto",
                                        getEventColorClass(event.color)
                                    )}
                                    style={{
                                        left: `calc(${(100 / 7) * startDay}% + 2px)`,
                                        width: `calc(${(100 / 7) * span}% - 4px)`,
                                        borderTopLeftRadius: isSameDay(eventStart, week[startDay]) ? '0.375rem' : '0',
                                        borderBottomLeftRadius: isSameDay(eventStart, week[startDay]) ? '0.375rem' : '0',
                                        borderTopRightRadius: isSameDay(eventEnd, week[endDay]) ? '0.375rem' : '0',
                                        borderBottomRightRadius: isSameDay(eventEnd, week[endDay]) ? '0.375rem' : '0',
                                    }}
                                >
                                    {event.title}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
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
            {weeks.map((week, weekIndex) => (
                <WeekRow 
                   key={weekIndex}
                   week={week}
                   month={month}
                   events={events}
                   selectedDay={selectedDay}
                   onDateSelect={onDateSelect}
                   onEventClick={onEventClick}
                />
            ))}
        </div>
    </div>
  );
}
