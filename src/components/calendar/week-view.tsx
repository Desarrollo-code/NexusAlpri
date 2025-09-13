// src/components/calendar/week-view.tsx
'use client';
import React, { useMemo } from 'react';
import { addDays, eachDayOfInterval, endOfWeek, format, isSameDay, startOfWeek, setHours, setMinutes, getDay, isBefore, isAfter, max, min } from 'date-fns';
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

interface WeekViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
    onSlotClick: (date: Date) => void;
}

export function WeekView({ currentDate, events, onEventClick, onSlotClick }: WeekViewProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [currentDate]);
  
  const today = new Date();

  const multiDayEvents = events.filter(e => !isSameDay(new Date(e.start), new Date(e.end)));
  const singleDayEvents = events.filter(e => isSameDay(new Date(e.start), new Date(e.end)));

  const getPositionAndSpan = (event: CalendarEvent) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    const start = max([eventStart, weekStart]);
    const end = min([eventEnd, weekEnd]);
    
    let startDayIndex = getDay(start) -1;
    if (startDayIndex === -1) startDayIndex = 6; // Sunday
    
    let endDayIndex = getDay(end) -1;
    if (endDayIndex === -1) endDayIndex = 6;

    const span = endDayIndex - startDayIndex + 1;
    
    return {
        gridColumn: `${startDayIndex + 2} / span ${span}`
    }
  };

  const getSingleDayEventStyle = (event: CalendarEvent) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const top = (start.getHours() + start.getMinutes() / 60) * 60; // 60px per hour
    const height = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 60;

    return {
      top: `${top}px`,
      height: `${Math.max(height, 20)}px`, // min height
    };
  };

  return (
    <div className="grid grid-cols-[auto_1fr] h-full">
      {/* Time column */}
      <div className="text-right text-xs text-muted-foreground pr-2">
        {hours.map(hour => (
          <div key={hour} className="h-[60px] relative -top-3">
            {hour > 0 ? `${hour}:00` : ''}
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-7 relative">
        {/* Header */}
        {weekDays.map(day => (
          <div key={day.toISOString()} className="text-center p-2 border-b border-l">
            <p className="text-sm text-muted-foreground">{format(day, 'EEE', { locale: es })}</p>
            <p className={cn("text-xl font-semibold", isSameDay(day, today) && "text-primary")}>
              {format(day, 'd')}
            </p>
          </div>
        ))}
        
        {/* All-day events */}
        <div className="col-span-7 border-b p-1 space-y-1 relative">
            {multiDayEvents.map(event => (
                <div 
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={cn(
                        "h-6 px-2 text-xs font-semibold flex items-center truncate cursor-pointer rounded-md",
                        getEventColorClass(event.color)
                    )}
                    style={getPositionAndSpan(event)}
                >
                    {event.title}
                </div>
            ))}
        </div>

        {/* Timed events grid */}
        <div className="col-span-7 grid grid-cols-7 relative">
          {/* Background grid lines */}
          {weekDays.map((day, i) => (
            <div key={i} className="relative border-l">
              {hours.map(hour => (
                <div key={hour} className="h-[60px] border-b" onClick={() => onSlotClick(setMinutes(setHours(day, hour), 0))}/>
              ))}
            </div>
          ))}

          {/* Timed events */}
          {singleDayEvents.map(event => {
            let dayIndex = getDay(new Date(event.start)) - 1;
            if (dayIndex === -1) dayIndex = 6;
            
            return (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className={cn(
                    "absolute mx-1 p-2 text-xs font-semibold rounded-lg cursor-pointer overflow-hidden",
                    getEventColorClass(event.color)
                )}
                style={{
                  gridColumn: `${dayIndex + 1} / span 1`,
                  ...getSingleDayEventStyle(event),
                }}
              >
                <p className="font-bold">{event.title}</p>
                <p className="opacity-80">{format(new Date(event.start), 'p', {locale: es})} - {format(new Date(event.end), 'p', {locale: es})}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
