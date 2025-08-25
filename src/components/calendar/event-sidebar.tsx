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

interface EventSidebarProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onCreateEvent: (date: Date) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (event: CalendarEvent) => void;
  canCreate: boolean;
}

export function EventSidebar({ selectedDate, events, onCreateEvent, onEditEvent, onDeleteEvent, canCreate }: EventSidebarProps) {
  const { user } = useAuth();
  
  const getEventColorClass = (color?: string): string => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'red': return 'bg-red-500';
      case 'orange': return 'bg-orange-500';
      default: return 'bg-primary';
    }
  };

  const AttachmentLink = ({ attachment }: { attachment: Attachment }) => (
    <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
      <LinkIcon className="h-4 w-4 shrink-0"/>
      <span className="truncate">{attachment.name}</span>
    </a>
  );

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold font-headline">
            Eventos del <span className="text-primary">{format(selectedDate, "d 'de' MMMM", { locale: es })}</span>
          </h2>
          {canCreate && (
            <Button size="sm" onClick={() => onCreateEvent(selectedDate)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear
            </Button>
          )}
        </div>
        <Separator className="my-3" />
      </div>

      <ScrollArea className="flex-grow -mx-4 px-4">
        {events.length > 0 ? (
          <ul className="space-y-4">
            {events.map(event => {
               const canModifyEvent = user?.role === 'ADMINISTRATOR' || (user?.role === 'INSTRUCTOR' && user.id === event.creatorId);
               return (
                  <li key={event.id} className="cursor-pointer group" onClick={() => onEditEvent(event)}>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors relative">
                      <div className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${getEventColorClass(event.color)}`} />
                      <div className="flex-grow space-y-2">
                        <p className="font-semibold text-sm leading-tight">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.allDay ? 'Todo el día' : `${format(new Date(event.start), 'p', { locale: es })} - ${format(new Date(event.end), 'p', { locale: es })}`}
                        </p>
                        {event.videoConferenceLink && (
                           <a href={event.videoConferenceLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 text-sm text-primary hover:underline">
                              <Video className="h-4 w-4"/> Unirse a la Videoconferencia
                           </a>
                        )}
                        {event.attachments && event.attachments.length > 0 && (
                            <div className="space-y-1 pt-2">
                                {event.attachments.map((att, idx) => <AttachmentLink key={idx} attachment={att} />)}
                            </div>
                        )}
                      </div>
                      {canModifyEvent && (
                           <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEditEvent(event); }}>
                                    <Edit className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDeleteEvent(event); }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                           </div>
                      )}
                    </div>
                  </li>
               )
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-10">
            <CalendarPlus className="h-10 w-10 mb-3 text-primary/70" />
            <p className="font-medium">No hay eventos para este día.</p>
            <p className="text-sm">Puedes crear uno nuevo.</p>
             {canCreate && (
                <Button size="sm" variant="outline" className="mt-4" onClick={() => onCreateEvent(selectedDate)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Crear Evento
                </Button>
             )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
