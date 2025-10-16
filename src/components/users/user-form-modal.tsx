// src/components/users/user-form-modal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/password-strength-indicator';
import type { User, UserRole, Process } from '@/types';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    user: User | null;
    processes: Process[];
}

interface FlatProcess {
    id: string;
    name: string;
    level: number;
}


export function UserFormModal({ isOpen, onClose, onSave, user, processes }: UserFormModalProps) {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('STUDENT');
    const [processId, setProcessId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setRole(user.role || 'STUDENT');
            setPassword(''); // No precargar la contraseña por seguridad
            setProcessId(user.processId || null);
        } else {
            // Reset for new user
            setName('');
            setEmail('');
            setPassword('');
            setRole('STUDENT');
            setProcessId(null);
        }
    }, [user, isOpen]);

    const flattenProcesses = (processList: Process[], level = 0): FlatProcess[] => {
      let flatList: FlatProcess[] = [];
      processList.forEach(p => {
          flatList.push({ id: p.id, name: p.name, level });
          if ('children' in p && Array.isArray(p.children) && p.children.length > 0) {
              flatList.push(...flattenProcesses(p.children, level + 1));
          }
      });
      return flatList;
  };
  const flattenedProcesses = flattenProcesses(processes);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const body = {
                name,
                email,
                role,
                processId,
                ...(password && { password }), // Solo incluir la contraseña si se ha escrito
            };

            const endpoint = user ? `/api/users/${user.id}` : '/api/users';
            const method = user ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `No se pudo ${user ? 'actualizar' : 'crear'} el usuario.`);
            }

            toast({
                title: '¡Éxito!',
                description: `Usuario ${user ? 'actualizado' : 'creado'} correctamente.`,
            });
            onSave();
            onClose();

        } catch (error) {
            toast({
                title: 'Error',
                description: (error as Error).message,
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{user ? 'Editar Colaborador' : 'Añadir Nuevo Colaborador'}</DialogTitle>
                    <DialogDescription>
                        {user ? 'Modifica la información del colaborador.' : 'Completa los datos para registrar un nuevo colaborador en la plataforma.'}
                    </DialogDescription>
                </DialogHeader>
                <form id="user-form" onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">{user ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!user} />
                        {password && <PasswordStrengthIndicator password={password} isVisible={true} />}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="role">Rol</Label>
                          <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                              <SelectTrigger id="role">
                                  <SelectValue placeholder="Seleccionar rol" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="STUDENT">Estudiante</SelectItem>
                                  <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                                  <SelectItem value="ADMINISTRATOR">Administrador</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                       <div className="space-y-2">
                            <Label htmlFor="process">Proceso Asignado</Label>
                             <Select value={processId || 'unassigned'} onValueChange={(value) => setProcessId(value === 'unassigned' ? null : value)}>
                              <SelectTrigger id="process">
                                  <SelectValue placeholder="Sin asignar" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="unassigned">Sin Asignar</SelectItem>
                                  {flattenedProcesses.map(p => (
                                      <SelectItem key={p.id} value={p.id} style={{ paddingLeft: `${p.level * 1.5 + 1}rem` }}>
                                          {p.name}
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" form="user-form" disabled={isSaving || !name.trim() || !email.trim() || (!user && !password)}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {user ? 'Guardar Cambios' : 'Crear Colaborador'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
