// src/app/(app)/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Edit3, Trash2, UserCog, Loader2, AlertTriangle, MoreHorizontal, Eye, EyeOff, UserCheck, UserX, Camera, Filter, X, Command as CommandIcon, Check, Network, GripVertical, Users as UsersIcon } from 'lucide-react';
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
import { SmartPagination } from '@/components/ui/pagination';
import { useTitle } from '@/contexts/title-context';
import { getInitials, getProcessColors } from '@/lib/utils';
import { getRoleBadgeVariant, getRoleInSpanish } from '@/lib/security-log-utils';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '@/components/ui/progress';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Identicon } from '@/components/ui/identicon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserProfileCard } from '@/components/profile/user-profile-card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- TYPES ---
interface ProcessWithLevel {
    id: string;
    name: string;
    level: number;
}
interface ProcessWithChildren {
  id: string;
  name: string;
  parentId: string | null;
  users: (Pick<User, 'id' | 'name' | 'avatar'>)[];
  children: ProcessWithChildren[];
}
interface UserWithProcesses extends User {
    processes: { id: string; name: string }[];
}

const PAGE_SIZE = 10;

// --- PROCESS MANAGEMENT COMPONENTS ---

const ProcessItem = ({ process, onEdit, onDelete, provided, isDragging }: { process: ProcessWithChildren, onEdit: (p: ProcessWithChildren) => void, onDelete: (p: ProcessWithChildren) => void, provided: any, isDragging: boolean }) => {
  const colors = getProcessColors(process.id);

  return (
    <div ref={provided.innerRef} {...provided.draggableProps}>
        <Card className={cn("mb-2 bg-card border-l-4", isDragging && 'opacity-50')} style={{ borderColor: colors.raw.medium }}>
            <CardHeader className="flex flex-row items-center justify-between p-3">
                <div className="flex items-center gap-2 flex-grow min-w-0">
                    <div {...provided.dragHandleProps} className="cursor-grab p-1 touch-none">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-sm font-medium truncate">{process.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 overflow-hidden">
                        {process.users.slice(0, 3).map(user => (
                            <Avatar key={user.id} className="h-7 w-7 border-2 border-background">
                                <AvatarImage src={user.avatar || undefined} />
                                <AvatarFallback><Identicon userId={user.id} /></AvatarFallback>
                            </Avatar>
                        ))}
                        {process.users.length > 3 && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold">
                                +{process.users.length - 3}
                            </div>
                        )}
                    </div>
                    <div className="flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(process)}><Edit3 className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(process)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                </div>
            </CardHeader>
             {process.children.length > 0 && (
                <CardContent className="pl-10 pb-2 space-y-2">
                    <Droppable droppableId={process.id} type="PROCESS">
                       {(droppableProvided) => (
                           <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
                               {process.children.map((child, index) => (
                                    <Draggable key={child.id} draggableId={child.id} index={index}>
                                      {(draggableProvided) => (
                                        <ProcessItem process={child} onEdit={onEdit} onDelete={onDelete} provided={draggableProvided} isDragging={false} />
                                      )}
                                    </Draggable>
                               ))}
                               {droppableProvided.placeholder}
                           </div>
                       )}
                    </Droppable>
                </CardContent>
            )}
        </Card>
    </div>
  );
};


// --- USER MANAGEMENT COMPONENTS ---

