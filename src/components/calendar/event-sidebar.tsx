// src/components/calendar/event-sidebar.tsx
'use client';

import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { CalendarEvent } from '@/types';
import { PlusCircle, Edit, CalendarPlus, Video, Link as LinkIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card } from '../ui/card';

const getEventColorClass = (color?: string): string => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
  };
  return colorMap[color as string] || 'bg-primary';
};

interface EventListProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEditEvent: (event: CalendarEvent) => void;
}

const EventListItem = ({ event, onEditEvent }: { event: CalendarEvent, onEditEvent: (event: CalendarEvent) => void }) => {
    return (
        <div className="flex items-start gap-4 group cursor-pointer" onClick={() => onEditEvent(event)}>
            <div className="flex flex-col items-center pt-1">
                <p className="font-semibold text-xs whitespace-nowrap text-foreground/90">
                    {event.allDay ? 'Todo el día' : format(new Date(event.start), 'HH:mm')}
                </p>
            </div>
            <div className="relative flex-grow pb-6">
                <div className={cn("absolute left-0 top-2.5 h-full w-px", getEventColorClass(event.color))} />
                <div className={cn("absolute left-[-4.5px] top-2.5 h-2.5 w-2.5 rounded-full bg-background border-2", getEventColorClass(event.color).replace('bg-','border-'))} />
                <div className="pl-4">
                    <p className="font-semibold text-sm leading-tight text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.description || 'Sin descripción'}</p>
                </div>
            </div>
        </div>
    )
}

export function EventList({ selectedDate, events, onEditEvent }: EventListProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => {
        if (a.allDay !== b.allDay) return a.allDay ? -1 : 1; // "Todo el día" primero
        return new Date(a.start).getTime() - new Date(b.start).getTime(); // Luego por hora
    });
  }, [events]);

  const dayOfWeek = format(selectedDate, "EEE", { locale: es }).toUpperCase();
  const dayOfMonth = format(selectedDate, "d", { locale: es });

  return (
    <div className="flex flex-col h-full md:p-4">
      <div className="flex-shrink-0 md:hidden">
         <Separator className="my-3" />
      </div>
      <ScrollArea className="flex-grow -mx-4 px-4 md:m-0 md:p-0">
        <div className="flex gap-4">
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                 <div className="flex flex-col items-center justify-center h-16 w-16 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                      <span className="text-sm font-bold tracking-widest">{dayOfWeek}</span>
                      <span className="text-3xl font-bold">{dayOfMonth}</span>
                 </div>
            </div>
            <div className="flex-grow">
                {sortedEvents.length > 0 ? (
                    sortedEvents.map((event) => (
                        <EventListItem 
                            key={event.id}
                            event={event}
                            onEditEvent={onEditEvent}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-start justify-center h-full text-muted-foreground pt-2">
                        <p className="font-medium text-sm">No hay eventos para este día.</p>
                    </div>
                )}
            </div>
        </div>
      </ScrollArea>
    </div>
  );
}
