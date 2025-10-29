// src/components/dashboard/interactive-events-widget.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hand, Check } from "lucide-react";
import type { CalendarEvent } from "@/types";

interface InteractiveEventsWidgetProps {
  events?: (CalendarEvent & { hasParticipated?: boolean })[];
  onParticipate: (eventId: string, occurrenceDate: Date) => void;
}

export function InteractiveEventsWidget({ events, onParticipate }: InteractiveEventsWidgetProps) {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <Card className="bg-green-100/50 dark:bg-green-900/20 border-green-500/30">
        <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-300">
                <Hand/> ¡Pausa Activa!
            </CardTitle>
            <CardDescription>Confirma tu participación en los eventos del día para ganar XP.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
            {events.map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-card rounded-lg">
                    <p className="font-semibold">{event.title}</p>
                    <Button 
                        size="sm"
                        onClick={() => onParticipate(event.parentId || event.id, new Date(event.start))}
                        disabled={event.hasParticipated}
                        variant={event.hasParticipated ? "secondary" : "default"}
                        className={event.hasParticipated ? "bg-green-600 text-white" : ""}
                    >
                       {event.hasParticipated ? <Check className="mr-2 h-4 w-4"/> : null}
                       {event.hasParticipated ? 'Confirmado' : 'Participar'}
                    </Button>
                </div>
            ))}
        </CardContent>
    </Card>
  )
}
