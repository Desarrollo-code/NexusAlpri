// src/components/course-assignment-modal.tsx
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
import { Loader2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { User as AppUser } from '@/types';

interface CourseAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
}

export function CourseAssignmentModal({ isOpen, onClose, courseId, courseTitle }: CourseAssignmentModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [userSearch, setUserSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingUsers(true);
      fetch('/api/users/list')
        .then(res => res.json())
        .then(data => {
            // Filtramos para mostrar solo estudiantes, excluyendo al usuario actual
            const studentUsers = (data.users || []).filter((u: AppUser) => u.role === 'STUDENT' && u.id !== user?.id);
            setAllUsers(studentUsers);
        })
        .catch(() => toast({ title: "Error", description: "No se pudo cargar la lista de usuarios.", variant: "destructive" }))
        .finally(() => setIsLoadingUsers(false));
      setSelectedUserIds(new Set());
    }
  }, [isOpen, toast, user?.id]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));
  }, [allUsers, userSearch]);

  const handleUserSelectionToggle = useCallback((userId: string, checked: boolean) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  }, []);

  const handleAssignCourses = async () => {
    if (selectedUserIds.size === 0) {
      toast({ title: 'Ningún usuario seleccionado', description: 'Por favor, selecciona al menos un usuario.', variant: 'default' });
      return;
    }
    setIsAssigning(true);
    try {
      const response = await fetch('/api/courses/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, userIds: Array.from(selectedUserIds) }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo asignar el curso.');
      }
      toast({ title: '¡Éxito!', description: data.message });
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Curso Obligatorio</DialogTitle>
          <DialogDescription>
            Selecciona los usuarios a los que se les asignará el curso "<strong>{courseTitle}</strong>" como obligatorio.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Buscar estudiantes..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className="mb-3"
          />
          <ScrollArea className="h-64 border rounded-md">
            {isLoadingUsers ? (
              <div className="p-4 text-center"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredUsers.length > 0 ? filteredUsers.map(u => (
                  <div key={u.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`assign-${u.id}`}
                      checked={selectedUserIds.has(u.id)}
                      onCheckedChange={(c) => handleUserSelectionToggle(u.id, !!c)}
                    />
                    <Label htmlFor={`assign-${u.id}`} className="flex items-center gap-2 font-normal cursor-pointer">
                      <Avatar className="h-7 w-7"><AvatarImage src={u.avatar || undefined} /><AvatarFallback><Identicon userId={u.id} /></AvatarFallback></Avatar>
                      {u.name}
                    </Label>
                  </div>
                )) : <p className="text-sm text-center text-muted-foreground p-4">No se encontraron estudiantes.</p>}
              </div>
            )}
          </ScrollArea>
           <div className="text-sm text-muted-foreground mt-2">{selectedUserIds.size} usuario(s) seleccionado(s).</div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAssigning}>Cancelar</Button>
          <Button onClick={handleAssignCourses} disabled={isAssigning || selectedUserIds.size === 0}>
            {isAssigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
            Asignar Curso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
