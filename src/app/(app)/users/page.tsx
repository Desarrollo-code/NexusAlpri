// src/app/(app)/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Edit, Trash2, UserPlus, Loader2, MoreVertical, GripVertical, Users as UsersIcon, List, Grid, SlidersHorizontal, Briefcase, Filter, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { User, UserRole, Process } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { SmartPagination } from '@/components/ui/pagination';
import { useTitle } from '@/contexts/title-context';
import { getProcessColors } from '@/lib/utils';
import { getRoleBadgeVariant, getRoleInSpanish } from '@/lib/security-log-utils';
import { DndContext, useDraggable, useDroppable, DragOverlay, type DragEndEvent, type Active, type Over } from '@dnd-kit/core';
import { UserFormModal } from '@/components/users/user-form-modal';
import { ProcessFormModal } from '@/components/users/process-form-modal';
import { UserProfileCard } from '@/components/profile/user-profile-card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { useDebounce } from '@/hooks/use-debounce';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { Identicon } from '@/components/ui/identicon';
import { AlertTriangle } from 'lucide-react';

// --- TYPES & CONTEXT ---
interface ProcessWithChildren extends Process {
    users: (Pick<User, 'id' | 'name' | 'avatar'>)[];
    children: ProcessWithChildren[];
}
interface UserWithProcess extends User {
    process: { id: string; name: string } | null;
    processes?: { id: string, name: string }[];
}

const PAGE_SIZE = 12;

type UsersPageContextType = {
    handleFilterChange: (key: string, value: string | null) => void;
    setProcessToEdit: (p: ProcessWithChildren) => void;
    setProcessToDelete: (p: ProcessWithChildren) => void;
};
const UsersPageContext = createContext<UsersPageContextType | null>(null);
const useUsersPage = () => {
    const context = useContext(UsersPageContext);
    if (!context) throw new Error("useUsersPage must be used within UsersPageProvider");
    return context;
};

// --- SUB-COMPONENTS ---
const ProcessTreeFilter = ({ processes, activeFilter, onSelect }: { processes: ProcessWithChildren[], activeFilter: string | null, onSelect: (id: string | null) => void }) => {
    const renderTree = (processList: ProcessWithChildren[], level = 0) => {
        return processList.map(p => (
            <React.Fragment key={p.id}>
                <CommandItem
                    value={p.name}
                    onSelect={() => onSelect(p.id)}
                    style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
                    className="flex justify-between items-center"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getProcessColors(p.id).raw.medium }} />
                        {p.name}
                    </div>
                </CommandItem>
                {p.children.length > 0 && renderTree(p.children, level + 1)}
            </React.Fragment>
        ));
    };

    const activeProcessName = processes.flatMap(p => p.children.concat(p)).find(p => p.id === activeFilter)?.name || 'Todos los Procesos';

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-start">
                    <Briefcase className="mr-2 h-4 w-4" />
                    <span className="truncate">{activeProcessName}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[300px]" align="start">
                <Command>
                    <CommandInput placeholder="Buscar proceso..." />
                    <CommandList>
                        <CommandEmpty>No se encontraron procesos.</CommandEmpty>
                        <CommandGroup>
                             <CommandItem onSelect={() => onSelect(null)}>Todos los Procesos</CommandItem>
                             <CommandItem onSelect={() => onSelect('unassigned')}>Sin Asignar</CommandItem>
                             <Separator />
                             {renderTree(processes)}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

