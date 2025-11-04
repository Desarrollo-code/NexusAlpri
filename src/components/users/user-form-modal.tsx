
// src/components/users/user-form-modal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { Loader2, Camera, Save } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/password-strength-indicator';
import type { User, UserRole, Process } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Identicon } from '../ui/identicon';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';

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
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setRole(user.role || 'STUDENT');
            setPassword('');
            setProcessId((user as any).process?.id || (user as any).processId || null);
            setAvatarUrl(user.avatar || null);
        } else {
            // Reset for new user
            setName('');
            setEmail('');
            setPassword('');
            setRole('STUDENT');
            setProcessId(null);
            setAvatarUrl(null);
        }
         setLocalAvatarPreview(null);
    }, [user, isOpen]);

    const flattenProcesses = (processList: Process[], level = 0): FlatProcess[] => {
      let list: FlatProcess[] = [];
      processList.forEach(p => {
        list.push({ id: p.id, name: p.name, level });
        if ('children' in p && Array.isArray(p.children) && p.children.length > 0) {
          list.push(...flattenProcesses(p.children, level + 1));
        }
      });
      return list;
    };
    const flattenedProcesses = flattenProcesses(processes);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            if (localAvatarPreview) {
                URL.revokeObjectURL(localAvatarPreview);
            }
            const previewUrl = URL.createObjectURL(file);
            setLocalAvatarPreview(previewUrl);

            setIsUploading(true);
            setUploadProgress(0);
            try {
                 const result = await uploadWithProgress('/api/upload/avatar', file, setUploadProgress);
                 setAvatarUrl(result.url);
                 toast({ title: "Avatar subido", description: "La imagen se ha subido. Guarda los cambios para aplicarla." });
            } catch (err) {
                toast({ title: 'Error de subida', description: (err as Error).message, variant: 'destructive' });
                URL.revokeObjectURL(previewUrl);
                setLocalAvatarPreview(null);
            } finally {
                setIsUploading(false);
            }
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const body = {
                name,
                email,
                role,
                processId,
                avatar: avatarUrl,
                ...(password && { password }),
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
            <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl">
                <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
                    <DialogTitle>{user ? 'Editar Colaborador' : 'Añadir Nuevo Colaborador'}</DialogTitle>
                    <DialogDescription>
                        {user ? 'Modifica la información del colaborador.' : 'Completa los datos para registrar un nuevo colaborador en la plataforma.'}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 min-h-0">
                  <form id="user-form" onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                             <Avatar className="h-24 w-24">
                                <AvatarImage src={localAvatarPreview || avatarUrl || undefined}/>
                                <AvatarFallback className="text-3xl"><Identicon userId={user?.id || name}/></AvatarFallback>
                            </Avatar>
                             <Label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-secondary text-secondary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors shadow-md">
                                <Camera className="h-5 w-5" />
                                <input id="avatar-upload" type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" disabled={isUploading}/>
                            </Label>
                        </div>
                        {isUploading && (
                            <div className="w-full max-w-xs space-y-1">
                               <Progress value={uploadProgress} />
                               <p className="text-xs text-center text-muted-foreground">Subiendo...</p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">{user ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!user} autoComplete="new-password" />
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
                </ScrollArea>
                <DialogFooter className="p-6 pt-4 flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t flex-shrink-0">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" form="user-form" disabled={isSaving || !name.trim() || !email.trim() || (!user && !password)}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        {user ? 'Guardar Cambios' : 'Crear Colaborador'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
