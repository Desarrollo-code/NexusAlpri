// src/components/colorful-calendar.tsx
'use client';

import React, { useMemo } from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { isHoliday } from '@/lib/holidays';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const getEventColorClass = (color?: string): string => {
  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
  };
  const colorKey = color as keyof typeof colorMap;
  return colorMap[colorKey] || 'bg-primary';
};

interface ColorfulCalendarProps {
    month: Date;
    events: CalendarEvent[];
    selectedDay: Date;
    onDateSelect: (date: Date) => void;
    onEventClick: (event: CalendarEvent) => void;
    className?: string;
}

// Celda de día que ahora maneja sus propios eventos y scroll.
const DayCell = React.memo(({ day, isCurrentMonth, isToday, onDateSelect, selectedDay, eventsForDay, onEventClick }: {
    day: Date,
    isCurrentMonth: boolean,
    isToday: boolean,
    onDateSelect: (d: Date) => void,
    selectedDay: Date,
    eventsForDay: CalendarEvent[],
    onEventClick: (e: CalendarEvent) => void,
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
            {/* Contenedor de eventos con scroll */}
            <div className="flex-grow overflow-y-auto space-y-1 thin-scrollbar">
                {eventsForDay.map(event => (
                    <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        className={cn("w-full text-xs px-1.5 py-0.5 rounded truncate text-white cursor-pointer hover:opacity-80 transition-opacity", getEventColorClass(event.color))}
                    >
                        {event.title}
                    </div>
                ))}
            </div>
        </div>
    );
});
DayCell.displayName = "DayCell";


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
                    <div key={weekIndex} className="grid grid-cols-7 h-full">
                        {week.map((day) => {
                            const isCurrentMonth = day.getMonth() === month.getMonth();
                            const isToday = isSameDay(day, today);
                            const eventsForDay = events.filter(e => isSameDay(new Date(e.start), day));
                            
                            return (
                                <DayCell 
                                    key={day.toString()} 
                                    day={day} 
                                    isCurrentMonth={isCurrentMonth} 
                                    isToday={isToday} 
                                    onDateSelect={onDateSelect} 
                                    selectedDay={selectedDay}
                                    eventsForDay={eventsForDay}
                                    onEventClick={onEventClick}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    </TooltipProvider>
  );
}
