// src/components/dashboard/interactive-events-widget.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hand, Check } from "lucide-react";
import type { CalendarEvent } from "@/types";
import Image from 'next/image';
import { cn } from "@/lib/utils";

interface InteractiveEventsWidgetProps {
    events?: (CalendarEvent & { hasParticipated?: boolean })[];
    onParticipate: (eventId: string, occurrenceDate: Date) => void;
    compact?: boolean;
}

export function InteractiveEventsWidget({ events, onParticipate, compact }: InteractiveEventsWidgetProps) {
    if (!events || events.length === 0) {
        return null;
    }

    return (
        <Card className={cn("bg-emerald-100/50 dark:bg-emerald-900/20 border-emerald-500/30 flex flex-col overflow-hidden", compact ? "" : "h-full")}>
            <CardHeader className={cn(compact ? "p-3" : "p-6")}>
                <CardTitle className={cn("flex items-center gap-2 text-emerald-700 dark:text-emerald-300", compact ? "text-sm" : "text-lg")}>
                    <Hand className={cn(compact ? "h-4 w-4" : "h-5 w-5")} /> ¡Pausa Activa!
                </CardTitle>
                {!compact && <CardDescription>Confirma tu participación en los eventos del día para ganar XP.</CardDescription>}
            </CardHeader>
            <CardContent className={cn("flex-grow flex flex-col justify-center", compact ? "p-3 pt-0 space-y-2" : "p-6 space-y-3")}>
                {events.map(event => (
                    <div key={event.id} className={cn("flex flex-col items-center justify-between bg-white dark:bg-slate-950 rounded-lg text-center border border-emerald-100", compact ? "p-2 gap-2" : "p-3 gap-3")}>
                        <div className="flex-grow">
                            <p className={cn("font-bold text-emerald-800 dark:text-emerald-200", compact ? "text-[11px]" : "text-sm")}>{event.title}</p>
                            {!compact && <p className="text-[11px] text-muted-foreground">{event.description}</p>}
                        </div>
                        {event.imageUrl && !compact && (
                            <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                                <Image src={event.imageUrl} alt={event.title} fill className="object-cover" />
                            </div>
                        )}
                        <Button
                            size="sm"
                            onClick={() => onParticipate(event.parentId || event.id, new Date(event.start))}
                            disabled={event.hasParticipated}
                            variant={event.hasParticipated ? "secondary" : "default"}
                            className={cn("h-7", event.hasParticipated ? "bg-emerald-600 text-white w-full text-[10px]" : "w-full text-[10px]")}
                        >
                            {event.hasParticipated ? <Check className="mr-1.5 h-3 w-3" /> : null}
                            {event.hasParticipated ? 'Confirmado' : 'Participar'}
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
