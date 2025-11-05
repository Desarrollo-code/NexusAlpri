// src/app/(app)/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, List, Grid, Filter, UserPlus, MoreVertical, Loader2, Briefcase, MessageSquare, Edit, Trash2, UserCog, UserX, Users as UsersIcon, Key } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { User, UserRole, Process } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { SmartPagination } from '@/components/ui/pagination';
import { useTitle } from '@/contexts/title-context';
import { DndContext, useDraggable, DragOverlay, type DragEndEvent, type Active, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { UserFormModal } from '@/components/users/user-form-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDebounce } from '@/hooks/use-debounce';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle } from 'lucide-react';
import { ProcessTree } from '@/components/users/process-tree';
import { BulkAssignModal } from '@/components/users/bulk-assign-modal';
import { AnimatePresence, motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserProfileCard } from '@/components/users/user-profile-card';
import { getRoleInSpanish, getRoleBadgeVariant } from '@/lib/security-log-utils';
import { getProcessColors } from '@/lib/utils';
import { Identicon } from '@/components/ui/identicon';
import { EmptyState } from '@/components/empty-state';
import { ChatPermissionsModal } from '@/components/users/chat-permissions-modal';


// --- TYPES & CONTEXT ---
interface ProcessWithChildren extends Process {
    users: (Pick<User, 'id' | 'name' | 'avatar'>)[];
    children: ProcessWithChildren[];
}
interface UserWithProcess extends User {
    process: { id: string; name: string } | null;
}

const PAGE_SIZE = 15;

const DraggableUserPreview = ({ user }: { user: UserWithProcess }) => (
    <Card className="flex items-center gap-2 p-2 shadow-lg w-48">
        <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback><Identicon userId={user.id}/></AvatarFallback>
        </Avatar>
        <span className="font-semibold text-sm truncate">{user.name}</span>
    </Card>
);

const DraggableUserCard = ({ user, isSelected, onSelectionChange, onEdit, onRoleChange, onStatusChange, onChatPermissions }: { 
    user: UserWithProcess, 
    isSelected: boolean, 
    onSelectionChange: (id: string, selected: boolean) => void,
    onEdit: (user: User) => void,
    onRoleChange: (user: User) => void,
    onStatusChange: (user: User, status: boolean) => void,
    onChatPermissions: (user: User) => void
}) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: user.id });
    
    return (
        <div ref={setNodeRef} {...attributes} {...listeners} className={cn("touch-none", isDragging && "opacity-50")}>
            <div className="relative">
                <UserProfileCard 
                    user={user}
                    onEdit={onEdit}
                    onRoleChange={onRoleChange}
                    onStatusChange={onStatusChange}
                    onChatPermissions={onChatPermissions}
                />
                 <div className="absolute top-2 left-2 z-20">
                    <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelectionChange(user.id, !!checked)} className="bg-background border-primary" />
                </div>
            </div>
        </div>
    )
}

