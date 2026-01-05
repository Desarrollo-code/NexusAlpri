
"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Calendar as CalendarIcon,
    MapPin,
    Clock,
    Users,
    CheckCircle2,
    HelpCircle,
    XCircle,
    Download
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarEvent } from "./enhanced-calendar";
import { cn } from "@/lib/utils";

interface EventDetailsDialogProps {
    event: CalendarEvent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EventDetailsDialog({ event, open, onOpenChange }: EventDetailsDialogProps) {
    const [rsvp, setRsvp] = useState<"attending" | "maybe" | "not_attending" | null>(null);

    if (!event) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0">
                {/* Header Image Area (Mocked Color/Image) */}
                <div className="h-40 bg-gradient-to-r from-blue-500 to-indigo-600 relative flex items-end p-6">
                    <div className="absolute top-4 right-4 flex gap-2">
                        <Badge className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border-none">
                            Corporativo
                        </Badge>
                    </div>
                    <h2 className="text-3xl font-bold text-white drop-shadow-md">{event.title}</h2>
                </div>

                <div className="p-6 grid gap-6">
                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            <span>{format(event.start, "EEEE, d 'de' MMMM", { locale: es })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>
                                {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
                            </span>
                        </div>
                        {event.location && (
                            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span>{event.location}</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm tracking-tight text-foreground/80">Acerca del evento</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {event.description || "Sin descripción disponible."}
                        </p>
                    </div>

                    {/* Attendees Mock */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm tracking-tight text-foreground/80 flex justify-between items-center">
                            <span>Asistentes (12)</span>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary">Ver todos</Button>
                        </h4>
                        <div className="flex -space-x-2 overflow-hidden py-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Avatar key={i} className="inline-block border-2 border-background w-8 h-8">
                                    <AvatarImage src={`https://i.pravatar.cc/150?u=${i}`} />
                                    <AvatarFallback>U{i}</AvatarFallback>
                                </Avatar>
                            ))}
                            <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground relative z-10">
                                +7
                            </div>
                        </div>
                    </div>

                    {/* RSVP Actions */}
                    <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">¿Asistirás?</span>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Download className="h-4 w-4" />
                                Exportar .ics
                            </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <Button
                                variant={rsvp === "attending" ? "default" : "outline"}
                                className={cn("w-full gap-2", rsvp === "attending" && "bg-green-600 hover:bg-green-700")}
                                onClick={() => setRsvp("attending")}
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Asistiré
                            </Button>
                            <Button
                                variant={rsvp === "maybe" ? "default" : "outline"}
                                className={cn("w-full gap-2", rsvp === "maybe" && "bg-amber-500 hover:bg-amber-600")}
                                onClick={() => setRsvp("maybe")}
                            >
                                <HelpCircle className="h-4 w-4" />
                                Quizás
                            </Button>
                            <Button
                                variant={rsvp === "not_attending" ? "default" : "outline"}
                                className={cn("w-full gap-2", rsvp === "not_attending" && "bg-red-500 hover:bg-red-600")}
                                onClick={() => setRsvp("not_attending")}
                            >
                                <XCircle className="h-4 w-4" />
                                No
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
