// src/components/calendar/event-sidebar.tsx
'use client';

import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { CalendarEvent, Attachment } from '@/types';
import { PlusCircle, Edit, CalendarPlus, Video, Link as LinkIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useIsMobile } from '@/hooks/use-mobile';


interface EventListProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEditEvent: (event: CalendarEvent) => void;
}

export function EventList({ selectedDate, events, onEditEvent }: EventListProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const getEventColorClass = (color?: string): string => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'red': return 'bg-red-500';
      case 'orange': return 'bg-orange-500';
      default: return 'bg-primary';
    }
  };
  
  const sortedEvents = React.useMemo(() => {
    return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events]);

  return (
    <div className="flex flex-col h-full md:p-4">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold font-headline">
            {isMobile ? 'Eventos del Día' : `Eventos del ${format(selectedDate, "d 'de' MMMM", { locale: es })}`}
          </h2>
        </div>
        <Separator className="my-3" />
      </div>

      <ScrollArea className="flex-grow -mx-4 px-4">
        {sortedEvents.length > 0 ? (
          <ul className="space-y-3">
            {sortedEvents.map(event => {
               return (
                  <li key={event.id} className="cursor-pointer group" onClick={() => onEditEvent(event)}>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors relative">
                      <div className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${getEventColorClass(event.color)}`} />
                      <div className="flex-grow space-y-1">
                        <p className="font-semibold text-sm leading-tight">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.allDay ? 'Todo el día' : `${format(new Date(event.start), 'p', { locale: es })} - ${format(new Date(event.end), 'p', { locale: es })}`}
                        </p>
                      </div>
                    </div>
                  </li>
               )
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-10">
            <CalendarPlus className="h-10 w-10 mb-3 text-primary/70" />
            <p className="font-medium">No hay eventos para este día.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
