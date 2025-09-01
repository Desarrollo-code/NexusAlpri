// src/app/(app)/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Edit3, Trash2, UserCog, Loader2, AlertTriangle, MoreHorizontal, Eye, EyeOff, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { GradientIcon } from '@/components/ui/gradient-icon';
import { useDebounce } from '@/hooks/use-debounce';
import { useTitle } from '@/contexts/title-context';
import { getInitials } from '@/lib/utils';
import { getRoleBadgeVariant, getRoleInSpanish } from '@/lib/security-log-utils';

const PAGE_SIZE = 10;

export default function UsersPage() {
  const { user: currentUser, settings } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { setPageTitle } = useTitle();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(null);
  const [userToChangeRole, setUserToChangeRole] = useState<User | null>(null);
  
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showToggleStatusDialog, setShowToggleStatusDialog] = useState(false);
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);

  // Form state
  const [isProcessing, setIsProcessing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('STUDENT');
  const [editPassword, setEditPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>('STUDENT');

  useEffect(() => {
    setPageTitle('Gestión de Usuarios');
  }, [setPageTitle]);

  const fetchUsers = useCallback(() => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.append('page', String(currentPage));
    params.append('pageSize', String(PAGE_SIZE));
    if (debouncedSearchTerm) {
      params.append('search', debouncedSearchTerm);
    }
    
    fetch(`/api/users?${params.toString()}`, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) {
          return res.json().then(errorData => {
            throw new Error(errorData.message || `Falló la carga de usuarios: ${res.statusText}`);
          });
        }
        return res.json();
      })
      .then((responseData: { users: User[]; totalUsers: number; }) => {
        setUsersList(responseData.users || []);
        setTotalUsers(responseData.totalUsers || 0);
      })
      .catch(err => {
        setError(err.message);
        toast({ title: "Error al cargar usuarios", description: err.message, variant: "destructive"});
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentUser, currentPage, debouncedSearchTerm, toast]);

  
  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | number>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(paramsToUpdate).forEach(([name, value]) => {
          if (value) {
            params.set(name, String(value));
          } else {
            params.delete(name);
          }
      });
      return params.toString()
    },
    [searchParams]
  );
  
  useEffect(() => {
    if (currentUser?.role !== 'ADMINISTRATOR' && currentUser) {
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [currentUser, currentPage, debouncedSearchTerm, router, fetchUsers]);

  useEffect(() => {
     // If search term changes, push to history
     const newQueryString = createQueryString({ page: 1, search: debouncedSearchTerm });
     // Avoid pushing the same query string
     if (debouncedSearchTerm !== (searchParams.get('search') || '') || !searchParams.get('page')) {
         router.push(`${pathname}?${newQueryString}`);
     }
  }, [debouncedSearchTerm, pathname, router, createQueryString, searchParams]);
  

  const resetFormFields = () => {
    setEditName('');
    setEditEmail('');
    setEditRole('STUDENT');
    setEditPassword('');
    setShowPassword(false);
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
    setShowPassword(false);
    setShowAddEditModal(true);
  };
  
  const handleOpenChangeRoleDialog = (selectedUser: User) => {
    setUserToChangeRole(selectedUser);
    setSelectedNewRole(selectedUser.role);
    setShowChangeRoleDialog(true);
  };
  
  
  const handlePageChange = (page: number) => {
      const newQueryString = createQueryString({ page });
      router.push(`${pathname}?${newQueryString}`);
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
        throw new Error(errorData.message || 'Falló al guardar el usuario');
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

  const handleToggleUserStatus = async () => {
    if (!userToToggleStatus) return;
    setIsProcessing(true);
    try {
        const newStatus = !userToToggleStatus.isActive;
        const response = await fetch(`/api/users/${userToToggleStatus.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: newStatus })
        });
        if (!response.ok) throw new Error((await response.json()).message || 'No se pudo cambiar el estado');

        toast({
            title: `Usuario ${newStatus ? 'Activado' : 'Inactivado'}`,
            description: `El estado de ${userToToggleStatus.name} ha sido actualizado.`
        });
        fetchUsers();
    } catch (err) {
        toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
        setIsProcessing(false);
        setShowToggleStatusDialog(false);
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
        throw new Error(errorData.message || 'Falló al cambiar el rol del usuario');
      }
      toast({ title: "Rol Actualizado", description: `El rol de ${userToChangeRole.name} ha sido cambiado a ${getRoleInSpanish(selectedNewRole)}.` });
      fetchUsers(); 
      setShowChangeRoleDialog(false);
      setUserToChangeRole(null);
    } catch (err) {
      toast({ title: "Error al cambiar rol", description: err instanceof Error ? err.message : 'No se pudo cambiar el rol.', variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };


  if (currentUser?.role !== 'ADMINISTRATOR' && !isLoading) {
    return <div className="flex h-full items-center justify-center"><p>Acceso denegado. Serás redirigido.</p></div>;
  }
  
  const DesktopUsersTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead><span className="sr-only">Acciones</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
              [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                      <TableCell><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-5 w-32" /></div></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
              ))
          ) : usersList.map((u) => (
            <TableRow key={u.id} className={cn(!u.isActive && "opacity-60")}>
              <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        {u.avatar ? <AvatarImage src={u.avatar} alt={u.name} /> : null}
                        <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{u.name}</div>
                </div>
              </TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(u.role)} className="capitalize">{getRoleInSpanish(u.role)}</Badge>
              </TableCell>
              <TableCell>
                 <Badge variant={u.isActive ? 'default' : 'destructive'} className={cn(u.isActive && "bg-green-600 hover:bg-green-700")}>
                    {u.isActive ? 'Activo' : 'Inactivo'}
                 </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost" aria-label={`Acciones para ${u.name}`}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleOpenEditModal(u)}>
                        <Edit3 className="mr-2 h-4 w-4 text-primary"/>Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenChangeRoleDialog(u)} disabled={u.id === currentUser?.id}>
                        <UserCog className="mr-2 h-4 w-4 text-primary"/>Cambiar Rol
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem 
                        className={cn(u.isActive ? "text-destructive focus:text-destructive-foreground focus:bg-destructive" : "text-green-600 focus:bg-green-500 focus:text-white")}
                        onClick={() => setUserToToggleStatus(u)}
                        disabled={u.id === currentUser?.id} 
                    >
                        {u.isActive ? <UserX className="mr-2 h-4 w-4"/> : <UserCheck className="mr-2 h-4 w-4"/>}
                        {u.isActive ? 'Inactivar' : 'Activar'}
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const MobileUsersList = () => (
    <div className="space-y-4">
      {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-36" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-8" />
                </div>
                 <Skeleton className="h-px w-full" />
                 <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                 </div>
            </Card>
          ))
      ) : usersList.map((u) => (
        <Card key={u.id} className={cn("p-4 card-border-animated", !u.isActive && "opacity-60")}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                {u.avatar ? <AvatarImage src={u.avatar} alt={u.name} /> : null}
                <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-muted-foreground">{u.email}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" aria-label={`Acciones para ${u.name}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleOpenEditModal(u)}>Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenChangeRoleDialog(u)} disabled={u.id === currentUser?.id}>Cambiar Rol</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setUserToToggleStatus(u)} disabled={u.id === currentUser?.id} className={cn(u.isActive ? 'text-destructive' : 'text-green-600')}>
                    {u.isActive ? 'Inactivar' : 'Activar'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm">
            <Badge variant={getRoleBadgeVariant(u.role)} className="capitalize">{getRoleInSpanish(u.role)}</Badge>
            <Badge variant={u.isActive ? 'default' : 'destructive'} className={cn(u.isActive && "bg-green-600 hover:bg-green-700")}>
                {u.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <p className="text-muted-foreground">Administra los usuarios de la plataforma NexusAlpri.</p>
        </div>
        <div className="flex flex-row flex-wrap items-center gap-2">
            <Button onClick={handleOpenAddModal}>
                <GradientIcon icon={PlusCircle} className="mr-2" size="sm"/> Añadir Nuevo Usuario
            </Button>
        </div>
      </div>

      <Card className="card-border-animated">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className='flex-grow'>
                <CardTitle>Lista de Usuarios</CardTitle>
                <CardDescription>Visualiza y gestiona todos los usuarios registrados.</CardDescription>
            </div>
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    type="search" 
                    id="user-search"
                    name="user-search"
                    placeholder="Buscar usuarios..." 
                    className="pl-8 w-full sm:w-[300px]" 
                    value={searchTerm}
                    onChange={handleSearchInputChange}
                />
            </div>
        </CardHeader>
        <CardContent>
          {error && !isLoading && ( 
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="font-semibold">Error al cargar usuarios</p>
              <p className="text-sm">{error}</p>
              <Button onClick={() => fetchUsers()} variant="outline" className="mt-4">Reintentar</Button>
            </div>
          )}
          {!error && (
            <>
              {isMobile ? <MobileUsersList /> : <DesktopUsersTable />}
              {!isLoading && usersList.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                      {searchTerm ? "No se encontraron usuarios que coincidan." : "No hay usuarios registrados."}
                  </p>
              )}
            </>
          )}
        </CardContent>
        {totalPages > 1 && (
            <CardFooter>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => (
                       <PaginationItem key={i}>
                         <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }} isActive={currentPage === i + 1}>
                           {i + 1}
                         </PaginationLink>
                       </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
            </CardFooter>
        )}
      </Card>
      
      <Dialog open={showAddEditModal} onOpenChange={(isOpen) => { setShowAddEditModal(isOpen); if (!isOpen) { setUserToEdit(null); resetFormFields(); } }}>
          <DialogContent className="w-[95vw] max-w-lg rounded-lg max-h-[90vh] flex flex-col">
              <form onSubmit={handleAddEditUser}>
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle>{userToEdit ? "Editar Usuario" : "Añadir Nuevo Usuario"}</DialogTitle>
                  <DialogDescription>
                    {userToEdit ? "Modifica los datos del usuario." : "Completa los campos para registrar un nuevo usuario."}
                  </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto px-6 py-4 thin-scrollbar">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" name="name" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nombre completo" required disabled={isProcessing} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="usuario@ejemplo.com" required disabled={isProcessing}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select name="role" value={editRole} onValueChange={(value) => setEditRole(value as UserRole)} required disabled={isProcessing}>
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
                    {!userToEdit && (
                      <div className="space-y-2">
                          <Label htmlFor="password">Contraseña</Label>
                          <div className="relative">
                            <Input 
                              id="password" 
                              name="password"
                              type={showPassword ? "text" : "password"}
                              value={editPassword} 
                              onChange={(e) => setEditPassword(e.target.value)} 
                              placeholder="Mínimo 8 caracteres" 
                              required 
                              disabled={isProcessing}
                            />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                            </Button>
                          </div>
                        </div>
                    )}
                    </div>
                </div>
                <DialogFooter className="p-6 pt-4 flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => { setShowAddEditModal(false); setUserToEdit(null); resetFormFields(); }} disabled={isProcessing}>Cancelar</Button>
                        <Button type="submit" disabled={isProcessing}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {userToEdit ? "Guardar Cambios" : "Crear Usuario"}
                        </Button>
                </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>

      <AlertDialog open={!!userToToggleStatus} onOpenChange={(open) => !open && setUserToToggleStatus(null)}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar acción?</AlertDialogTitle>
            <AlertDialogDescription>
              {`¿Estás seguro de que deseas ${userToToggleStatus?.isActive ? 'inactivar' : 'activar'} la cuenta de `}
              <strong>{userToToggleStatus?.name}</strong>?
              {userToToggleStatus?.isActive ? ' El usuario no podrá iniciar sesión.' : ' El usuario podrá volver a iniciar sesión.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <AlertDialogCancel disabled={isProcessing} onClick={() => setUserToToggleStatus(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleUserStatus} disabled={isProcessing} className={cn(userToToggleStatus?.isActive && buttonVariants({ variant: "destructive" }))}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Sí, {userToToggleStatus?.isActive ? 'inactivar' : 'activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showChangeRoleDialog} onOpenChange={(isOpen) => {
          setShowChangeRoleDialog(isOpen);
          if (!isOpen) setUserToChangeRole(null);
      }}>
          <DialogContent className="w-[95vw] max-w-sm">
              <form onSubmit={handleChangeUserRoleSubmit}>
                <DialogHeader>
                  <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
                  <DialogDescription>
                    Selecciona el nuevo rol para <strong>{userToChangeRole?.name}</strong>.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="user-name-role">Usuario</Label>
                        <Input id="user-name-role" value={userToChangeRole?.name || ''} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-role">Nuevo Rol</Label>
                        <Select name="new-role" value={selectedNewRole} onValueChange={(value) => setSelectedNewRole(value as UserRole)} required disabled={isProcessing}>
                            <SelectTrigger id="new-role">
                                <SelectValue placeholder="Seleccionar nuevo rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="STUDENT">Estudiante</SelectItem>
                                <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                                <SelectItem value="ADMINISTRATOR">Administrador</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => { setShowChangeRoleDialog(false); setUserToChangeRole(null); }} disabled={isProcessing}>Cancelar</Button>
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
