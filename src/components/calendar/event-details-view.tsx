// src/components/calendar/event-details-view.tsx
'use client';

import type { CalendarEvent, EventAudienceType, Attachment } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Video, MapPin, User, Users, Link as LinkIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

function getInitials(name?: string | null) {
  if (!name) return '??';
  const names = name.split(' ');
  if (names.length > 1 && names[0] && names[names.length - 1]) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  if (names.length === 1 && names[0]) return names[0].substring(0, 2).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getAudienceLabel = (audienceType: EventAudienceType) => {
    const labels = { ALL: "Todos", ADMINISTRATOR: "Administradores", INSTRUCTOR: "Instructores", STUDENT: "Estudiantes", SPECIFIC: "Asistentes Específicos" };
    return labels[audienceType] || "Desconocido";
}

const AttachmentLink = ({ attachment }: { attachment: Attachment }) => (
    <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-md transition-colors hover:bg-primary/10">
      <LinkIcon className="h-4 w-4 shrink-0 text-primary"/>
      <span className="truncate text-sm text-foreground">{attachment.name}</span>
    </a>
);

export function EventDetailsView({ event }: { event: CalendarEvent }) {
  const formattedDate = event.allDay 
    ? format(new Date(event.start), "PPP", { locale: es }) + " (Todo el día)"
    : `${format(new Date(event.start), "PPP, p", { locale: es })} - ${format(new Date(event.end), "p", { locale: es })}`;
  
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div><p className="font-semibold text-foreground">Fecha y Hora</p><p>{formattedDate}</p></div>
            </div>
             <div className="flex items-start gap-3">
                {event.videoConferenceLink ? <Video className="h-5 w-5 text-primary mt-1 shrink-0" /> : <MapPin className="h-5 w-5 text-primary mt-1 shrink-0" />}
                <div>
                    <p className="font-semibold text-foreground">{event.videoConferenceLink ? "Ubicación Virtual" : "Ubicación Física"}</p>
                    {event.videoConferenceLink ? 
                        <a href={event.videoConferenceLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{event.videoConferenceLink}</a> :
                        <p>{event.location || "No especificada"}</p>
                    }
                </div>
            </div>
             <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div><p className="font-semibold text-foreground">Creador</p><p>{event.creator?.name || 'Sistema'}</p></div>
            </div>
            <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary mt-1 shrink-0" />
                <div><p className="font-semibold text-foreground">Dirigido a</p><p>{getAudienceLabel(event.audienceType)}</p></div>
            </div>
        </div>

        {event.description && (
          <>
            <Separator />
            <div className="space-y-2"><p className="font-semibold text-foreground">Descripción</p><p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p></div>
          </>
        )}
        
        {event.audienceType === 'SPECIFIC' && event.attendees.length > 0 && (
             <>
               <Separator />
               <div className="space-y-3">
                  <p className="font-semibold text-foreground">Asistentes ({event.attendees.length})</p>
                  <div className="flex flex-wrap gap-4">
                      {event.attendees.map(attendee => (
                          <div key={attendee.id} className="flex items-center gap-2">
                               <Avatar className="h-8 w-8"><AvatarImage src={undefined} /><AvatarFallback className="text-xs">{getInitials(attendee.name)}</AvatarFallback></Avatar>
                               <span className="text-sm">{attendee.name}</span>
                          </div>
                      ))}
                  </div>
               </div>
             </>
        )}
        
        {event.attachments && event.attachments.length > 0 && (
             <>
                <Separator />
                <div className="space-y-3">
                  <p className="font-semibold text-foreground">Archivos Adjuntos</p>
                  <div className="space-y-1 rounded-md border">
                      {event.attachments.map((att, i) => (
                        <div key={i}>
                          <AttachmentLink attachment={att} />
                          {i < event.attachments.length - 1 && <Separator />}
                        </div>
                      ))}
                  </div>
                </div>
             </>
        )}
    </div>
  );
}