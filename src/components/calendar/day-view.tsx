// src/components/calendar/day-view.tsx
'use client';
import React, { useMemo } from 'react';
import { format, setHours, setMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';

const getEventColorClass = (color?: string): string => {
  const colorMap: Record<string, string> = {
    blue: 'bg-event-blue text-white',
    green: 'bg-event-green text-white',
    red: 'bg-event-red text-white',
    orange: 'bg-event-orange text-white',
  };
  return colorMap[color as string] || 'bg-primary text-primary-foreground';
};

const hours = Array.from({ length: 24 }, (_, i) => i);

interface DayViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
    onSlotClick: (date: Date) => void;
}

export function DayView({ currentDate, events, onEventClick, onSlotClick }: DayViewProps) {
  const getEventStyle = (event: CalendarEvent) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const top = (start.getHours() + start.getMinutes() / 60) * 60; // 60px per hour
    const height = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 60;

    return {
      top: `${top}px`,
      height: `${Math.max(height, 20)}px`, // min height of 20px
    };
  };
  
  const dayEvents = useMemo(() => {
    return events.filter(e => format(new Date(e.start), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'));
  }, [events, currentDate]);

  return (
    <div className="grid grid-cols-[auto_1fr] h-full">
      {/* Time column */}
      <div className="text-right text-xs text-muted-foreground pr-2 pt-5">
        {hours.map(hour => (
          <div key={hour} className="h-[60px] relative -top-3">
            {hour > 0 ? `${hour}:00` : ''}
          </div>
        ))}
      </div>

      {/* Day column */}
      <div className="relative border-l">
        {/* Background grid lines */}
        {hours.map(hour => (
          <div key={hour} className="h-[60px] border-b" onClick={() => onSlotClick(setMinutes(setHours(currentDate, hour), 0))}/>
        ))}

        {/* Events */}
        {dayEvents.map(event => (
          <div
            key={event.id}
            onClick={() => onEventClick(event)}
            className={cn(
              "absolute right-1 left-1 mx-1 p-2 text-xs font-semibold rounded-lg cursor-pointer overflow-hidden",
              getEventColorClass(event.color)
            )}
            style={getEventStyle(event)}
          >
            <p className="font-bold">{event.title}</p>
            <p className="opacity-80">{format(new Date(event.start), 'p', {locale: es})} - {format(new Date(event.end), 'p', {locale: es})}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
