// src/components/dashboard/calendar-widget.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Bell } from "lucide-react";
import type { CalendarEvent } from "@/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Link from 'next/link';
import { cn } from "@/lib/utils";

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
                <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Próximos Eventos
                    </div>
                    <Link href="/calendar" className="text-sm font-medium text-primary hover:underline">Ver todos</Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {events.map(event => {
                    const eventDate = parseISO(event.start);
                    return (
                        <div key={event.id} className={cn(
                            "p-3 rounded-lg flex items-center gap-4 text-white shadow-md",
                            getEventColorClass(event.color)
                        )}>
                            <div className="flex flex-col items-center justify-center border-r border-white/30 pr-4">
                               <span className="font-bold text-2xl">{format(eventDate, 'd')}</span>
                               <span className="text-xs font-semibold opacity-80">{format(eventDate, 'EEE', { locale: es }).toUpperCase()}</span>
                            </div>
                            <div className="flex-grow">
                                <p className="font-bold text-base truncate">{event.title}</p>
                                <p className="text-sm opacity-90">{event.allDay ? 'Todo el día' : format(eventDate, 'p', { locale: es })}</p>
                            </div>
                            {event.recurrence !== 'NONE' && (
                                <div className="flex flex-col items-center text-xs opacity-80">
                                    <Bell className="h-4 w-4" />
                                    <span>Recurrente</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
