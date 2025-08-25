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

interface EventListProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEditEvent: (event: CalendarEvent) => void;
}

const EventListItem = ({ event, isFirst, isLast, onEditEvent }: { event: CalendarEvent, isFirst: boolean, isLast: boolean, onEditEvent: (event: CalendarEvent) => void }) => {
    return (
        <div className="flex items-start gap-4 group cursor-pointer" onClick={() => onEditEvent(event)}>
            <div className="flex flex-col items-center">
                <p className="font-semibold text-sm whitespace-nowrap text-foreground/90">
                    {event.allDay ? 'Todo el día' : format(new Date(event.start), 'HH:mm')}
                </p>
            </div>
            <div className="relative flex-grow pb-6">
                <div className="absolute left-0 top-1.5 h-full w-px bg-border group-hover:bg-primary transition-colors" />
                <div className="absolute left-[-4.5px] top-1.5 h-2.5 w-2.5 rounded-full bg-background border-2 border-border group-hover:border-primary transition-colors" />
                <div className="pl-6">
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
    return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events]);

  const dayOfWeek = format(selectedDate, "EEE", { locale: es }).toUpperCase();
  const dayOfMonth = format(selectedDate, "d", { locale: es });

  return (
    <div className="flex flex-col h-full md:p-4">
      <div className="flex-shrink-0 md:hidden">
         <Separator className="my-3" />
      </div>
      <ScrollArea className="flex-grow -mx-4 px-4 md:m-0 md:p-0">
        {sortedEvents.length > 0 ? (
          <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                   <div className="flex flex-col items-center justify-center h-16 w-16 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                        <span className="text-sm font-bold tracking-widest">{dayOfWeek}</span>
                        <span className="text-3xl font-bold">{dayOfMonth}</span>
                   </div>
              </div>
              <div className="flex-grow">
                  {sortedEvents.map((event, index) => (
                    <EventListItem 
                        key={event.id}
                        event={event}
                        isFirst={index === 0}
                        isLast={index === sortedEvents.length - 1}
                        onEditEvent={onEditEvent}
                    />
                  ))}
              </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-10">
            <CalendarPlus className="h-10 w-10 mb-3 text-primary/70" />
            <p className="font-medium">No hay eventos para este día.</p>
            <p className="text-xs">Selecciona otro día o crea un nuevo evento.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
