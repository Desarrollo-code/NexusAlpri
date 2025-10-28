// src/components/messages/new-conversation-modal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types';

interface NewConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectParticipant: (participant: User) => void;
}

export function NewConversationModal({ isOpen, onClose, onSelectParticipant }: NewConversationModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            fetch('/api/users/list')
                .then(res => res.json())
                .then(data => setUsers(data.users || []))
                .catch(() => toast({ title: 'Error', description: 'No se pudo cargar la lista de usuarios', variant: 'destructive' }))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, toast]);
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Iniciar Nueva Conversación</DialogTitle>
                    <DialogDescription>Selecciona un usuario para empezar a chatear.</DialogDescription>
                </DialogHeader>
                 <Command className="rounded-lg border shadow-md">
                    <CommandInput placeholder="Buscar usuario..." />
                    <CommandList>
                        {isLoading && <div className="p-4 text-center"><Loader2 className="animate-spin h-5 w-5 mx-auto"/></div>}
                        <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
                        <CommandGroup>
                            {users.map((user) => (
                                <CommandItem key={user.id} onSelect={() => onSelectParticipant(user)} className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatar || undefined} />
                                        <AvatarFallback><Identicon userId={user.id} /></AvatarFallback>
                                    </Avatar>
                                    <span>{user.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
