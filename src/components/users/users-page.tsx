// src/app/(app)/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, List, Grid, Filter, UserPlus, MoreVertical, Loader2, Briefcase, MessageSquare, Edit, Trash2, UserCog, UserX, Users as UsersIcon, Key, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
import { EmptyState } from '../empty-state';
import { useTour } from '@/contexts/tour-context';
import { usersTour } from '@/lib/tour-steps';
import { ColorfulLoader } from '../ui/colorful-loader';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
                    compact={true}
                />
                 <div className="absolute top-2 left-2 z-20">
                    <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelectionChange(user.id, !!checked)} className="data-[state=checked]:bg-accent data-[state=checked]:border-accent-foreground/50 border-accent/70 bg-background/80 backdrop-blur-sm" />
                </div>
            </div>
        </div>
    )
}

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
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showMobileProcessTree, setShowMobileProcessTree] = useState(false);
    
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
                else newSet.delete(userId);
            }
            return newSet;
        });
    }, [usersList]);
    
    const handleFilterChange = (key: string, value: string | null) => {
        router.push(`${pathname}?${createQueryString({ [key]: value, page: 1 })}`);
        if (isMobile) setShowMobileFilters(false);
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
        return <div className="flex justify-center items-center h-full"><div className="w-8 h-8"><ColorfulLoader /></div></div>
    }

    const DesktopControls = () => (
         <div id="users-controls" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-auto sm:flex-grow sm:max-w-xs">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input placeholder="Buscar por nombre o email..." value={search} onChange={handleSearchChange} className="pl-10 w-full"/>
            </div>
             <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size={isMobile ? "sm" : "default"} className="flex-1 sm:flex-none">
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
                        <Button variant="outline" size={isMobile ? "sm" : "default"} className="flex-1 sm:flex-none">
                            {viewMode === 'grid' ? <Grid className="mr-2 h-4 w-4" /> : <List className="mr-2 h-4 w-4" />}
                            Vista
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setViewMode('grid')}><Grid className="mr-2 h-4 w-4"/>Cuadrícula</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setViewMode('table')}><List className="mr-2 h-4 w-4"/>Tabla</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => handleOpenUserModal(null)} size={isMobile ? "sm" : "default"} className="flex-1 sm:flex-none">
                    <UserPlus className="mr-2 h-4 w-4"/>Añadir Colaborador
                </Button>
             </div>
        </div>
    );

    const MobileFiltersSheet = () => (
        <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
            <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                    <SheetTitle>Filtros ({activeFiltersCount})</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-full pr-4">
                    <div className="space-y-6 py-4">
                        <div className="space-y-3">
                            <Label>Rol</Label>
                            <Select value={role || 'ALL'} onValueChange={(v) => handleFilterChange('role', v as UserRole)}>
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos</SelectItem>
                                    <SelectItem value="ADMINISTRATOR">Admin</SelectItem>
                                    <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                                    <SelectItem value="STUDENT">Estudiante</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-3">
                            <Label>Estado</Label>
                            <Select value={status || 'ALL'} onValueChange={(v) => handleFilterChange('status', v)}>
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos</SelectItem>
                                    <SelectItem value="active">Activo</SelectItem>
                                    <SelectItem value="inactive">Inactivo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-3">
                            <Label>Proceso</Label>
                            <Select value={processId || 'ALL'} onValueChange={(v) => handleFilterChange('processId', v)}>
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos</SelectItem>
                                    <SelectItem value="unassigned">Sin Asignar</SelectItem>
                                    <Separator/>
                                    {flattenedProcesses.map(p => (
                                        <SelectItem key={p.id} value={p.id} style={{ paddingLeft: `${p.level * 1.5 + 1}rem` }}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );

    const BulkActionsBar = () => {
        if (selectedUserIds.size === 0) return null;

        return (
             <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-background border rounded-lg shadow-lg">
                <p className="px-2 text-sm font-semibold">{selectedUserIds.size} seleccionado(s)</p>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => setIsBulkAssignModalOpen(true)}>
                        <Briefcase className="mr-2 h-4 w-4"/> 
                        <span className="hidden sm:inline">Asignar Proceso</span>
                        <span className="sm:hidden">Asignar</span>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedUserIds(new Set())}>
                        Limpiar
                    </Button>
                </div>
            </div>
        )
    }

    const GridView = () => (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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

    // Componente de tabla responsiva
    const ResponsiveUserTable = ({ users, selectedUserIds, onSelectionChange, onEdit, onRoleChange, onStatusChange }: any) => {
        if (isMobile) {
            return (
                <div className="space-y-3">
                    {users.map((u: UserWithProcess) => (
                        <Card key={u.id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Checkbox 
                                            checked={selectedUserIds.has(u.id)} 
                                            onCheckedChange={(checked) => onSelectionChange(u.id, !!checked)} 
                                        />
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={u.avatar || undefined} />
                                            <AvatarFallback><Identicon userId={u.id}/></AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{u.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => onEdit(u)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => onRoleChange(u)}>
                                                <UserCog className="mr-2 h-4 w-4" />
                                                Cambiar rol
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => onStatusChange(u, !u.isActive)}>
                                                <UserX className="mr-2 h-4 w-4" />
                                                {u.isActive ? 'Inactivar' : 'Activar'}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                
                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Rol:</span>
                                        <Badge variant={getRoleBadgeVariant(u.role)} className="ml-2">
                                            {getRoleInSpanish(u.role)}
                                        </Badge>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Estado:</span>
                                        <Badge variant={u.isActive ? "default" : "secondary"} className="ml-2">
                                            {u.isActive ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </div>
                                    {u.process && (
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Proceso:</span>
                                            <span className="ml-2 font-medium">{u.process.name}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox 
                                    checked={users.length > 0 && users.every((u: UserWithProcess) => selectedUserIds.has(u.id))}
                                    onCheckedChange={(checked) => onSelectionChange('all', !!checked)}
                                />
                            </TableHead>
                            <TableHead>Colaborador</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Proceso</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u: UserWithProcess) => (
                            <TableRow key={u.id}>
                                <TableCell>
                                    <Checkbox 
                                        checked={selectedUserIds.has(u.id)} 
                                        onCheckedChange={(checked) => onSelectionChange(u.id, !!checked)} 
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={u.avatar || undefined} />
                                            <AvatarFallback><Identicon userId={u.id}/></AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{u.name}</p>
                                            <p className="text-sm text-muted-foreground">{u.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getRoleBadgeVariant(u.role)}>
                                        {getRoleInSpanish(u.role)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={u.isActive ? "default" : "secondary"}>
                                        {u.isActive ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {u.process ? (
                                        <span className="inline-flex items-center gap-1">
                                            <Briefcase className="h-3 w-3" />
                                            {u.process.name}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">Sin asignar</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => onEdit(u)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => onRoleChange(u)}>
                                                <UserCog className="mr-2 h-4 w-4" />
                                                Cambiar rol
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => onStatusChange(u, !u.isActive)}>
                                                <UserX className="mr-2 h-4 w-4" />
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
    };

    return (
        <DndContext sensors={sensors} onDragStart={(e) => setActiveDraggable(e.active)} onDragEnd={handleDragEnd}>
            <div className="space-y-4 sm:space-y-6">
                {/* Header con controles */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold tracking-tight">Colaboradores</h1>
                        {isMobile && (
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setShowMobileFilters(true)}
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filtros ({activeFiltersCount})
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                                >
                                    {viewMode === 'grid' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                                </Button>
                            </div>
                        )}
                    </div>
                    
                    {!isMobile ? <DesktopControls /> : (
                        <>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Buscar por nombre o email..." 
                                    value={search} 
                                    onChange={handleSearchChange} 
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => handleOpenUserModal(null)} 
                                    className="flex-1"
                                    size="sm"
                                >
                                    <UserPlus className="mr-2 h-4 w-4"/> 
                                    Añadir
                                </Button>
                                <Sheet open={showMobileProcessTree} onOpenChange={setShowMobileProcessTree}>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <Briefcase className="h-4 w-4" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="right" className="w-full sm:w-[400px]">
                                        <SheetHeader>
                                            <SheetTitle>Árbol de Procesos</SheetTitle>
                                        </SheetHeader>
                                        <ScrollArea className="h-[calc(100vh-100px)] pr-4">
                                            <ProcessTree 
                                                processes={processes} 
                                                onProcessUpdate={fetchData} 
                                                onProcessClick={(id) => {
                                                    handleFilterChange('processId', id);
                                                    setShowMobileProcessTree(false);
                                                }} 
                                                activeProcessId={processId}
                                                compact={true}
                                            />
                                        </ScrollArea>
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </>
                    )}
                </div>

                {/* Barra de acciones masivas - Móvil */}
                {isMobile && selectedUserIds.size > 0 && (
                    <div className="fixed bottom-20 left-4 right-4 z-50">
                        <BulkActionsBar />
                    </div>
                )}

                {/* Contenido principal */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    {/* Panel lateral - Desktop */}
                    <aside className="hidden lg:block lg:col-span-1 lg:sticky lg:top-24 space-y-6">
                        <ProcessTree 
                            processes={processes} 
                            onProcessUpdate={fetchData} 
                            onProcessClick={(id) => handleFilterChange('processId', id)} 
                            activeProcessId={processId}
                        />
                        <div className="sticky top-[calc(100vh-200px)]">
                            <BulkActionsBar />
                        </div>
                    </aside>

                    {/* Lista principal de usuarios */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Barra de acciones masivas - Desktop */}
                        {!isMobile && selectedUserIds.size > 0 && (
                            <div className="animate-in fade-in slide-in-from-top-5 duration-300">
                                <BulkActionsBar />
                            </div>
                        )}

                        {/* Vista de carga */}
                        {isLoading ? (
                            viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {[...Array(8)].map((_, i) => (
                                        <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                                    ))}
                                </div>
                            ) : (
                                <Card>
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="space-y-3">
                                            {[...Array(5)].map((_, i) => (
                                                <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        ) : usersList.length > 0 ? (
                            <>
                                {viewMode === 'grid' ? (
                                    <GridView />
                                ) : (
                                    <Card>
                                        <CardContent className="p-0 sm:p-6">
                                            <ResponsiveUserTable 
                                                users={usersList}
                                                selectedUserIds={selectedUserIds}
                                                onSelectionChange={handleSelectionChange}
                                                onEdit={handleOpenUserModal}
                                                onRoleChange={handleOpenUserModal}
                                                onStatusChange={handleStatusChange}
                                            />
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        ) : (
                            <EmptyState
                                icon={UsersIcon}
                                title="No se encontraron colaboradores"
                                description="Prueba a ajustar los filtros o a añadir un nuevo colaborador."
                                imageUrl={settings?.emptyStateUsersUrl}
                            />
                        )}

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="mt-6">
                                <SmartPagination 
                                    currentPage={currentPage} 
                                    totalPages={totalPages} 
                                    onPageChange={handlePageChange}
                                    compact={isMobile}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Overlay de drag & drop */}
            <DragOverlay dropAnimation={null}>
                {draggedUser ? 
                    <DraggableUserPreview user={draggedUser} /> 
                : null}
            </DragOverlay>
            
            {/* Modales */}
            {showUserModal && (
                <UserFormModal 
                    isOpen={showUserModal} 
                    onClose={() => setShowUserModal(false)} 
                    onSave={fetchData} 
                    user={userToEdit} 
                    processes={processes}
                    fullScreen={isMobile}
                />
            )}
            
            {isBulkAssignModalOpen && (
                <BulkAssignModal 
                    isOpen={isBulkAssignModalOpen} 
                    onClose={() => setIsBulkAssignModalOpen(false)} 
                    onSave={fetchData} 
                    userIds={Array.from(selectedUserIds)} 
                    processes={processes}
                    fullScreen={isMobile}
                />
            )}
            
            {/* Sheet de filtros para móvil */}
            <MobileFiltersSheet />
            
            {/* Dialogo de confirmación para cambiar estado */}
            <AlertDialog open={!!userToDeactivate} onOpenChange={(open) => setUserToDeactivate(open ? userToDeactivate : null)}>
                <AlertDialogContent className={isMobile ? "w-[95vw] max-w-[95vw] rounded-lg" : ""}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar cambio de estado?</AlertDialogTitle>
                        <AlertDialogDescription className={isMobile ? "text-sm" : ""}>
                            Estás a punto de {userToDeactivate?.isActive ? 'inactivar' : 'activar'} la cuenta de <strong>{userToDeactivate?.name}</strong>. 
                            Un usuario inactivo no podrá iniciar sesión.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className={isMobile ? "flex-col gap-2" : ""}>
                        <AlertDialogCancel disabled={isDeactivating} className={isMobile ? "w-full" : ""}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmStatusChange} 
                            disabled={isDeactivating} 
                            className={cn(
                                isMobile ? "w-full" : "",
                                !userToDeactivate?.isActive && 'bg-green-600 hover:bg-green-700', 
                                userToDeactivate?.isActive && 'bg-destructive hover:bg-destructive/90'
                            )}
                        >
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
        <Suspense fallback={
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-10 h-10">
                    <ColorfulLoader />
                </div>
            </div>
        }>
            <UsersPageComponent />
        </Suspense>
    )
}