const ProcessSelector = ({
  allProcesses,
  selectedProcessIds,
  onSelectionChange,
  disabled
}: {
  allProcesses: ProcessWithLevel[],
  selectedProcessIds: Set<string>,
  onSelectionChange: (id: string, selected: boolean) => void,
  disabled: boolean
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedCount = selectedProcessIds.size;
  const triggerText = selectedCount > 0
    ? `${selectedCount} proceso(s) seleccionado(s)`
    : "Asignar procesos...";

  const filteredProcesses = useMemo(() => {
    return allProcesses.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [allProcesses, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">{triggerText}</span>
          <CommandIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar proceso..." value={search} onValueChange={setSearch}/>
          <CommandList>
            <CommandEmpty>No se encontraron procesos.</CommandEmpty>
            <CommandGroup>
              {filteredProcesses.map((process) => {
                const isSelected = selectedProcessIds.has(process.id);
                return (
                  <CommandItem
                    key={process.id}
                    onSelect={() => onSelectionChange(process.id, !isSelected)}
                    style={{ paddingLeft: `${process.level * 1.5 + 1}rem` }}
                  >
                    <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                        <Check className="h-4 w-4" />
                    </div>
                    <span>{process.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};


// --- MAIN PAGE ---

export default function UsersAndProcessesPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { setPageTitle } = useTitle();

  // State for Users
  const [usersList, setUsersList] = useState<UserWithProcesses[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userToEdit, setUserToEdit] = useState<UserWithProcesses | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(null);
  const [userToChangeRole, setUserToChangeRole] = useState<User | null>(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);
  const [showToggleStatusDialog, setShowToggleStatusDialog] = useState(false);
  
  // State for Processes
  const [processes, setProcesses] = useState<ProcessWithChildren[]>([]);
  const [flatProcesses, setFlatProcesses] = useState<ProcessWithLevel[]>([]);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [editingProcess, setEditingProcess] = useState<ProcessWithChildren | null>(null);
  const [processToDelete, setProcessToDelete] = useState<ProcessWithChildren | null>(null);
  
  // General State
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDraggableId, setActiveDraggableId] = useState<string | null>(null);

  // Search & Filter State
  const searchTerm = searchParams.get('search') || '';
  const roleFilter = searchParams.get('role') || 'all';
  const statusFilter = searchParams.get('status') || 'all';
  const currentPage = Number(searchParams.get('page')) || 1;
  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

  // Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('STUDENT');
  const [editPassword, setEditPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>('STUDENT');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null | undefined>(null);
  const [editProcessIds, setEditProcessIds] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Process Form State
  const [processName, setProcessName] = useState('');
  const [processParentId, setProcessParentId] = useState<string | null>(null);
  const [usersToAssign, setUsersToAssign] = useState<Set<string>>(new Set());
  const [userSearchTerm, setUserSearchTerm] = useState('');

  useEffect(() => {
    setPageTitle('Usuarios y Procesos');
  }, [setPageTitle]);
  
  // --- DATA FETCHING ---
  const fetchAllData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    const userParams = new URLSearchParams(searchParams.toString());
    
    try {
      const [usersRes, processesRes, flatProcessesRes] = await Promise.all([
        fetch(`/api/users?${userParams.toString()}`),
        fetch('/api/processes'),
        fetch('/api/processes?format=flat'),
      ]);
      
      const usersData = await usersRes.json();
      const hierarchicalProcessesData = await processesRes.json();
      const flatProcessesData = await flatProcessesRes.json();

      setUsersList(usersData.users || []);
      setTotalUsers(usersData.totalUsers || 0);
      setProcesses(hierarchicalProcessesData || []);
      setFlatProcesses(flatProcessesData || []);

    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error al cargar datos", description: err.message, variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, searchParams, toast]);
  
  useEffect(() => {
    if (currentUser?.role !== 'ADMINISTRATOR' && currentUser) {
      router.push('/dashboard');
      return;
    }
    fetchAllData();
  }, [currentUser, router, fetchAllData, searchParams]);
  
  // --- HANDLERS ---
  const handleOpenAddModal = () => {
    setUserToEdit(null);
    setEditName('');
    setEditEmail('');
    setEditRole('STUDENT');
    setEditPassword('');
    setEditAvatarUrl(null);
    setEditProcessIds(new Set());
    setShowAddEditModal(true);
  };
  
  const handleOpenEditModal = (user: UserWithProcesses) => {
    setUserToEdit(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPassword('');
    setEditAvatarUrl(user.avatar);
    setEditProcessIds(new Set(user.processes.map(p => p.id)));
    setShowAddEditModal(true);
  };
  
   const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const endpoint = userToEdit ? `/api/users/${userToEdit.id}` : '/api/users';
    const method = userToEdit ? 'PUT' : 'POST';

    const payload: any = {
      name: editName,
      email: editEmail,
      role: editRole,
      processIds: Array.from(editProcessIds),
    };
    if (editPassword) {
      payload.password = editPassword;
    }
    if (editAvatarUrl) {
      payload.avatar = editAvatarUrl;
    }

    try {
        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'No se pudo guardar el usuario.');
        }

        toast({ title: "¡Éxito!", description: `Usuario ${userToEdit ? 'actualizado' : 'creado'} correctamente.` });
        setShowAddEditModal(false);
        await fetchAllData();

    } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
        setIsProcessing(false);
    }
  };


  const handleToggleStatusSubmit = async () => {
      if (!userToToggleStatus) return;
      setIsProcessing(true);
      try {
          const response = await fetch(`/api/users/${userToToggleStatus.id}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isActive: !userToToggleStatus.isActive }),
          });
          if (!response.ok) throw new Error((await response.json()).message || 'No se pudo actualizar el estado.');
          
          toast({ title: "Estado Actualizado" });
          await fetchAllData();
          
      } catch (err: any) {
          toast({ title: 'Error', description: err.message, variant: 'destructive'});
      } finally {
          setIsProcessing(false);
          setShowToggleStatusDialog(false);
          setUserToToggleStatus(null);
      }
  };

  const handleChangeRoleSubmit = async () => {
    if (!userToChangeRole) return;
    setIsProcessing(true);
    try {
        const response = await fetch(`/api/users/${userToChangeRole.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: selectedNewRole }),
        });
        if (!response.ok) throw new Error((await response.json()).message || 'No se pudo cambiar el rol.');
        
        toast({ title: "Rol Cambiado", description: `El rol de ${userToChangeRole.name} ha sido actualizado.` });
        await fetchAllData();

    } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive'});
    } finally {
        setIsProcessing(false);
        setShowChangeRoleDialog(false);
        setUserToChangeRole(null);
    }
  };
  
  const createQueryString = useCallback((paramsToUpdate: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(paramsToUpdate).forEach(([name, value]) => {
          if (value === null || value === '' || value === 'all') {
              params.delete(name);
          } else {
              params.set(name, String(value));
          }
      });
      return params.toString()
    },
    [searchParams]
  );
  
  const handleFilterChange = (filterType: 'search' | 'role' | 'status', value: string) => {
    const newQueryString = createQueryString({ [filterType]: value, page: 1 });
    router.push(`${pathname}?${newQueryString}`);
  };

  const handlePageChange = (page: number) => {
      const newQueryString = createQueryString({ page });
      router.push(`${pathname}?${newQueryString}`);
  };

  const handleOpenProcessModal = (process: ProcessWithChildren | null) => {
      if (process) {
          setEditingProcess(process);
          setProcessName(process.name);
          setProcessParentId(process.parentId);
          setUsersToAssign(new Set(process.users.map(u => u.id)))
      } else {
          setEditingProcess(null);
          setProcessName('');
          setProcessParentId(null);
          setUsersToAssign(new Set())
      }
      setShowProcessModal(true);
  };
  
  const handleProcessFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const processPayload = {
        name: processName,
        parentId: processParentId === 'null' ? null : processParentId,
    };
    
    let endpoint = '/api/processes';
    let method = 'POST';

    if (editingProcess) {
        endpoint = `/api/processes/${editingProcess.id}`;
        method = 'PUT';
    }

    try {
        const processRes = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(processPayload),
        });

        if (!processRes.ok) {
            throw new Error((await processRes.json()).message || 'Error al guardar el proceso.');
        }
        
        const savedProcess = await processRes.json();
        const processId = savedProcess.id;

        if (usersToAssign.size > 0) {
            const assignRes = await fetch('/api/processes/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ processId, userIds: Array.from(usersToAssign) }),
            });
            if (!assignRes.ok) {
                throw new Error((await assignRes.json()).message || 'Error al asignar usuarios al proceso');
            }
        }

        toast({ title: '¡Éxito!', description: `Proceso ${editingProcess ? 'actualizado' : 'creado'} y usuarios asignados.`});
        setShowProcessModal(false);
        await fetchAllData();

    } catch (err) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
        setIsProcessing(false);
    }
  };


  const handleDeleteProcess = async () => {
    if (!processToDelete) return;
    setIsProcessing(true);
    try {
        const response = await fetch(`/api/processes/${processToDelete.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).message || 'Error al eliminar el proceso.');
        toast({ title: 'Proceso Eliminado' });
        setProcessToDelete(null);
        await fetchAllData();
    } catch(err) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
    } finally {
        setIsProcessing(false);
    }
  }

  const handleOnDragEnd = (result: DropResult) => {
    setActiveDraggableId(null);
  };

  const UserListContent = () => (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className='flex-grow'>
              <CardTitle>Lista de Usuarios</CardTitle>
              <CardDescription>Visualiza y gestiona todos los usuarios registrados.</CardDescription>
          </div>
           <Button onClick={handleOpenAddModal}>
              <PlusCircle className="mr-2 h-4 w-4"/> Añadir Usuario
          </Button>
      </CardHeader>
      <CardContent>
         <div className="w-full flex flex-col sm:flex-row gap-2 mb-4">
            <Select value={roleFilter} onValueChange={(v) => handleFilterChange('role', v)}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filtrar por rol..." /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos los Roles</SelectItem><SelectItem value="ADMINISTRATOR">Administradores</SelectItem><SelectItem value="INSTRUCTOR">Instructores</SelectItem><SelectItem value="STUDENT">Estudiantes</SelectItem></SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filtrar por estado..." /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos los Estados</SelectItem><SelectItem value="active">Activos</SelectItem><SelectItem value="inactive">Inactivos</SelectItem></SelectContent>
            </Select>
             <div className="relative w-full sm:w-auto flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar por nombre o email..." className="pl-8 w-full" value={searchTerm} onChange={(e) => handleFilterChange('search', e.target.value)} />
          </div>
          </div>
          <div className="overflow-x-auto">
               <Table>
                  <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Rol</TableHead><TableHead>Estado</TableHead><TableHead><span className="sr-only">Acciones</span></TableHead></TableRow></TableHeader>
                  <TableBody>
                      {isLoading ? [...Array(5)].map((_,i) => (<TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>)) :
                       usersList.map(u => (
                           <TableRow key={u.id} className={cn(!u.isActive && "opacity-60")}>
                                <TableCell>
                                  <Popover><PopoverTrigger asChild><div className="flex items-center gap-3 cursor-pointer group"><Avatar className="h-9 w-9"><AvatarImage src={u.avatar || undefined} alt={u.name} /><AvatarFallback>{getInitials(u.name)}</AvatarFallback></Avatar><div className="font-medium flex items-center gap-1.5 group-hover:underline">{u.name}<VerifiedBadge role={u.role}/></div></div></PopoverTrigger><PopoverContent className="w-80 p-0"><UserProfileCard user={u} /></PopoverContent></Popover>
                                </TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell><Badge variant={getRoleBadgeVariant(u.role)} className="capitalize">{getRoleInSpanish(u.role)}</Badge></TableCell>
                                <TableCell><Badge variant={u.isActive ? 'default' : 'destructive'} className={cn(u.isActive && "bg-green-600 hover:bg-green-700")}>{u.isActive ? 'Activo' : 'Inactivo'}</Badge></TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Acciones</span></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                          <DropdownMenuItem onSelect={() => handleOpenEditModal(u)}>Editar</DropdownMenuItem>
                                          <DropdownMenuItem onSelect={() => { setUserToChangeRole(u); setSelectedNewRole(u.role); setShowChangeRoleDialog(true); }}>Cambiar Rol</DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onSelect={() => { setUserToToggleStatus(u); setShowToggleStatusDialog(true);}} className={cn(u.isActive ? "text-destructive focus:text-destructive-foreground focus:bg-destructive" : "text-green-600 focus:bg-green-500 focus:text-white")}>{u.isActive ? 'Inactivar' : 'Activar'}</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                           </TableRow>
                       ))}
                  </TableBody>
               </Table>
           </div>
      </CardContent>
      {totalPages > 1 && !isLoading && (
          <CardFooter>
              <SmartPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </CardFooter>
      )}
   </Card>
  );

  const MobileUserCard = ({ user, onEdit, onChangeRole, onToggleStatus }: { user: UserWithProcesses, onEdit: (u: UserWithProcesses) => void, onChangeRole: () => void, onToggleStatus: () => void }) => (
    <Card className={cn("p-3 flex gap-3 items-start", !user.isActive && "opacity-60")}>
        <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar || undefined} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold flex items-center gap-1.5">{user.name} <VerifiedBadge role={user.role} /></p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8 -mt-1"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onEdit(user)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onSelect={onChangeRole}>Cambiar Rol</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={onToggleStatus} className={cn(user.isActive ? "text-destructive focus:bg-destructive/10" : "text-green-600 focus:bg-green-500 focus:text-white")}>{user.isActive ? 'Inactivar' : 'Activar'}</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="mt-2 flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">{getRoleInSpanish(user.role)}</Badge>
                <Badge variant={user.isActive ? 'default' : 'destructive'} className={cn(user.isActive && "bg-green-600 hover:bg-green-700")}>{user.isActive ? 'Activo' : 'Inactivo'}</Badge>
            </div>
             {user.processes && user.processes.length > 0 && (
                <div className="mt-2 border-t pt-2">
                    <div className="flex flex-wrap gap-1.5">
                        {user.processes.map(p => {
                           const colors = getProcessColors(p.id);
                           return (
                               <Badge key={p.id} variant="secondary" style={{ backgroundColor: colors.raw.light, color: colors.raw.dark, borderColor: colors.raw.medium }} className="border">
                                   {p.name}
                               </Badge>
                           )
                        })}
                    </div>
                </div>
            )}
        </div>
    </Card>
  );

  const ProcessManagement = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2"><Network /> Estructura Organizacional</CardTitle>
          <CardDescription>Crea y organiza los procesos.</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => handleOpenProcessModal(null)}><PlusCircle className="mr-2 h-4 w-4" />Crear</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (<Skeleton className="h-64 w-full" />) : error ? (<p className="text-destructive text-center">{error}</p>) : (
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="processes-droppable" type="PROCESS">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {processes.map((process, index) => (
                    <Draggable key={process.id} draggableId={process.id} index={index}>
                      {(provided, snapshot) => (
                        <ProcessItem process={process} onEdit={handleOpenProcessModal} onDelete={setProcessToDelete} provided={provided} isDragging={snapshot.isDragging}/>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </CardContent>
    </Card>
  );

  if (currentUser?.role !== 'ADMINISTRATOR') return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <>
      <div className="space-y-8">
          <div className="flex items-center justify-between">
              <p className="text-muted-foreground">Gestiona los usuarios y la estructura de procesos de la organización.</p>
          </div>
          
          {/* Mobile View */}
          <div className="lg:hidden">
             <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="users">Usuarios</TabsTrigger>
                    <TabsTrigger value="processes">Procesos</TabsTrigger>
                </TabsList>
                <TabsContent value="users" className="mt-4 space-y-2">
                  {isLoading ? [...Array(3)].map((_,i) => <Skeleton key={i} className="h-32 w-full mb-2" />) :
                   usersList.map(u => (
                     <MobileUserCard key={u.id} user={u} onEdit={handleOpenEditModal} onChangeRole={() => { setUserToChangeRole(u); setSelectedNewRole(u.role); setShowChangeRoleDialog(true); }} onToggleStatus={() => { setUserToToggleStatus(u); setShowToggleStatusDialog(true);}} />
                   ))}
                </TabsContent>
                <TabsContent value="processes" className="mt-4"><ProcessManagement/></TabsContent>
             </Tabs>
          </div>

          {/* Desktop View */}
          <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
               <div className="lg:col-span-2"><UserListContent/></div>
               <div className="lg:col-span-1"><ProcessManagement/></div>
          </div>
      </div>
      
      <Dialog open={showAddEditModal} onOpenChange={setShowAddEditModal}>
          <DialogContent className="sm:max-w-md">
              <form onSubmit={handleUserFormSubmit}>
                  <DialogHeader><DialogTitle>{userToEdit ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}</DialogTitle><DialogDescription>Completa la información del usuario.</DialogDescription></DialogHeader>
                  <div className="py-4 space-y-4">
                      <div className="space-y-2"><Label htmlFor="name">Nombre</Label><Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} required disabled={isProcessing} /></div>
                      <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required disabled={isProcessing}/></div>
                      <div className="space-y-2"><Label htmlFor="password">{userToEdit ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}</Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} value={editPassword} onChange={(e) => setEditPassword(e.target.value)} required={!userToEdit} disabled={isProcessing}/><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff/> : <Eye/>}</Button></div></div>
                      <div className="space-y-2"><Label htmlFor="role">Rol</Label><Select value={editRole} onValueChange={(value: UserRole) => setEditRole(value)} disabled={isProcessing}><SelectTrigger id="role"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="STUDENT">Estudiante</SelectItem><SelectItem value="INSTRUCTOR">Instructor</SelectItem><SelectItem value="ADMINISTRATOR">Administrador</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label htmlFor="processes">Procesos</Label><ProcessSelector allProcesses={flatProcesses} selectedProcessIds={editProcessIds} onSelectionChange={(id, selected) => setEditProcessIds(prev => { const newSet = new Set(prev); if (selected) newSet.add(id); else newSet.delete(id); return newSet; })} disabled={isProcessing}/></div>
                  </div>
                  <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setShowAddEditModal(false)}>Cancelar</Button>
                      <Button type="submit" disabled={isProcessing}>{isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}{userToEdit ? 'Guardar Cambios' : 'Crear Usuario'}</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
      
       <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
            <DialogContent className="max-w-lg">
                <form onSubmit={handleProcessFormSubmit}>
                    <DialogHeader>
                        <DialogTitle>{editingProcess ? 'Editar Proceso' : 'Crear Nuevo Proceso'}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <Label htmlFor="process-name">Nombre del Proceso</Label>
                            <Input id="process-name" value={processName} onChange={(e) => setProcessName(e.target.value)} required disabled={isProcessing}/>
                        </div>
                        <div>
                            <Label htmlFor="parent-process">Proceso Padre (Opcional)</Label>
                            <Select value={processParentId || 'null'} onValueChange={(value) => setProcessParentId(value)} disabled={isProcessing}>
                            <SelectTrigger id="parent-process"><SelectValue placeholder="Seleccionar proceso padre..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="null">Ninguno (Nivel Superior)</SelectItem>
                                {flatProcesses.filter(p => p.id !== editingProcess?.id).map(p => (
                                    <SelectItem key={p.id} value={p.id} style={{ paddingLeft: `${p.level * 1.5 + 1}rem`}}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Asignar Usuarios</Label>
                            <Input placeholder="Buscar usuarios..." value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} />
                            <ScrollArea className="h-48 border rounded-md p-2">
                                <div className="space-y-1">
                                {usersList.filter(u => u.name.toLowerCase().includes(userSearchTerm.toLowerCase())).map(u => (
                                    <div key={u.id} className="flex items-center space-x-2">
                                        <Checkbox id={`assign-user-${u.id}`} checked={usersToAssign.has(u.id)} onCheckedChange={checked => {
                                            setUsersToAssign(prev => {
                                                const newSet = new Set(prev);
                                                if(checked) newSet.add(u.id); else newSet.delete(u.id);
                                                return newSet;
                                            })
                                        }}/>
                                        <Label htmlFor={`assign-user-${u.id}`} className="font-normal">{u.name}</Label>
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                            <p className="text-xs text-muted-foreground">{usersToAssign.size} usuario(s) seleccionado(s) para asignar.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setShowProcessModal(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isProcessing || !processName.trim()}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {editingProcess ? 'Guardar Cambios' : 'Crear Proceso'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    
    <AlertDialog open={!!processToDelete} onOpenChange={(open) => !open && setProcessToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                <AlertDialogDescription>
                    Se eliminará el proceso "<strong>{processToDelete?.name}</strong>". Si tiene subprocesos, estos quedarán en el nivel superior. Los usuarios asignados quedarán sin proceso.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProcess} disabled={isProcessing} className={cn(buttonVariants({ variant: 'destructive' }))}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Eliminar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    
    <AlertDialog open={showToggleStatusDialog} onOpenChange={setShowToggleStatusDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar acción?</AlertDialogTitle>
                <AlertDialogDescription>
                    Vas a {userToToggleStatus?.isActive ? 'inactivar' : 'activar'} la cuenta de <strong>{userToToggleStatus?.name}</strong>. Un usuario inactivo no podrá iniciar sesión.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleToggleStatusSubmit} disabled={isProcessing} className={cn(userToToggleStatus?.isActive && buttonVariants({ variant: "destructive" }))}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Sí, {userToToggleStatus?.isActive ? 'Inactivar' : 'Activar'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <Dialog open={showChangeRoleDialog} onOpenChange={setShowChangeRoleDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Cambiar Rol</DialogTitle>
                <DialogDescription>Selecciona el nuevo rol para <strong>{userToChangeRole?.name}</strong>.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Select value={selectedNewRole} onValueChange={(value: UserRole) => setSelectedNewRole(value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="STUDENT">Estudiante</SelectItem>
                        <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                        <SelectItem value="ADMINISTRATOR">Administrador</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setShowChangeRoleDialog(false)}>Cancelar</Button>
                <Button onClick={handleChangeRoleSubmit} disabled={isProcessing || selectedNewRole === userToChangeRole?.role}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Guardar Rol
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