const UserTable = ({ users, onSelectionChange, selectedUserIds, onEdit, onRoleChange, onStatusChange, onChatPermissions }: { 
    users: UserWithProcess[], 
    onSelectionChange: (id: string, selected: boolean) => void, 
    selectedUserIds: Set<string>,
    onEdit: (user: User) => void,
    onRoleChange: (user: User) => void,
    onStatusChange: (user: User, status: boolean) => void,
    onChatPermissions: (user: User) => void
}) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <div className="space-y-3">
                {users.map(user => {
                    const processColors = user.process ? getProcessColors(user.process.id) : null;
                    return (
                        <Card key={user.id} className="p-3 overflow-hidden">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    className="mt-1"
                                    checked={selectedUserIds.has(user.id)}
                                    onCheckedChange={(checked) => onSelectionChange(user.id, !!checked)}
                                />
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.avatar || undefined} />
                                    <AvatarFallback><Identicon userId={user.id}/></AvatarFallback>
                                </Avatar>
                                <div className="flex-grow overflow-hidden">
                                    <p className="font-semibold truncate">{user.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                     <div className="flex items-center flex-wrap gap-1.5 mt-2">
                                        <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">{getRoleInSpanish(user.role)}</Badge>
                                        {user.process && processColors && (
                                            <Badge 
                                                className="text-xs"
                                                style={{
                                                    backgroundColor: processColors.raw.light,
                                                    color: processColors.raw.dark,
                                                }}
                                            >
                                                {user.process.name}
                                            </Badge>
                                        )}
                                     </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 flex-shrink-0"><MoreVertical className="h-4 w-4"/></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => onEdit(user)}><Edit className="mr-2 h-4 w-4"/>Editar Perfil</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onChatPermissions(user)}><Key className="mr-2 h-4 w-4"/>Permisos de Chat</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onRoleChange(user)}><UserCog className="mr-2 h-4 w-4"/>Cambiar Rol</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onStatusChange(user, !user.isActive)} className={user.isActive ? "text-destructive" : ""}><UserX className="mr-2 h-4 w-4"/>{user.isActive ? 'Inactivar' : 'Activar'}</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </Card>
                    );
                })}
            </div>
        )
    }

    return (
         <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox 
                                checked={users.length > 0 && users.every(u => selectedUserIds.has(u.id))}
                                onCheckedChange={(checked) => {
                                    onSelectionChange('all', !!checked);
                                }}
                            />
                        </TableHead>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Proceso</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => {
                        const processColors = user.process ? getProcessColors(user.process.id) : null;
                        return (
                        <TableRow key={user.id}>
                            <TableCell>
                                <Checkbox
                                    checked={selectedUserIds.has(user.id)}
                                    onCheckedChange={(checked) => onSelectionChange(user.id, !!checked)}
                                />
                            </TableCell>
                            <TableCell>
                                 <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.avatar || undefined} />
                                        <AvatarFallback><Identicon userId={user.id}/></AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell><Badge variant={getRoleBadgeVariant(user.role)}>{getRoleInSpanish(user.role)}</Badge></TableCell>
                            <TableCell>
                                {user.process && processColors ? (
                                    <Badge 
                                        className="text-xs"
                                        style={{
                                            backgroundColor: processColors.raw.light,
                                            color: processColors.raw.dark,
                                        }}
                                    >
                                        {user.process.name}
                                    </Badge>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Sin asignar</span>
                                )}
                            </TableCell>
                            <TableCell><Badge variant={user.isActive ? "default" : "secondary"} className={cn("text-xs py-0.5 px-1.5", user.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300")}>{user.isActive ? 'Activo' : 'Inactivo'}</Badge></TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => onEdit(user)}><Edit className="mr-2 h-4 w-4"/>Editar Perfil</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onChatPermissions(user)}><Key className="mr-2 h-4 w-4"/>Permisos de Chat</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onRoleChange(user)}><UserCog className="mr-2 h-4 w-4"/>Cambiar Rol</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onStatusChange(user, !user.isActive)} className={user.isActive ? "text-destructive" : ""}>
                                            <UserX className="mr-2 h-4 w-4"/>{user.isActive ? 'Inactivar' : 'Activar'}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )})}
                </TableBody>
            </Table>
        </Card>
    );
};

