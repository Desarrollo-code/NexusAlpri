// src/components/users/chat-permissions-modal.tsx
'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User as AppUser } from '@/types';

interface ChatPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser;
}

export function ChatPermissionsModal({ isOpen, onClose, user }: ChatPermissionsModalProps) {
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [allowedUserIds, setAllowedUserIds] = useState<Set<string>>(new Set());
  const [userSearch, setUserSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setIsLoading(true);
      Promise.all([
        fetch('/api/users/list').then(res => res.json()),
        fetch(`/api/users/${user.id}/chat-permissions`).then(res => res.json()),
      ])
        .then(([allUsersData, permissionsData]) => {
          setAllUsers(allUsersData.users.filter((u: AppUser) => u.id !== user.id));
          setAllowedUserIds(new Set(permissionsData.map((u: AppUser) => u.id)));
        })
        .catch(() => toast({ title: "Error", description: "No se pudo cargar la información de permisos.", variant: "destructive" }))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, user, toast]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));
  }, [allUsers, userSearch]);

  const handleUserPermissionToggle = useCallback((userId: string, checked: boolean) => {
    setAllowedUserIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  }, []);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${user.id}/chat-permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowedUserIds: Array.from(allowedUserIds) }),
      });
      if (!response.ok) {
        throw new Error((await response.json()).message || 'No se pudieron guardar los permisos.');
      }
      toast({ title: '¡Éxito!', description: 'Los permisos de chat se han actualizado.' });
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[70vh] flex flex-col p-0 gap-0 rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
          <DialogTitle>Permisos de Chat para {user.name}</DialogTitle>
          <DialogDescription>
            Selecciona con qué usuarios puede iniciar una conversación.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 flex flex-col p-6 pt-0 gap-4">
          <Input
            placeholder="Buscar usuarios..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
          />
          <ScrollArea className="flex-grow border rounded-md">
            {isLoading ? (
              <div className="p-4 text-center"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredUsers.length > 0 ? filteredUsers.map(u => (
                  <div key={u.id} className="flex items-center space-x-3 p-1.5 rounded-md hover:bg-muted">
                    <Checkbox
                      id={`permission-${u.id}`}
                      checked={allowedUserIds.has(u.id)}
                      onCheckedChange={(c) => handleUserPermissionToggle(u.id, !!c)}
                    />
                    <Label htmlFor={`permission-${u.id}`} className="flex items-center gap-2 font-normal cursor-pointer">
                      <Avatar className="h-8 w-8"><AvatarImage src={u.avatar || undefined} /><AvatarFallback><Identicon userId={u.id} /></AvatarFallback></Avatar>
                      <span>{u.name}</span>
                    </Label>
                  </div>
                )) : <p className="text-sm text-center text-muted-foreground p-4">No se encontraron usuarios.</p>}
              </div>
            )}
          </ScrollArea>
        </div>
        <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
