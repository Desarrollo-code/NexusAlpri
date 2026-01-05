
"use client";

import React, { useState, useEffect } from "react";
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
    Download,
    Sparkles,
    Trash2,
    ChevronLeft,
    ShieldCheck,
    UserCheck,
    Loader2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarEvent } from "./enhanced-calendar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

interface EventDetailsDialogProps {
    event: CalendarEvent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EventDetailsDialog({ event, open, onOpenChange }: EventDetailsDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isManagingAttendance, setIsManagingAttendance] = useState(false);
    const [participations, setParticipations] = useState<any[]>([]);
    const [isLoadingParticipations, setIsLoadingParticipations] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    const isCreator = user?.id === event?.creatorId || user?.role === 'ADMINISTRATOR';

    useEffect(() => {
        if (open && isManagingAttendance && event) {
            fetchParticipations();
        }
    }, [open, isManagingAttendance, event]);

    const fetchParticipations = async () => {
        if (!event) return;
        setIsLoadingParticipations(true);
        try {
            const res = await fetch(`/api/events/participations?eventId=${event.id}&occurrenceDate=${event.start.toISOString()}`);
            if (res.ok) {
                const data = await res.json();
                setParticipations(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingParticipations(false);
        }
    };

    const handleConfirmAttendance = async () => {
        if (!event) return;
        setIsConfirming(true);
        try {
            const res = await fetch('/api/events/participate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: event.id,
                    occurrenceDate: event.start.toISOString()
                })
            });
            if (res.ok) {
                toast({
                    title: "Asistencia Confirmada",
                    description: "Tu participación ha sido registrada correctamente.",
                    className: "bg-green-600 text-white"
                });
            } else {
                toast({
                    title: "Error",
                    description: "No se pudo registrar la asistencia.",
                    variant: "destructive"
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsConfirming(false);
        }
    };

    const handleVerifyUser = async (participationId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/events/participations/${participationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isVerified: !currentStatus })
            });
            if (res.ok) {
                setParticipations(prev => prev.map(p => p.id === participationId ? { ...p, isVerified: !currentStatus } : p));
                toast({
                    title: !currentStatus ? "Usuario Verificado" : "Verificación Removida",
                    description: "El estado de asistencia ha sido actualizado.",
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (!event) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) setIsManagingAttendance(false);
        }}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 bg-background/95 backdrop-blur-xl border-primary/10 shadow-2xl">
                {isManagingAttendance ? (
                    <div className="flex flex-col h-[500px]">
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => setIsManagingAttendance(false)} className="rounded-full">
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <h3 className="font-bold text-lg">Control de Asistencia</h3>
                            </div>
                            <Badge variant="outline" className="font-black">{participations.length} Confirmados</Badge>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {isLoadingParticipations ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-sm font-medium">Cargando participantes...</p>
                                </div>
                            ) : participations.length > 0 ? (
                                participations.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-primary/5 hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-primary/10">
                                                <AvatarImage src={p.user.avatar} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                    {p.user.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm tracking-tight">{p.user.name}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                                                    Confirmado {format(new Date(p.confirmedAt), "HH:mm")}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={p.isVerified ? "default" : "outline"}
                                            className={cn("rounded-xl gap-2 h-9", p.isVerified && "bg-green-600 hover:bg-green-700")}
                                            onClick={() => handleVerifyUser(p.id, p.isVerified)}
                                        >
                                            {p.isVerified ? <ShieldCheck className="h-4 w-4" /> : <UserCheck className="h-4 w-4 text-muted-foreground" />}
                                            {p.isVerified ? "Verificado" : "Verificar"}
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 space-y-2">
                                    <Users className="h-12 w-12" />
                                    <p className="text-sm font-bold">Nadie ha confirmado asistencia aún.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={cn(
                            "h-44 relative flex items-end p-6 overflow-hidden",
                            event.color ? `bg-[${event.color}]` : "bg-gradient-to-br from-primary/80 via-primary to-indigo-900"
                        )} style={{ backgroundColor: event.color }}>
                            <div className="absolute inset-0 bg-black/20" />
                            <div className="absolute top-4 right-4 flex gap-2 z-10">
                                {event.isInteractive && (
                                    <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white border-none gap-1 py-1 shadow-lg shadow-amber-500/20">
                                        <Sparkles className="h-3 w-3" /> Interactivo
                                    </Badge>
                                )}
                                <Badge className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-none py-1">
                                    {event.categoryId === "ALL" ? "General" :
                                        event.categoryId === "ADMINISTRATOR" ? "Admin" :
                                            event.categoryId === "INSTRUCTOR" ? "Instructor" : "Estudiante"}
                                </Badge>
                            </div>
                            <h2 className="text-3xl font-black text-white drop-shadow-xl z-10 tracking-tight">{event.title}</h2>
                        </div>

                        <div className="p-6 grid gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/50 border border-primary/5">
                                    <div className="bg-primary/10 p-2 rounded-xl">
                                        <CalendarIcon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Fecha</span>
                                        <span className="text-sm font-bold">{format(event.start, "EEEE, d 'de' MMMM", { locale: es })}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/50 border border-primary/5">
                                    <div className="bg-primary/10 p-2 rounded-xl">
                                        <Clock className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Horario</span>
                                        <span className="text-sm font-bold">{format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}</span>
                                    </div>
                                </div>
                                {event.location && (
                                    <div className="col-span-2 flex items-center gap-3 p-3 rounded-2xl bg-secondary/50 border border-primary/5">
                                        <div className="bg-primary/10 p-2 rounded-xl">
                                            <MapPin className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Ubicación</span>
                                            <span className="text-sm font-bold">{event.location}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/60">Descripción</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {event.description || "Sin descripción disponible."}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/60">Asistentes</h4>
                                    {isCreator && (
                                        <Button variant="link" size="sm" className="h-auto p-0 text-xs font-black text-primary hover:text-primary/80 uppercase tracking-widest" onClick={() => setIsManagingAttendance(true)}>
                                            Gestionar Control
                                        </Button>
                                    )}
                                </div>
                                <div className="flex -space-x-3 overflow-hidden py-1">
                                    {event.attendees && event.attendees.length > 0 ? (
                                        <>
                                            {event.attendees.slice(0, 5).map((att) => (
                                                <Avatar key={att.id} className="inline-block border-2 border-background w-10 h-10 shadow-sm ring-1 ring-primary/5">
                                                    <AvatarImage src={att.avatar || undefined} />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{att.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            ))}
                                            {event.attendees.length > 5 && (
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-background bg-secondary text-[10px] font-black text-muted-foreground relative z-10 shadow-sm">
                                                    +{event.attendees.length - 5}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-xs text-muted-foreground font-medium italic">General para todos los miembros.</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-primary/10 flex flex-col gap-4">
                                {event.isInteractive && (
                                    <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 shadow-sm flex items-center justify-between animate-in slide-in-from-bottom-2 duration-500">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-black text-amber-900">Registrar Asistencia</span>
                                            <p className="text-[10px] font-bold text-amber-700 leading-tight">Este evento requiere comprobación de presencia.</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black gap-2 px-6 h-10 shadow-lg shadow-amber-500/20"
                                            onClick={handleConfirmAttendance}
                                            disabled={isConfirming}
                                        >
                                            {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                            Ya estoy aquí
                                        </Button>
                                    </div>
                                )}

                                <div className="flex items-center justify-between w-full">
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="rounded-2xl gap-2 font-bold px-4 h-10 border-primary/10 hover:bg-primary/5">
                                            <Download className="h-4 w-4" /> Exportar .ics
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        {isCreator && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="rounded-2xl text-destructive hover:bg-destructive/10 border-destructive/10 h-10 w-10"
                                                onClick={async () => {
                                                    if (confirm(`¿Estás seguro de que deseas eliminar el evento "${event.title}"?`)) {
                                                        try {
                                                            const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
                                                            if (res.ok) window.location.reload();
                                                            else toast({ title: "Error", description: "No se pudo eliminar el evento", variant: "destructive" });
                                                        } catch (e) { console.error(e); }
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" className="rounded-2xl font-bold px-6 h-10" onClick={() => onOpenChange(false)}>
                                            Cerrar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
