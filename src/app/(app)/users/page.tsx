
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Edit3, Trash2, UserCog, Loader2, AlertTriangle, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { User, UserRole } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToChangeRole, setUserToChangeRole] = useState<User | null>(null);
  
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);

  // Form state
  const [isProcessing, setIsProcessing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('STUDENT');
  const [editPassword, setEditPassword] = useState('');
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>('STUDENT');


  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users', { cache: 'no-store' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch users: ${response.statusText}`);
      }
      const responseData: { message: string, users: User[] | null } = await response.json();
      setUsersList(responseData.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al cargar usuarios');
      setUsersList([]);
       toast({ title: "Error al cargar usuarios", description: err instanceof Error ? err.message : 'No se pudieron cargar los usuarios.', variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (currentUser?.role !== 'ADMINISTRATOR') {
      if (typeof window !== 'undefined') router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [currentUser, router, fetchUsers]);
  
  const getInitials = (name?: string | null) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    if (names.length === 1 && names[0]) return names[0].substring(0, 2).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch(role) {
      case 'ADMINISTRATOR': return 'destructive';
      case 'INSTRUCTOR': return 'default';
      case 'STUDENT': return 'secondary';
      default: return 'outline';
    }
  };

  const resetFormFields = () => {
    setEditName('');
    setEditEmail('');
    setEditRole('STUDENT');
    setEditPassword('');
  }

  const handleOpenAddModal = () => {
    setUserToEdit(null);
    resetFormFields();
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (selectedUser: User) => {
    setUserToEdit(selectedUser);
    setEditName(selectedUser.name);
    setEditEmail(selectedUser.email);
    setEditRole(selectedUser.role);
    setEditPassword('');
    setShowAddEditModal(true);
  };
  
  const handleOpenChangeRoleDialog = (selectedUser: User) => {
    setUserToChangeRole(selectedUser);
    setSelectedNewRole(selectedUser.role);
    setShowChangeRoleDialog(true);
  };

  const handleAddEditUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
        toast({ title: "Error", description: "Nombre y Email son obligatorios.", variant: "destructive"});
        return;
    }
    if (!userToEdit && !editPassword.trim()) {
        toast({ title: "Error", description: "La contraseña es obligatoria para nuevos usuarios.", variant: "destructive"});
        return;
    }
    if (!userToEdit && editPassword.trim().length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres.", variant: "destructive"});
      return;
    }
    setIsProcessing(true);

    const userData: any = { 
      name: editName, 
      email: editEmail, 
      role: editRole,
    };
    if (!userToEdit && editPassword) {
        userData.password = editPassword;
    }

    const method = userToEdit ? 'PUT' : 'POST';
    const endpoint = userToEdit ? `/api/users/${userToEdit.id}` : '/api/users';

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save user');
      }
      
      const savedUser = await response.json();
      
      toast({ 
        title: userToEdit ? "Usuario Actualizado" : "Usuario Creado", 
        description: `El usuario ${savedUser.name} ha sido ${userToEdit ? 'actualizado' : 'creado'}.` 
      });
      fetchUsers(); 
      setShowAddEditModal(false);
      setUserToEdit(null); 
      resetFormFields();
    } catch (err) {
      toast({ title: "Error al guardar", description: err instanceof Error ? err.message : 'No se pudo guardar el usuario.', variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (userToDelete.id === currentUser?.id) {
        toast({ title: "Acción no permitida", description: "No puedes eliminar tu propia cuenta.", variant: "destructive" });
        setShowDeleteConfirmDialog(false);
        setUserToDelete(null);
        return;
    }
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      toast({ title: "Usuario Eliminado", description: `El usuario ${userToDelete.name} ha sido eliminado.` });
      fetchUsers();
    } catch (err) {
      toast({ title: "Error al eliminar", description: err instanceof Error ? err.message : 'No se pudo eliminar el usuario.', variant: "destructive" });
    } finally {
      setShowDeleteConfirmDialog(false);
      setUserToDelete(null);
      setIsProcessing(false);
    }
  };

  const handleChangeUserRoleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userToChangeRole) return;
     if (userToChangeRole.id === currentUser?.id && selectedNewRole !== currentUser.role) {
        toast({ title: "Acción no permitida", description: "No puedes cambiar tu propio rol directamente.", variant: "destructive" });
        setShowChangeRoleDialog(false);
        setUserToChangeRole(null);
        return;
    }
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/users/${userToChangeRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedNewRole }), 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change user role');
      }
      toast({ title: "Rol Actualizado", description: `El rol de ${userToChangeRole.name} ha sido cambiado a ${selectedNewRole}.` });
      fetchUsers(); 
      setShowChangeRoleDialog(false);
      setUserToChangeRole(null);
    } catch (err) {
      toast({ title: "Error al cambiar rol", description: err instanceof Error ? err.message : 'No se pudo cambiar el rol.', variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentUser?.role !== 'ADMINISTRATOR' && !isLoading) {
    return <div className="flex h-full items-center justify-center"><p>Acceso denegado. Serás redirigido.</p></div>;
  }
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline mb-2">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administra los usuarios de la plataforma NexusAlpri.</p>
        </div>
        <Dialog open={showAddEditModal} onOpenChange={(isOpen) => {
            setShowAddEditModal(isOpen);
            if (!isOpen) {
                setUserToEdit(null); 
                resetFormFields();
            }
        }}>
            <DialogTrigger asChild>
                <Button onClick={handleOpenAddModal}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nuevo Usuario
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{userToEdit ? "Editar Usuario" : "Añadir Nuevo Usuario"}</DialogTitle>
                  <DialogDescription>
                    {userToEdit ? "Modifica los datos del usuario." : "Completa los campos para registrar un nuevo usuario."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddEditUser} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nombre</Label>
                        <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nombre completo" className="col-span-3" required disabled={isProcessing} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="usuario@ejemplo.com" className="col-span-3" required disabled={isProcessing}/>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Rol</Label>
                        <Select name="role" value={editRole} onValueChange={(value) => setEditRole(value as UserRole)} required disabled={isProcessing}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="STUDENT">Estudiante</SelectItem>
                                <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                                <SelectItem value="ADMINISTRATOR">Administrador</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {!userToEdit && (
                       <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="password" className="text-right">Contraseña</Label>
                          <Input id="password" type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="col-span-3" required disabled={isProcessing}/>
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => {
                            setShowAddEditModal(false);
                            setUserToEdit(null);
                            resetFormFields();
                        }} disabled={isProcessing}>Cancelar</Button>
                        <Button type="submit" disabled={isProcessing}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {userToEdit ? "Guardar Cambios" : "Crear Usuario"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>Lista de Usuarios</CardTitle>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        type="search" 
                        placeholder="Buscar usuarios..." 
                        className="pl-8 w-full md:w-[300px]" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <CardDescription>Visualiza y gestiona todos los usuarios registrados.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Cargando usuarios...</p>
            </div>
          ) : error && !usersList.length ? ( 
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="font-semibold">Error al cargar usuarios</p>
              <p className="text-sm">{error}</p>
              <Button onClick={fetchUsers} variant="outline" className="mt-4">Reintentar</Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="hidden md:table-cell">Registrado</TableHead>
                    <TableHead><span className="sr-only">Acciones</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={u.avatar || undefined} alt={u.name} data-ai-hint="user avatar" />
                                <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{u.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(u.role)} className="capitalize">{u.role.toLowerCase()}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{u.registeredDate ? new Date(u.registeredDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/Bogota'}) : 'N/A'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenEditModal(u)}>
                                <Edit3 className="mr-2 h-4 w-4 text-blue-500"/>Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenChangeRoleDialog(u)} disabled={u.id === currentUser?.id}>
                                <UserCog className="mr-2 h-4 w-4 text-amber-600"/>Cambiar Rol
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                                onClick={() => {
                                    setUserToDelete(u);
                                    setShowDeleteConfirmDialog(true);
                                }}
                                disabled={u.id === currentUser?.id} 
                            >
                                <Trash2 className="mr-2 h-4 w-4"/>Eliminar
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredUsers.length === 0 && !isLoading && !error && (
                <p className="text-center text-muted-foreground py-8">No se encontraron usuarios que coincidan con la búsqueda.</p>
              )}
               {usersList.length === 0 && !isLoading && !error && (
                <p className="text-center text-muted-foreground py-8">No hay usuarios registrados. Añade el primero para empezar.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario
               <strong> {userToDelete?.name}</strong> de la plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} onClick={() => setShowDeleteConfirmDialog(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isProcessing} className={buttonVariants({ variant: "destructive" })}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Sí, eliminar usuario"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showChangeRoleDialog} onOpenChange={(isOpen) => {
          setShowChangeRoleDialog(isOpen);
          if (!isOpen) setUserToChangeRole(null);
      }}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
                <DialogDescription>
                  Selecciona el nuevo rol para <strong>{userToChangeRole?.name}</strong>.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleChangeUserRoleSubmit} className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="user-name-role" className="text-right">Usuario</Label>
                      <Input id="user-name-role" value={userToChangeRole?.name || ''} className="col-span-3" disabled />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-role" className="text-right">Nuevo Rol</Label>
                      <Select name="new-role" value={selectedNewRole} onValueChange={(value) => setSelectedNewRole(value as UserRole)} required disabled={isProcessing}>
                          <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Seleccionar nuevo rol" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="STUDENT">Estudiante</SelectItem>
                              <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                              <SelectItem value="ADMINISTRATOR">Administrador</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => {
                          setShowChangeRoleDialog(false);
                          setUserToChangeRole(null);
                      }} disabled={isProcessing}>Cancelar</Button>
                      <Button type="submit" disabled={isProcessing}>
                          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                          Guardar Rol
                      </Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