const FilterBar = ({ activeFilters, processes }: { activeFilters: Record<string, string | null>, processes: ProcessWithChildren[] }) => {
    const { handleFilterChange } = useUsersPage();
    
    return (
        <div className="flex flex-col sm:flex-row gap-2">
            <ProcessTreeFilter processes={processes} activeFilter={activeFilters.processId || null} onSelect={(id) => handleFilterChange('processId', id)} />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto"><Filter className="mr-2 h-4 w-4" />Filtros Avanzados</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[250px]">
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Rol</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                             <DropdownMenuCheckboxItem checked={!activeFilters.role} onCheckedChange={() => handleFilterChange('role', null)}>Todos</DropdownMenuCheckboxItem>
                             <DropdownMenuCheckboxItem checked={activeFilters.role === 'ADMINISTRATOR'} onCheckedChange={() => handleFilterChange('role', 'ADMINISTRATOR')}>Administrador</DropdownMenuCheckboxItem>
                             <DropdownMenuCheckboxItem checked={activeFilters.role === 'INSTRUCTOR'} onCheckedChange={() => handleFilterChange('role', 'INSTRUCTOR')}>Instructor</DropdownMenuCheckboxItem>
                             <DropdownMenuCheckboxItem checked={activeFilters.role === 'STUDENT'} onCheckedChange={() => handleFilterChange('role', 'STUDENT')}>Estudiante</DropdownMenuCheckboxItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Estado</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuCheckboxItem checked={!activeFilters.status} onCheckedChange={() => handleFilterChange('status', null)}>Todos</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={activeFilters.status === 'active'} onCheckedChange={() => handleFilterChange('status', 'active')}>Activo</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={activeFilters.status === 'inactive'} onCheckedChange={() => handleFilterChange('status', 'inactive')}>Inactivo</DropdownMenuCheckboxItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

const Header = ({ onAddUser, onAddProcess }: { onAddUser: () => void, onAddProcess: () => void }) => (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-1 flex-grow">
            <h2 className="text-2xl font-semibold">Control Central</h2>
            <p className="text-muted-foreground">Gestiona los colaboradores y la estructura de procesos de la organización.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button><PlusCircle className="mr-2 h-4 w-4"/> Añadir</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={onAddUser}><UserPlus className="mr-2 h-4 w-4"/>Nuevo Colaborador</DropdownMenuItem>
                    <DropdownMenuItem onSelect={onAddProcess}><Briefcase className="mr-2 h-4 w-4"/>Nuevo Proceso</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>
);

const UserTable = ({ users, onEdit }: { users: UserWithProcess[], onEdit: (user: User) => void }) => (
     <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Colaborador</TableHead><TableHead className="hidden md:table-cell">Rol</TableHead><TableHead className="hidden lg:table-cell">Estado</TableHead><TableHead className="hidden lg:table-cell">Proceso</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
        <TableBody>
            {users.map(u => (
                <TableRow key={u.id}>
                    <TableCell><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src={u.avatar || undefined} /><AvatarFallback><Identicon userId={u.id}/></AvatarFallback></Avatar><div><p className="font-semibold truncate">{u.name}</p><p className="text-xs text-muted-foreground truncate">{u.email}</p></div></div></TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant={getRoleBadgeVariant(u.role)}>{getRoleInSpanish(u.role)}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell"><Badge variant={u.isActive ? 'default' : 'destructive'} className={cn(u.isActive && 'bg-green-500 hover:bg-green-600')}>{u.isActive ? 'Activo' : 'Inactivo'}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell">{u.process ? <Badge variant="secondary" style={{ backgroundColor: getProcessColors(u.process.id).raw.light, color: getProcessColors(u.process.id).raw.dark }}>{u.process.name}</Badge> : <span className="text-xs text-muted-foreground italic">Sin asignar</span>}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => onEdit(u)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table></CardContent></Card>
);

const UserGrid = ({ users, onEdit }: { users: UserWithProcess[], onEdit: (user: User) => void }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {users.map(u => (
             <div key={u.id} className="relative group">
                <UserProfileCard user={u} />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="secondary" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => onEdit(u)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                </div>
            </div>
        ))}
    </div>
);

// --- MAIN PAGE COMPONENT ---
export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const { setPageTitle } = useTitle();

    const [usersList, setUsersList] = useState<UserWithProcess[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [processes, setProcesses] = useState<ProcessWithChildren[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [processToEdit, setProcessToEdit] = useState<ProcessWithChildren | null>(null);
    const [processToDelete, setProcessToDelete] = useState<ProcessWithChildren | null>(null);
    const [isDeletingProcess, setIsDeletingProcess] = useState(false);

    const [showUserModal, setShowUserModal] = useState(false);
    const [showProcessModal, setShowProcessModal] = useState(false);
    
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') as UserRole | null;
    const status = searchParams.get('status');
    const processId = searchParams.get('processId');

    const debouncedSearchTerm = useDebounce(search, 300);
    const currentPage = Number(searchParams.get('page')) || 1;
    const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

    const createQueryString = useCallback((paramsToUpdate: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(paramsToUpdate).forEach(([name, value]) => {
          if (value === null || value === '' || (name === 'role' && value === 'ALL') || (name === 'status' && value === 'ALL')) params.delete(name);
          else params.set(name, String(value));
      });
      return params.toString();
    }, [searchParams]);

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        
        const params = new URLSearchParams();
        if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
        if (currentPage) params.set('page', String(currentPage));
        if(role) params.set('role', role);
        if(status) params.set('status', status);
        if(processId) params.set('processId', processId);
        params.set('pageSize', String(PAGE_SIZE));

        try {
            const [usersRes, processesRes] = await Promise.all([
                fetch(`/api/users?${params.toString()}`),
                fetch('/api/processes'),
            ]);
            
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
    }, [currentUser, fetchData, setPageTitle, debouncedSearchTerm, currentPage, role, status, processId]);
    
    const handleFilterChange = (key: string, value: string | null) => {
        router.push(`${pathname}?${createQueryString({ [key]: value, page: 1 })}`);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      router.push(`${pathname}?${createQueryString({ search: e.target.value, page: 1 })}`);
    };

    const handlePageChange = (page: number) => {
        router.push(`${pathname}?${createQueryString({ page })}`);
    };

    const handleOpenUserModal = (user: User | null = null) => {
        setUserToEdit(user);
        setShowUserModal(true);
    };

    const handleOpenProcessModal = (process: Process | null = null) => {
        setProcessToEdit(process as ProcessWithChildren);
        setShowProcessModal(true);
    };
    
    const handleDeleteProcess = async () => {
        if (!processToDelete) return;
        setIsDeletingProcess(true);
        try {
            const res = await fetch(`/api/processes/${processToDelete.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error((await res.json()).message || 'No se pudo eliminar el proceso.');
            toast({ title: 'Proceso Eliminado', description: `El proceso "${processToDelete.name}" ha sido eliminado.` });
            fetchData();
        } catch (err) {
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
        } finally {
            setIsDeletingProcess(false);
            setProcessToDelete(null);
        }
    };
    
    const contextValue = { handleFilterChange, setProcessToEdit: handleOpenProcessModal, setProcessToDelete };

    if (!currentUser || currentUser.role !== 'ADMINISTRATOR') {
        return <div className="text-center p-8"><AlertTriangle className="mx-auto h-12 w-12 text-destructive"/>Acceso Denegado</div>;
    }
    
    const activeFilters = { search, role, status, processId };

    if (isLoading && usersList.length === 0) {
        return (
            <div className="space-y-6">
                <Header onAddUser={() => {}} onAddProcess={() => {}} />
                <Card><CardContent className="p-4"><Skeleton className="h-10 w-full" /></CardContent></Card>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <UsersPageContext.Provider value={contextValue}>
            <div className="space-y-6">
                <Header onAddUser={() => handleOpenUserModal(null)} onAddProcess={() => handleOpenProcessModal(null)} />
                <Card>
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="relative w-full md:max-w-xs">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <Input placeholder="Buscar por nombre o email..." value={search} onChange={handleSearchChange} className="pl-10"/>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <FilterBar activeFilters={activeFilters} processes={processes} />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full sm:w-auto justify-start"><Grid className="mr-2 h-4 w-4" />Vista: {viewMode === 'grid' ? 'Cuadrícula' : 'Tabla'}</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => setViewMode('grid')}><Grid className="mr-2 h-4 w-4"/>Cuadrícula</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setViewMode('table')}><List className="mr-2 h-4 w-4"/>Tabla</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardContent>
                </Card>

                {isLoading ? (
                    viewMode === 'table' ? <Skeleton className="h-[400px] w-full" /> : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{[...Array(8)].map((_,i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
                ) : (
                    <>
                        {usersList.length > 0 ? (
                           viewMode === 'table' ? <UserTable users={usersList} onEdit={handleOpenUserModal}/> : <UserGrid users={usersList} onEdit={handleOpenUserModal}/>
                        ) : (
                           <div className="text-center py-16 border-2 border-dashed rounded-lg">
                                <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                                <h3 className="text-xl font-semibold mb-2">No se encontraron colaboradores</h3>
                                <p className="text-muted-foreground">Prueba a ajustar los filtros o a añadir un nuevo colaborador.</p>
                           </div>
                        )}
                        {totalPages > 1 && <SmartPagination className="mt-4" currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}
                    </>
                )}
            </div>

            {showUserModal && <UserFormModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} onSave={fetchData} user={userToEdit} processes={processes} />}
            {showProcessModal && <ProcessFormModal isOpen={showProcessModal} onClose={() => setShowProcessModal(false)} onSave={fetchData} process={processToEdit} allProcesses={processes} />}
            
            {processToDelete && (
                 <AlertDialog open={!!processToDelete} onOpenChange={() => setProcessToDelete(null)}>
                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription>Se eliminará el proceso "<strong>{processToDelete.name}</strong>". Los subprocesos y usuarios pasarán al nivel superior.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel disabled={isDeletingProcess}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteProcess} disabled={isDeletingProcess} className={cn(buttonVariants({ variant: 'destructive'}))}>{isDeletingProcess && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                 </AlertDialog>
            )}
        </UsersPageContext.Provider>
    );
}
