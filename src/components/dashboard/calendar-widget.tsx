// src/components/dashboard/calendar-widget.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import type { CalendarEvent } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const getEventColorClass = (color?: string): string => {
  const colorMap: Record<string, string> = {
    blue: 'bg-event-blue',
    green: 'bg-event-green',
    red: 'bg-event-red',
    orange: 'bg-event-orange',
  };
  return colorMap[color as string] || 'bg-primary';
};

export function CalendarWidget({ events }: { events?: CalendarEvent[] }) {
    if (!events || events.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Próximos Eventos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {events.map(event => (
                    <div key={event.id} className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md border text-center">
                            <span className="text-xs font-bold uppercase text-red-500">{format(new Date(event.start), 'MMM', { locale: es })}</span>
                            <span className="text-lg font-bold">{format(new Date(event.start), 'd')}</span>
                        </div>
                        <div>
                            <p className="font-semibold text-sm line-clamp-1">{event.title}</p>
                            <p className="text-xs text-muted-foreground">
                                {event.allDay ? 'Todo el día' : format(new Date(event.start), 'p', { locale: es })}
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
