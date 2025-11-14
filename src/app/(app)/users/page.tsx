
// src/app/(app)/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, List, Grid, Filter, UserPlus, MoreVertical, Loader2, Briefcase, MessageSquare, Edit, Trash2, UserCog, UserX, Users as UsersIcon, Key, HelpCircle } from 'lucide-react';
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
import { useTour } from '@/contexts/tour-context';
import { usersTour } from '@/lib/tour-steps';
import { ColorfulLoader } from '@/components/ui/colorful-loader';


// --- TYPES & CONTEXT ---
interface ProcessWithChildren extends Process {
    users: (Pick<User, 'id' | 'name' | 'avatar'>)[];
    children: ProcessWithChildren[];
}
interface UserWithProcess extends User {
    process: { id: string; name: string } | null;
}

const PAGE_SIZE = 12;

const DraggableUserPreview = ({ user }: { user: UserWithProcess }) => (
    <Card className="flex items-center gap-2 p-2 shadow-lg w-48">
        <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback><Identicon userId={user.id}/></AvatarFallback>
        </Avatar>
        <span className="font-semibold text-sm truncate">{user.name}</span>
    </Card>
);

const DraggableUserCard = ({ user, isSelected, onSelectionChange, onEdit, onRoleChange, onStatusChange }: { 
    user: UserWithProcess, 
    isSelected: boolean, 
    onSelectionChange: (id: string, selected: boolean) => void,
    onEdit: (user: User) => void,
    onRoleChange: (user: User) => void,
    onStatusChange: (user: User, status: boolean) => void
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
                />
                 <div className="absolute top-2 left-2 z-20">
                    <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelectionChange(user.id, !!checked)} className="data-[state=checked]:bg-accent data-[state=checked]:border-accent-foreground/50 border-accent/70 bg-background/80 backdrop-blur-sm" />
                </div>
            </div>
        </div>
    )
}

// --- Skeleton Components ---
const UserProfileCardSkeleton = () => (
    <Card className="flex flex-col h-full">
        <div className="h-14 w-full relative bg-secondary/50" />
        <CardContent className="pt-12 px-2 pb-3 flex-grow flex flex-col items-center">
            <Skeleton className="h-5 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-2/3" />
        </CardContent>
        <CardFooter className="p-1 border-t mt-auto">
            <Skeleton className="h-7 w-full" />
        </CardFooter>
    </Card>
);

const UserTableSkeleton = () => (
    <Card>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]"><Skeleton className="h-4 w-4" /></TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Proceso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {[...Array(PAGE_SIZE)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <div>
                                    <Skeleton className="h-4 w-24 mb-1" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </Card>
);


