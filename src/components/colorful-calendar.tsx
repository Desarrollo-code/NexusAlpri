// src/components/colorful-calendar.tsx
'use client';

import React, from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, isWithinInterval, getDay, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

interface DayCellProps {
    day: Date;
    month: Date;
    selectedDay: Date;
    events: CalendarEvent[];
    onDateSelect: (date: Date) => void;
    onEventClick: (event: CalendarEvent) => void;
}

const DayCell: React.FC<DayCellProps> = ({ day, month, selectedDay, events, onDateSelect, onEventClick }) => {
    const today = new Date();
    const dayKey = format(day, 'yyyy-MM-dd');
    const holiday = isHoliday(day, 'CO');
    
    const dayEvents = events.filter(event => isSameDay(new Date(event.start), day));

    return (
        <div
            onClick={() => onDateSelect(day)}
            className={cn(
                "relative p-1.5 flex flex-col bg-card group transition-colors hover:bg-muted/50 cursor-pointer min-h-[120px] sm:min-h-[140px] border-r border-b",
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
            <div className="flex-grow space-y-1 overflow-y-auto thin-scrollbar">
                {dayEvents.map(event => (
                    <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        className={cn(
                            "h-6 pointer-events-auto cursor-pointer px-1 text-xs font-semibold flex items-center truncate rounded-md",
                            getEventColorClass(event.color)
                        )}
                    >
                        {event.title}
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
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 }); // Dom-Sab
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    const weeksArray: Date[][] = [];
    while (days.length) {
        weeksArray.push(days.splice(0, 7));
    }
    return weeksArray;
  }, [month]);

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
                    <div key={weekIndex} className="grid grid-cols-7 flex-grow">
                        {week.map((day) => (
                            <DayCell
                                key={day.toString()}
                                day={day}
                                month={month}
                                selectedDay={selectedDay}
                                events={events}
                                onDateSelect={onDateSelect}
                                onEventClick={onEventClick}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    </TooltipProvider>
  );
}