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
import { Camera, Save, Eye, EyeOff, Loader2, ListTree, UserCheck } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/password-strength-indicator';
import type { User, UserRole, Process, NavItem } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Identicon } from '../ui/identicon';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { getNavItemsForRole } from '@/lib/nav-items';
import { Checkbox } from '../ui/checkbox';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../ui/card';
import { Separator } from '../ui/separator';

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
    const [showPassword, setShowPassword] = useState(false);

    const [customPermissions, setCustomPermissions] = useState<string[]>([]);

    const allNavItems = getNavItemsForRole('ADMINISTRATOR'); // Obtenemos todos los items posibles

    const getPathsForRole = (role: UserRole) => {
        const items = getNavItemsForRole(role);
        const paths = new Set<string>();
        const extractPaths = (navItems: NavItem[]) => {
            navItems.forEach(item => {
                if(item.path) paths.add(item.path);
                if(item.children) extractPaths(item.children);
            })
        }
        extractPaths(items);
        return Array.from(paths);
    };

    useEffect(() => {
        if (user) {
            const defaultRolePermissions = getPathsForRole(user.role);
            const userCustomPermissions = user.customPermissions || [];
            const allPermissions = Array.from(new Set([...defaultRolePermissions, ...userCustomPermissions]));

            setName(user.name || '');
            setEmail(user.email || '');
            setRole(user.role || 'STUDENT');
            setPassword('');
            setProcessId((user as any).process?.id || (user as any).processId || null);
            setAvatarUrl(user.avatar || null);
            setCustomPermissions(allPermissions);
        } else {
            // Reset for new user
            const defaultStudentPermissions = getPathsForRole('STUDENT');
            setName('');
            setEmail('');
            setPassword('');
            setRole('STUDENT');
            setProcessId(null);
            setAvatarUrl(null);
            setCustomPermissions(defaultStudentPermissions);
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
    
    const handlePermissionChange = (path: string, checked: boolean) => {
        setCustomPermissions(prev => 
            checked ? [...prev, path] : prev.filter(p => p !== path)
        );
    };

    const handleRoleChange = (newRole: UserRole) => {
        setRole(newRole);
        const defaultPermissionsForNewRole = getPathsForRole(newRole);
        setCustomPermissions(defaultPermissionsForNewRole);
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const defaultPermissionsForCurrentRole = getPathsForRole(role);
            // Solo guardamos como 'custom' los permisos que NO vienen por defecto con el rol.
            const permissionsToSave = customPermissions.filter(p => !defaultPermissionsForCurrentRole.includes(p));

            const body: any = {
                name, email, role, processId, avatar: avatarUrl, customPermissions: permissionsToSave
            };
            
            if (password.trim() !== '') {
                body.password = password;
            }

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
            <DialogContent className="w-[95vw] sm:max-w-3xl p-0 gap-0 rounded-2xl max-h-[90vh] flex flex-col">
                 <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
                    <DialogTitle>{user ? 'Editar Colaborador' : 'Añadir Nuevo Colaborador'}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 min-h-0">
                  <form id="user-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-4">
                      {/* Columna Izquierda */}
                      <div className="space-y-4">
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
                            <div className="relative">
                                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required={!user} autoComplete="new-password" />
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </Button>
                            </div>
                            {password && <PasswordStrengthIndicator password={password} isVisible={true} />}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label htmlFor="role">Rol</Label>
                              <Select value={role} onValueChange={(value) => handleRoleChange(value as UserRole)}>
                                  <SelectTrigger id="role"><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                                  <SelectContent><SelectItem value="STUDENT">Estudiante</SelectItem><SelectItem value="INSTRUCTOR">Instructor</SelectItem><SelectItem value="ADMINISTRATOR">Administrador</SelectItem></SelectContent>
                              </Select>
                          </div>
                           <div className="space-y-2">
                                <Label htmlFor="process">Proceso Asignado</Label>
                                 <Select value={processId || 'unassigned'} onValueChange={(value) => setProcessId(value === 'unassigned' ? null : value)}>
                                  <SelectTrigger id="process"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                                  <SelectContent><SelectItem value="unassigned">Sin Asignar</SelectItem>{flattenedProcesses.map(p => (<SelectItem key={p.id} value={p.id} style={{ paddingLeft: `${p.level * 1.5 + 1}rem` }}>{p.name}</SelectItem>))}</SelectContent>
                              </Select>
                          </div>
                        </div>
                      </div>
                      {/* Columna Derecha */}
                       <div className="space-y-4">
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCheck className="h-4 w-4"/>Permisos Granulares</CardTitle><CardDescription className="text-xs">Sobreescribe los permisos del rol y concede acceso a páginas específicas.</CardDescription></CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-72 border rounded-md">
                                        <div className="p-4 space-y-2">
                                        {allNavItems.map(item => (
                                            <React.Fragment key={item.id}>
                                                <p className="font-semibold text-sm pt-2">{item.label}</p>
                                                {(item.children || [item]).filter(child => child.path).map(child => (
                                                     <div key={child.id} className="flex items-center space-x-3 ml-2">
                                                         <Checkbox id={`perm-${child.id}`} checked={customPermissions.includes(child.path!)} onCheckedChange={checked => handlePermissionChange(child.path!, !!checked)}/>
                                                         <Label htmlFor={`perm-${child.id}`} className="font-normal">{child.label}</Label>
                                                     </div>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                       </div>
                  </form>
                </ScrollArea>
                <DialogFooter className="p-6 pt-4 border-t flex-shrink-0 flex-row justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" form="user-form" disabled={isSaving || !name.trim() || !email.trim() || (!user && !password)}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        <Save className="mr-2 h-4 w-4" />
                        {user ? 'Guardar Cambios' : 'Crear Colaborador'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
