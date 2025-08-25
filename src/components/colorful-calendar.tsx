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

// Celda de día simplificada: solo renderiza el fondo y el número.
const DayCell = React.memo(({ day, isCurrentMonth, isToday, onDateSelect, selectedDay }: {
    day: Date,
    isCurrentMonth: boolean,
    isToday: boolean,
    onDateSelect: (d: Date) => void,
    selectedDay: Date,
}) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const holiday = isHoliday(day, 'CO');
    
    return (
        <div
            onClick={() => onDateSelect(day)}
            className={cn(
                "relative p-1.5 flex flex-col bg-card group transition-colors hover:bg-muted/50 cursor-pointer h-full border-b border-r",
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
            <div className="flex-grow min-h-[60px]" />
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
  
  // Lógica mejorada para distribuir los eventos en carriles.
  const weeklyEventsLayout = useMemo(() => {
    return weeks.map(week => {
      const weekStart = week[0];
      const weekEnd = week[6];

      // Filtra y ordena los eventos para la semana actual.
      const weekEvents = events
        .filter(event => {
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          return eventStart <= weekEnd && eventEnd >= weekStart;
        })
        .sort((a, b) => {
          const aStart = new Date(a.start);
          const bStart = new Date(b.start);
          const aDuration = differenceInDays(new Date(a.end), aStart);
          const bDuration = differenceInDays(new Date(b.end), bStart);
          if (bDuration !== aDuration) {
            return bDuration - aDuration; // Eventos más largos primero.
          }
          return aStart.getTime() - bStart.getTime();
        });

      const layout: { event: CalendarEvent; startCol: number; span: number; lane: number }[] = [];
      const lanes: boolean[][] = []; // Un array de carriles (arrays de días de la semana [0-6])

      for (const event of weekEvents) {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        const startDayIndex = eventStart < weekStart ? 0 : getDay(eventStart);
        const endDayIndex = eventEnd > weekEnd ? 6 : getDay(eventEnd);
        
        let laneIndex = 0;
        // Encuentra el primer carril disponible.
        while (true) {
            if (!lanes[laneIndex]) {
                lanes[laneIndex] = new Array(7).fill(false);
            }
            
            let isLaneFree = true;
            for (let i = startDayIndex; i <= endDayIndex; i++) {
                if (lanes[laneIndex][i]) {
                    isLaneFree = false;
                    break;
                }
            }
            
            if (isLaneFree) {
                 for (let i = startDayIndex; i <= endDayIndex; i++) {
                    lanes[laneIndex][i] = true;
                }
                break;
            }
            laneIndex++;
        }
        
        layout.push({ 
            event, 
            startCol: startDayIndex + 1,
            span: endDayIndex - startDayIndex + 1, 
            lane: laneIndex 
        });
      }
      return layout;
    });
  }, [weeks, events]);

  return (
    <TooltipProvider delayDuration={100}>
        <div className="flex flex-col h-full bg-card border-l border-t rounded-lg">
            <div className="grid grid-cols-7 flex-shrink-0">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, i) => (
                <div key={`${day}-${i}`} className="p-2 text-center text-xs font-semibold text-muted-foreground border-b border-r">{day}</div>
                ))}
            </div>
            <div className="grid grid-rows-6 flex-grow relative">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 relative h-full">
                        {/* Capa de celdas de día (fondo) */}
                        {week.map((day) => {
                            const isCurrentMonth = day.getMonth() === month.getMonth();
                            const isToday = isSameDay(day, today);
                            return <DayCell key={day.toString()} day={day} isCurrentMonth={isCurrentMonth} isToday={isToday} onDateSelect={onDateSelect} selectedDay={selectedDay} />;
                        })}
                        {/* Capa de eventos superpuesta */}
                        <div className="absolute inset-0 grid grid-cols-7 grid-rows-1 pointer-events-none p-1">
                            {weeklyEventsLayout[weekIndex].map(({ event, startCol, span, lane }) => (
                                <div
                                    key={event.id}
                                    className="p-px pointer-events-auto"
                                    style={{
                                        gridColumn: `${startCol} / span ${span}`,
                                        // Empuja el evento hacia abajo según su carril.
                                        marginTop: `${2.8 + lane * 1.5}rem`,
                                        zIndex: 10 + lane,
                                    }}
                                >
                                    <div
                                        onClick={() => onEventClick(event)}
                                        className={cn(
                                            "w-full h-5 text-xs px-1.5 rounded truncate text-white flex items-center cursor-pointer hover:opacity-80 transition-opacity",
                                            getEventColorClass(event.color)
                                        )}
                                    >
                                        {event.title}
                                    </div>
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