// --- MAIN PAGE COMPONENT ---
function UsersPageComponent() {
    const { user: currentUser, settings } = useAuth();
    const { setPageTitle } = useTitle();
    const isMobile = useIsMobile();
    const { startTour, forceStartTour } = useTour();

    const [usersList, setUsersList] = useState<UserWithProcess[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [processes, setProcesses] = useState<ProcessWithChildren[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    
    const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
    const [isDeactivating, setIsDeactivating] = useState(false);
    
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') as UserRole | 'ALL' | null;
    const status = searchParams.get('status') as 'active' | 'inactive' | 'ALL' | null;
    const processId = searchParams.get('processId');

    const debouncedSearchTerm = useDebounce(search, 300);
    const currentPage = Number(searchParams.get('page')) || 1;
    const totalPages = Math.ceil(totalUsers / PAGE_SIZE);
    
    const [activeDraggable, setActiveDraggable] = useState<Active | null>(null);
    const draggedUser = useMemo(() => {
        if (!activeDraggable) return null;
        return usersList.find(u => u.id === activeDraggable.id)
    }, [activeDraggable, usersList]);

    const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 10, }, }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5, }, }));
    
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
    
    useEffect(() => {
        setPageTitle('Control Central');
        startTour('users', usersTour);
    }, [setPageTitle, startTour]);
    
    const createQueryString = useCallback((paramsToUpdate: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(paramsToUpdate).forEach(([name, value]) => {
          if (value === null || value === '' || value === 'ALL') params.delete(name);
          else params.set(name, String(value));
      });
      return params.toString();
    }, [searchParams]);
    
    const activeFiltersCount = useMemo(() => {
        return Object.values({ search, role, status, processId }).filter(v => v && v !== 'ALL' && v !== null).length;
    }, [search, role, status, processId]);

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        
        const params = new URLSearchParams();
        if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
        params.set('page', String(currentPage));
        if(role && role !== 'ALL') params.set('role', role);
        if(status && status !== 'ALL') params.set('status', status);
        if(processId) params.set('processId', processId);
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
            
            setUsersList(usersData.users || []);
            setTotalUsers(usersData.totalUsers || 0);
            setProcesses(processesData || []);
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, debouncedSearchTerm, currentPage, role, status, processId, toast]);
    
    useEffect(() => {
        setPageTitle('Control Central');
        if (currentUser?.role !== 'ADMINISTRATOR') return;
        fetchData();
    }, [currentUser, fetchData, setPageTitle]);
    
    useEffect(() => {
        setSelectedUserIds(new Set());
    }, [currentPage, debouncedSearchTerm, role, status, processId]);

    const handleSelectionChange = useCallback((userId: string, isSelected: boolean) => {
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            if (userId === 'all') {
                const pageUserIds = usersList.map(u => u.id);
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
    }, [usersList]);
    
    const handleFilterChange = (key: string, value: string | null) => {
        router.push(`${pathname}?${createQueryString({ [key]: value, page: 1 })}`);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      router.push(`${pathname}?${createQueryString({ search: e.target.value, page: 1 })}`);
    };

    const handlePageChange = (page: number) => {
        router.push(`${pathname}?${createQueryString({ page: String(page) })}`);
    };

    const handleOpenUserModal = (user: User | null = null) => {
        setUserToEdit(user);
        setShowUserModal(true);
    };
    
    const handleStatusChange = async (user: User, newStatus: boolean) => {
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
            fetchData();
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
            fetchData();
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
        }
    };
    
    interface FlatProcess {
        id: string;
        name: string;
        level: number;
    }

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

    if (!currentUser || (currentUser.role !== 'ADMINISTRATOR')) {
        return <div className="text-center p-8"><AlertTriangle className="mx-auto h-12 w-12 text-destructive"/>Acceso Denegado</div>;
    }

    if (isLoading && usersList.length === 0) {
        return (
             <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <Skeleton className="h-10 w-64" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-40" />
                    </div>
                </div>
                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                     <div className="lg:col-span-3">
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                             {[...Array(8)].map((_, i) => <UserProfileCardSkeleton key={i} />)}
                         </div>
                     </div>
                     <aside className="hidden lg:block lg:col-span-1">
                         <Skeleton className="h-[500px] w-full" />
                     </aside>
                 </div>
            </div>
        )
    }
    
    const DesktopControls = () => (
         <div id="users-controls" className="flex items-center justify-between gap-4">
            <div className="relative flex-grow max-w-xs">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input placeholder="Buscar por nombre o email..." value={search} onChange={handleSearchChange} className="pl-10"/>
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
                             <div className="space-y-2"><Label>Rol</Label><Select value={role || 'ALL'} onValueChange={(v) => handleFilterChange('role', v as UserRole)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="ADMINISTRATOR">Admin</SelectItem><SelectItem value="INSTRUCTOR">Instructor</SelectItem><SelectItem value="STUDENT">Estudiante</SelectItem></SelectContent></Select></div>
                             <div className="space-y-2"><Label>Estado</Label><Select value={status || 'ALL'} onValueChange={(v) => handleFilterChange('status', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="active">Activo</SelectItem><SelectItem value="inactive">Inactivo</SelectItem></SelectContent></Select></div>
                             <div className="space-y-2"><Label>Proceso</Label><Select value={processId || 'ALL'} onValueChange={(v) => handleFilterChange('processId', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="unassigned">Sin Asignar</SelectItem><Separator/>{flattenedProcesses.map(p => (<SelectItem key={p.id} value={p.id} style={{ paddingLeft: `${p.level * 1.5 + 1}rem` }}>{p.name}</SelectItem>))}</SelectContent></Select></div>
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
                     <Input placeholder="Buscar por nombre o email..." value={search} onChange={handleSearchChange} className="pl-10"/>
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
                                <div className="space-y-2"><Label>Rol</Label><Select value={role || 'ALL'} onValueChange={(v) => handleFilterChange('role', v as UserRole)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="ADMINISTRATOR">Admin</SelectItem><SelectItem value="INSTRUCTOR">Instructor</SelectItem><SelectItem value="STUDENT">Estudiante</SelectItem></SelectContent></Select></div>
                                 <div className="space-y-2"><Label>Estado</Label><Select value={status || 'ALL'} onValueChange={(v) => handleFilterChange('status', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="active">Activo</SelectItem><SelectItem value="inactive">Inactivo</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label>Proceso</Label><Select value={processId || 'ALL'} onValueChange={(v) => handleFilterChange('processId', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="unassigned">Sin Asignar</SelectItem><Separator/>{flattenedProcesses.map(p => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {usersList.map(u => (
                <DraggableUserCard 
                    key={u.id} 
                    user={u} 
                    isSelected={selectedUserIds.has(u.id)} 
                    onSelectionChange={handleSelectionChange}
                    onEdit={handleOpenUserModal}
                    onRoleChange={handleOpenUserModal}
                    onStatusChange={handleStatusChange}
                />
            ))}
        </div>
    );

    return (
        <DndContext sensors={sensors} onDragStart={(e) => setActiveDraggable(e.active)} onDragEnd={handleDragEnd}>
            <div className="space-y-6">
                 {isMobile ? <MobileControls /> : <DesktopControls />}

                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    <div className="lg:col-span-3" id="users-main-view">
                         <div className="mb-24 md:mb-4">
                            {isLoading ? (
                                viewMode === 'grid' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[...Array(8)].map((_,i) => <UserProfileCardSkeleton key={i} />)}
                                    </div>
                                ) : (
                                    <UserTableSkeleton />
                                )
                            ) : usersList.length > 0 ? (
                               viewMode === 'grid' ? <GridView /> : <UserTable users={usersList} selectedUserIds={selectedUserIds} onSelectionChange={handleSelectionChange} onEdit={handleOpenUserModal} onRoleChange={handleOpenUserModal} onStatusChange={handleStatusChange} />
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
                        <ProcessTree processes={processes} onProcessUpdate={fetchData} onProcessClick={(id) => handleFilterChange('processId', id)} activeProcessId={processId}/>
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
            
            {showUserModal && <UserFormModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} onSave={fetchData} user={userToEdit} processes={processes} />}
            {isBulkAssignModalOpen && <BulkAssignModal isOpen={isBulkAssignModalOpen} onClose={() => setIsBulkAssignModalOpen(false)} onSave={fetchData} userIds={Array.from(selectedUserIds)} processes={processes}/>}
            
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
                            {isDeactivating && <div className="w-4 h-4 mr-2"><ColorfulLoader /></div>}
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
        <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8"><ColorfulLoader /></div></div>}>
            <UsersPageComponent />
        </Suspense>
    )
}

    