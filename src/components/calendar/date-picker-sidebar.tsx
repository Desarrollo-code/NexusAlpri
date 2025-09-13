// src/components/calendar/date-picker-sidebar.tsx
'use client';
import React, { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { isSameDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CalendarEvent } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Button } from '../ui/button';

const getEventColorClass = (color?: string): string => {
  const colorMap: Record<string, string> = {
    blue: 'bg-event-blue',
    green: 'bg-event-green',
    red: 'bg-event-red',
    orange: 'bg-event-orange',
  };
  return colorMap[color as string] || 'bg-primary';
};


interface DatePickerSidebarProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
}

const DateDisplay = ({ date, onDateSelect, events }: { date: Date, onDateSelect: (d: Date) => void, events: CalendarEvent[] }) => {
    const dayOfWeek = format(date, "EEE", { locale: es }).toUpperCase();
    const dayOfMonth = format(date, "d", { locale: es });
    const [isOpen, setIsOpen] = React.useState(false);

    const handleDateSelect = (day: Date | undefined) => {
        if (day) {
            onDateSelect(day);
            setIsOpen(false);
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="flex flex-col items-center justify-center h-28 w-28 rounded-2xl bg-primary text-primary-foreground shadow-lg cursor-pointer transform hover:scale-105 transition-transform mx-auto">
                    <span className="text-sm font-bold tracking-widest text-primary-foreground/70">{dayOfWeek}</span>
                    <span className="text-5xl font-bold leading-tight">{dayOfMonth}</span>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                 <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    locale={es}
                    showOutsideDays
                    initialFocus
                    events={events} // Pasar los eventos al calendario del popover
                 />
            </PopoverContent>
        </Popover>
    )
}

export function DatePickerSidebar({ selectedDate, onDateSelect, events, onEventClick }: DatePickerSidebarProps) {

    const eventsForSelectedDate = useMemo(() => {
        return events
            .filter(e => isSameDay(new Date(e.start), selectedDate))
            .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }, [events, selectedDate]);
    
    return (
        <Card className="h-full flex flex-col">
            <div className="p-4 border-b">
                 <DateDisplay date={selectedDate} onDateSelect={onDateSelect} events={events} />
            </div>
            <CardContent className="p-4 flex-grow flex flex-col min-h-0">
                <h3 className="font-semibold text-sm mb-3" id="calendar-event-list">
                    Eventos para el {format(selectedDate, "d 'de' MMMM", { locale: es })}
                </h3>
                <ScrollArea className="flex-grow">
                    {eventsForSelectedDate.length > 0 ? (
                        <div className="space-y-3 pr-4">
                            {eventsForSelectedDate.map(event => (
                                <div 
                                    key={event.id}
                                    onClick={() => onEventClick(event)}
                                    className="flex items-start gap-3 cursor-pointer group"
                                >
                                    <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", getEventColorClass(event.color))} />
                                    <div className="flex-grow">
                                        <p className="text-sm font-medium leading-tight group-hover:text-primary">{event.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                             {event.allDay ? 'Todo el día' : `${format(new Date(event.start), 'p', {locale: es})} - ${format(new Date(event.end), 'p', {locale: es})}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center pt-8">No hay eventos para este día.</p>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}