// --- MAIN PAGE COMPONENT ---
function UsersPageComponent() {
    const { user: currentUser, settings } = useAuth();
    const { setPageTitle } = useTitle();
    const isMobile = useIsMobile();

    const [allUsers, setAllUsers] = useState<UserWithProcess[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [processes, setProcesses] = useState<ProcessWithChildren[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userForChatPermissions, setUserForChatPermissions] = useState<User | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    
    const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
    const [isDeactivating, setIsDeactivating] = useState(false);
    
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL' | null>((searchParams.get('role') as UserRole | 'ALL') || null);
    const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'ALL' | null>((searchParams.get('status') as 'active' | 'inactive' | 'ALL') || null);
    const [processFilter, setProcessFilter] = useState<string | null>(searchParams.get('processId'));
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const currentPage = Number(searchParams.get('page')) || 1;
    
    const [activeDraggable, setActiveDraggable] = useState<Active | null>(null);
    const draggedUser = useMemo(() => {
        if (!activeDraggable) return null;
        return allUsers.find(u => u.id === activeDraggable.id)
    }, [activeDraggable, allUsers]);

    const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 10, }, }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5, }, }));
    
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
    
    const activeFiltersCount = useMemo(() => {
        return [debouncedSearchTerm, roleFilter, statusFilter, processFilter].filter(v => v && v !== 'ALL' && v !== null).length;
    }, [debouncedSearchTerm, roleFilter, statusFilter, processFilter]);

    const fetchData = useCallback(async (page: number) => {
        if (!currentUser) return;
        setIsLoading(true);
        
        const params = new URLSearchParams();
        if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
        if (page) params.set('page', String(page));
        if(roleFilter && roleFilter !== 'ALL') params.set('role', roleFilter);
        if(statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter);
        if(processFilter) params.set('processId', processFilter);
        params.set('pageSize', String(PAGE_SIZE));

        try {
            const [usersRes, processesRes] = await Promise.all([
                fetch(`/api/users?${params.toString()}`),
                fetch('/api/processes'),
            ]);
            
            if(!usersRes.ok) throw new Error("Failed to fetch users");
            if(!processesRes.ok) throw new Error("Failed to fetch processes");

            const usersData = await usersRes.json();
            const processesData = await processesRes.json();
            
            setAllUsers(usersData.users || []);
            setTotalUsers(usersData.totalUsers || 0);
            setProcesses(processesData || []);
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, debouncedSearchTerm, roleFilter, statusFilter, processFilter, toast]);
    
    useEffect(() => {
        setPageTitle('Control Central');
        if (currentUser?.role !== 'ADMINISTRATOR') return;
        fetchData(currentPage);
    }, [currentUser, fetchData, setPageTitle, currentPage]);

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(newPage));
        router.push(`${pathname}?${params.toString()}`);
    };

    const totalPages = Math.ceil(totalUsers / PAGE_SIZE);
    
    const handleFilterChange = useCallback((key: 'search' | 'role' | 'status' | 'processId', value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === null || value === 'ALL') {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        params.set('page', '1'); // Reset to first page on filter change
        router.push(`${pathname}?${params.toString()}`);
    }, [pathname, router, searchParams]);

    useEffect(() => {
        handleFilterChange('search', debouncedSearchTerm);
    }, [debouncedSearchTerm, handleFilterChange]);
    

    const handleSelectionChange = useCallback((userId: string, isSelected: boolean) => {
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            if (userId === 'all') {
                const pageUserIds = allUsers.map(u => u.id);
                if (isSelected) {
                    pageUserIds.forEach(id => newSet.add(id));
                } else {
                    pageUserIds.forEach(id => newSet.delete(id));
                }
            } else {
                if (isSelected) newSet.add(userId);
                else newSet.delete(id);
            }
            return newSet;
        });
    }, [allUsers]);

    const handleOpenUserModal = (user: User | null = null) => {
        setUserToEdit(user);
        setShowUserModal(true);
    };
    
    const handleStatusChange = (user: User, newStatus: boolean) => {
        if(user.id === currentUser?.id) {
            toast({ title: "Acción no permitida", description: "No puedes inactivar tu propia cuenta.", variant: "destructive" });
            return;
        }
        setUserToDeactivate(user);
    }
    
    const confirmStatusChange = async () => {
        if (!userToDeactivate) return;
        setIsDeactivating(true);
        try {
            const res = await fetch(`/api/users/${userToDeactivate.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !userToDeactivate.isActive }),
            });
            if (!res.ok) throw new Error("No se pudo cambiar el estado del usuario.");
            toast({ title: 'Estado Actualizado', description: `El usuario ${userToDeactivate.name} ha sido ${!userToDeactivate.isActive ? 'activado' : 'inactivado'}.`});
            fetchData(currentPage);
        } catch(err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
        } finally {
            setIsDeactivating(false);
            setUserToDeactivate(null);
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveDraggable(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        
        const userId = active.id as string;
        const targetProcessId = over.id as string;

        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ processId: targetProcessId === 'unassigned' ? null : targetProcessId }),
            });
            if (!res.ok) throw new Error("No se pudo asignar el proceso.");
            
            toast({ title: "Usuario Asignado", description: "El colaborador ha sido movido al nuevo proceso."});
            fetchData(currentPage);
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
        }
    };
    
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

    if (!currentUser || (currentUser.role !== 'ADMINISTRATOR')) {
        return <div className="text-center p-8"><AlertTriangle className="mx-auto h-12 w-12 text-destructive"/>Acceso Denegado</div>;
    }

    if (isLoading && allUsers.length === 0) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }
    
    const DesktopControls = () => (
         <div className="flex items-center justify-between gap-4">
            <div className="relative flex-grow max-w-xs">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input placeholder="Buscar por nombre o email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
            </div>
             <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" />
                            Filtros ({activeFiltersCount})
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="end">
                        <div className="p-4 space-y-4">
                             <div className="space-y-2"><Label>Rol</Label><Select value={roleFilter || 'ALL'} onValueChange={(v) => {setRoleFilter(v as UserRole | 'ALL'); handleFilterChange('role',v);}}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="ADMINISTRATOR">Admin</SelectItem><SelectItem value="INSTRUCTOR">Instructor</SelectItem><SelectItem value="STUDENT">Estudiante</SelectItem></SelectContent></Select></div>
                             <div className="space-y-2"><Label>Estado</Label><Select value={statusFilter || 'ALL'} onValueChange={(v) => {setStatusFilter(v as 'active'|'inactive'|'ALL'); handleFilterChange('status',v);}}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="active">Activo</SelectItem><SelectItem value="inactive">Inactivo</SelectItem></SelectContent></Select></div>
                             <div className="space-y-2"><Label>Proceso</Label><Select value={processFilter || 'ALL'} onValueChange={(v) => {setProcessFilter(v); handleFilterChange('processId',v);}}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="unassigned">Sin Asignar</SelectItem><Separator/>{flattenedProcesses.map(p => (<SelectItem key={p.id} value={p.id} style={{ paddingLeft: `${p.level * 1.5 + 1}rem` }}>{p.name}</SelectItem>))}</SelectContent></Select></div>
                        </div>
                    </PopoverContent>
                </Popover>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            {viewMode === 'grid' ? <Grid className="mr-2 h-4 w-4" /> : <List className="mr-2 h-4 w-4" />}
                            Vista
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setViewMode('grid')}><Grid className="mr-2 h-4 w-4"/>Cuadrícula</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setViewMode('table')}><List className="mr-2 h-4 w-4"/>Tabla</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => handleOpenUserModal(null)}>
                    <UserPlus className="mr-2 h-4 w-4"/>Añadir Colaborador
                </Button>
             </div>
        </div>
    );

    const MobileControls = () => (
         <Card>
            <CardContent className="p-4 space-y-4">
                <div className="relative w-full">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input placeholder="Buscar por nombre o email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
                </div>
                 <div className="grid grid-cols-2 gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                                <Filter className="mr-2 h-4 w-4" />
                                Filtros ({activeFiltersCount})
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0" align="start">
                            <div className="p-4 space-y-4">
                                <div className="space-y-2"><Label>Rol</Label><Select value={roleFilter || 'ALL'} onValueChange={(v) => {setRoleFilter(v as UserRole | 'ALL'); handleFilterChange('role',v);}}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="ADMINISTRATOR">Admin</SelectItem><SelectItem value="INSTRUCTOR">Instructor</SelectItem><SelectItem value="STUDENT">Estudiante</SelectItem></SelectContent></Select></div>
                                 <div className="space-y-2"><Label>Estado</Label><Select value={statusFilter || 'ALL'} onValueChange={(v) => {setStatusFilter(v as 'active'|'inactive'|'ALL'); handleFilterChange('status',v);}}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="active">Activo</SelectItem><SelectItem value="inactive">Inactivo</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label>Proceso</Label><Select value={processFilter || 'ALL'} onValueChange={(v) => {setProcessFilter(v); handleFilterChange('processId',v);}}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="unassigned">Sin Asignar</SelectItem><Separator/>{flattenedProcesses.map(p => (
                                    <SelectItem key={p.id} value={p.id} style={{ paddingLeft: `${p.level * 1.5 + 1}rem` }}>{p.name}</SelectItem>
                                ))}</SelectContent></Select></div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                                {viewMode === 'grid' ? <Grid className="mr-2 h-4 w-4" /> : <List className="mr-2 h-4 w-4" />}
                                Vista
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setViewMode('grid')}><Grid className="mr-2 h-4 w-4"/>Cuadrícula</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setViewMode('table')}><List className="mr-2 h-4 w-4"/>Tabla</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button onClick={() => handleOpenUserModal(null)} className="w-full"><UserPlus className="mr-2 h-4 w-4"/>Añadir</Button>
            </CardFooter>
        </Card>
    );
    
    const BulkActionsBar = () => {
        if (selectedUserIds.size === 0) return null;

        return (
             <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-background border rounded-lg shadow-lg">
                <p className="px-2 text-sm font-semibold">{selectedUserIds.size} seleccionado(s)</p>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => setIsBulkAssignModalOpen(true)}><Briefcase className="mr-2 h-4 w-4"/> Asignar Proceso</Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedUserIds(new Set())}>Limpiar</Button>
                </div>
            </div>
        )
    }

    const GridView = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {allUsers.map(u => (
                <DraggableUserCard 
                    key={u.id} 
                    user={u} 
                    isSelected={selectedUserIds.has(u.id)} 
                    onSelectionChange={handleSelectionChange}
                    onEdit={handleOpenUserModal}
                    onRoleChange={handleOpenUserModal}
                    onStatusChange={handleStatusChange}
                    onChatPermissions={setUserForChatPermissions}
                />
            ))}
        </div>
    );

    return (
        <DndContext sensors={sensors} onDragStart={(e) => setActiveDraggable(e.active)} onDragEnd={handleDragEnd}>
            <div className="space-y-6">
                 {isMobile ? <MobileControls /> : <DesktopControls />}

                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    <div className="lg:col-span-3">
                         <div className="mb-24 md:mb-4">
                            {isLoading ? (
                                viewMode === 'grid' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">{[...Array(10)].map((_,i) => <Skeleton key={i} className="h-44 w-full" />)}</div>
                                ) : (
                                    <Card><CardContent className="p-4"><Skeleton className="h-96 w-full"/></CardContent></Card>
                                )
                            ) : allUsers.length > 0 ? (
                               viewMode === 'grid' ? <GridView /> : <UserTable users={allUsers} selectedUserIds={selectedUserIds} onSelectionChange={handleSelectionChange} onEdit={handleOpenUserModal} onRoleChange={handleOpenUserModal} onStatusChange={handleStatusChange} onChatPermissions={setUserForChatPermissions} />
                            ) : (
                               <EmptyState
                                 icon={UsersIcon}
                                 title="No se encontraron colaboradores"
                                 description="Prueba a ajustar los filtros o a añadir un nuevo colaborador."
                                 imageUrl={settings?.emptyStateUsersUrl}
                               />
                            )}
                         </div>
                         {totalPages > 1 && <SmartPagination className="mt-6" currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}
                    </div>

                    <aside className="hidden lg:block lg:col-span-1 lg:sticky lg:top-24 space-y-4">
                        <ProcessTree processes={processes} onProcessUpdate={() => fetchData(1)} onProcessClick={(id) => {setProcessFilter(id); handleFilterChange('processId', id);}} activeProcessId={processFilter}/>
                        <div className="md:bottom-4">
                           <BulkActionsBar />
                        </div>
                    </aside>
                </div>
            </div>
            
            <AnimatePresence>
                {selectedUserIds.size > 0 && isMobile && (
                     <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-24 left-4 right-4 z-50 pointer-events-none flex justify-center"
                    >
                       <div className="pointer-events-auto">
                           <BulkActionsBar />
                       </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <DragOverlay dropAnimation={null}>
                {draggedUser ? 
                  <DraggableUserPreview user={draggedUser} /> 
                : null}
            </DragOverlay>
            
            {showUserModal && <UserFormModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} onSave={() => fetchData(1)} user={userToEdit} processes={processes} />}
            {isBulkAssignModalOpen && <BulkAssignModal isOpen={isBulkAssignModalOpen} onClose={() => setIsBulkAssignModalOpen(false)} onSave={() => fetchData(1)} userIds={Array.from(selectedUserIds)} processes={processes}/>}
            {userForChatPermissions && <ChatPermissionsModal isOpen={!!userForChatPermissions} onClose={() => setUserForChatPermissions(null)} user={userForChatPermissions} />}
            
             <AlertDialog open={!!userToDeactivate} onOpenChange={(open) => setUserToDeactivate(open ? userToDeactivate : null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar cambio de estado?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de {userToDeactivate?.isActive ? 'inactivar' : 'activar'} la cuenta de <strong>{userToDeactivate?.name}</strong>. 
                            Un usuario inactivo no podrá iniciar sesión.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeactivating}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmStatusChange} disabled={isDeactivating} className={cn(!userToDeactivate?.isActive && 'bg-green-600 hover:bg-green-700', userToDeactivate?.isActive && 'bg-destructive hover:bg-destructive/90')}>
                            {isDeactivating ? <Loader2 className="animate-spin mr-2"/> : null}
                            Sí, {userToDeactivate?.isActive ? 'Inactivar' : 'Activar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DndContext>
    );
}

export default function UsersPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <UsersPageComponent />
        </Suspense>
    )
}
```
  </change>
  <change>
    <file>src/components/users/user-form-modal.tsx</file>
    <content><![CDATA[// src/components/users/user-form-modal.tsx
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
import { Loader2, Camera, Save, Eye, EyeOff } from 'lucide-react';
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
    const [showPassword, setShowPassword] = useState(false);

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
            const body: any = {
                name,
                email,
                role,
                processId,
                avatar: avatarUrl,
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
            <DialogContent className="w-[95vw] sm:max-w-md p-0 gap-0 rounded-2xl">
                 <div className="flex flex-col h-full max-h-[90vh]">
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
                 </div>
            </DialogContent>
        </Dialog>
    );
}
```
  </change>
  <change>
    <file>src/api/users/[id]/route.ts</file>
    <content><![CDATA[// src/app/api/users/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';


export const dynamic = 'force-dynamic';

// GET a specific user
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    const { id } = params;
    // Allow admins to get any user, and any user to get their own profile
    if (!session || (session.role !== 'ADMINISTRATOR' && session.id !== id)) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                process: true, 
            }
        });
        if (!user) {
            return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
        }
        const { password, twoFactorSecret, ...userToReturn } = user;
        return NextResponse.json(userToReturn);
    } catch (error) {
        console.error('[USER_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener el usuario' }, { status: 500 });
    }
}

// PUT (update) a user
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    if (session.role !== 'ADMINISTRATOR' && session.id !== id) {
         return NextResponse.json({ message: 'No tienes permiso para actualizar este usuario.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
        let dataToUpdate: any = {};
        
        if ('name' in body) dataToUpdate.name = body.name;
        if ('avatar' in body) dataToUpdate.avatar = body.avatar;
        if ('theme' in body) dataToUpdate.theme = body.theme;
        if ('processId' in body) dataToUpdate.processId = body.processId;

        if (session.role === 'ADMINISTRATOR') {
            const userToUpdate = await prisma.user.findUnique({ where: { id } });
            if (!userToUpdate) {
                 return NextResponse.json({ message: 'Usuario a actualizar no encontrado' }, { status: 404 });
            }

            if ('email' in body && body.email !== userToUpdate.email) {
                const existingUser = await prisma.user.findFirst({ where: { email: body.email, NOT: { id } } });
                if (existingUser) {
                    return NextResponse.json({ message: 'El correo electrónico ya está en uso' }, { status: 409 });
                }
                dataToUpdate.email = body.email;
            }

            if ('role' in body && body.role !== userToUpdate.role) { 
                dataToUpdate.role = body.role;
                await prisma.securityLog.create({
                    data: {
                        event: 'USER_ROLE_CHANGED',
                        ipAddress: ip,
                        userId: id,
                        details: `Rol cambiado de ${userToUpdate.role} a ${body.role} por el administrador ${session.email}.`,
                        userAgent: req.headers.get('user-agent'),
                        country: req.geo?.country,
                        city: req.geo?.city,
                    }
                });
            }
            
            // Si se proporciona una nueva contraseña, encriptarla
            if (body.password && body.password.trim() !== '') {
                const hashedPassword = await bcrypt.hash(body.password, 10);
                dataToUpdate.password = hashedPassword;
            }
        }
        
        if (Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json({ message: 'No hay datos para actualizar.' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });

        const { password, twoFactorSecret, ...userToReturn } = updatedUser;
        return NextResponse.json(userToReturn);

    } catch (error) {
        console.error('[USER_PUT_ERROR]', error);
        return NextResponse.json({ message: 'Error al actualizar el usuario' }, { status: 500 });
    }
}


// DELETE a user -> Now INACTIVATE
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    
    const { id } = params;
    if (session.id === id) {
        return NextResponse.json({ message: 'No puedes inactivar tu propia cuenta' }, { status: 400 });
    }

    try {
        await prisma.user.update({ 
            where: { id },
            data: { isActive: false }
        });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[USER_INACTIVATE_ERROR]', error);
        return NextResponse.json({ message: 'Error al inactivar el usuario' }, { status: 500 });
    }
}
