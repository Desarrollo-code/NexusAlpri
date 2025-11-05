// src/components/calendar/participants-modal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { Loader2, AlertTriangle, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CalendarEvent } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent;
}

interface Participation {
    id: string;
    user: {
        id: string;
        name: string | null;
        avatar: string | null;
    }
}

export function ParticipantsModal({ isOpen, onClose, event }: ParticipantsModalProps) {
    const [participants, setParticipants] = useState<Participation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && event) {
            setIsLoading(true);
            setError(null);
            
            const params = new URLSearchParams({
                eventId: event.parentId || event.id,
                occurrenceDate: new Date(event.start).toISOString(),
            });

            fetch(`/api/events/participations?${params.toString()}`)
                .then(res => {
                    if (!res.ok) throw new Error("No se pudo cargar la lista de participantes.");
                    return res.json();
                })
                .then(data => setParticipants(data))
                .catch(err => setError(err.message))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, event]);
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Participantes de "{event.title}"</DialogTitle>
                    <DialogDescription>
                        Usuarios que confirmaron su participación el {format(new Date(event.start), "d 'de' MMMM", { locale: es })}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[60vh]">
                     <ScrollArea className="h-full">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : error ? (
                             <div className="flex flex-col items-center justify-center h-40 text-destructive">
                                <AlertTriangle className="h-8 w-8 mb-2" />
                                <p>{error}</p>
                            </div>
                        ) : participants.length > 0 ? (
                            <div className="space-y-3 pr-4">
                                {participants.map(p => (
                                    <div key={p.id} className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={p.user.avatar || undefined} />
                                            <AvatarFallback><Identicon userId={p.user.id}/></AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-sm">{p.user.name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                <UserCheck className="h-8 w-8 mb-2"/>
                                <p className="text-sm">Nadie ha confirmado su participación aún.</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
