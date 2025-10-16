// src/app/(app)/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Edit, Trash2, UserPlus, Loader2, AlertTriangle, MoreVertical, UserCheck, UserX, Filter, Check, Network, GripVertical, Users as UsersIcon, List, Grid } from 'lucide-react';
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
import { getProcessColors, getInitials } from '@/lib/utils';
import { getRoleBadgeVariant, getRoleInSpanish } from '@/lib/security-log-utils';
import { Identicon } from '@/components/ui/identicon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DndContext, useDraggable, useDroppable, DragOverlay, type DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { UserFormModal } from '@/components/users/user-form-modal';
import { ProcessFormModal } from '@/components/users/process-form-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useDebounce } from '@/hooks/use-debounce';

// --- TYPES ---
interface ProcessWithChildren extends Process {
  users: (Pick<User, 'id' | 'name' | 'avatar'>)[];
  children: ProcessWithChildren[];
}
interface UserWithProcess extends User {
    process: { id: string; name: string } | null;
}

const PAGE_SIZE = 12;

// --- Draggable User Row for Table View ---
const DraggableUserTableRow = ({ user, ...props }: { user: UserWithProcess, isOverlay?: boolean } & React.HTMLAttributes<HTMLDivElement>) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: user.id,
        data: { type: 'user', user }
    });

    return (
        <TableRow ref={setNodeRef} {...props} className={cn(isDragging && "opacity-50")}>
            <TableCell className="w-[50px]">
                <div {...attributes} {...listeners} className="cursor-grab p-1 touch-none flex items-center justify-center">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar || undefined} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
                <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleInSpanish(user.role)}</Badge>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
                <Badge variant={user.isActive ? 'default' : 'destructive'} className={cn(user.isActive && 'bg-green-500 hover:bg-green-600')}>{user.isActive ? 'Activo' : 'Inactivo'}</Badge>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
                 {user.process ? (
                    <Badge variant="secondary">{user.process.name}</Badge>
                 ) : (
                    <span className="text-xs text-muted-foreground italic">Sin asignar</span>
                 )}
            </TableCell>
            <TableCell className="text-right">{props.children}</TableCell>
        </TableRow>
    )
}

// --- Draggable User Card for Grid View ---
const DraggableUserGridCard = ({ user, ...props }: { user: UserWithProcess, isOverlay?: boolean } & React.HTMLAttributes<HTMLDivElement>) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: user.id,
        data: { type: 'user', user }
    });

    return (
        <div ref={setNodeRef} {...props} className={cn(isDragging && 'opacity-50')}>
             <Card className="h-full flex flex-col transition-shadow hover:shadow-md">
                <CardHeader className="flex-row items-center gap-4 p-4">
                     <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar || undefined} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                     <div className="flex-grow overflow-hidden">
                        <CardTitle className="text-base truncate">{user.name}</CardTitle>
                        <CardDescription className="truncate text-xs">{user.email}</CardDescription>
                    </div>
                    <div {...listeners} {...attributes} className="cursor-grab p-2 -mr-2 text-muted-foreground hover:text-foreground">
                        <GripVertical className="h-5 w-5"/>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow space-y-2">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="w-full justify-center">{getRoleInSpanish(user.role)}</Badge>
                    {user.process ? (
                       <Badge variant="secondary" className="w-full justify-center text-center">{user.process.name}</Badge>
                    ) : (
                       <Badge variant="outline" className="w-full justify-center text-center">Sin Asignar</Badge>
                    )}
                </CardContent>
                <CardFooter className="p-2 border-t flex justify-end">
                    {props.children}
                </CardFooter>
            </Card>
        </div>
    )
}


// --- Main Page Component ---
export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const { setPageTitle } = useTitle();

    const [usersList, setUsersList] = useState<UserWithProcess[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [processes, setProcesses] = useState<ProcessWithChildren[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [userToEdit, setUserToEdit] = useState<UserWithProcess | null>(null);
    const [processToEdit, setProcessToEdit] = useState<ProcessWithChildren | null>(null);
    const [processToDelete, setProcessToDelete] = useState<ProcessWithChildren | null>(null);
    const [isDeletingProcess, setIsDeletingProcess] = useState(false);
    
    const [showUserModal, setShowUserModal] = useState(false);
    const [showProcessModal, setShowProcessModal] = useState(false);
    
    const [activeDraggable, setActiveDraggable] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    const searchTerm = searchParams.get('search') || '';
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const currentPage = Number(searchParams.get('page')) || 1;
    
    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        const userParams = new URLSearchParams();
        if (debouncedSearchTerm) userParams.set('search', debouncedSearchTerm);
        if (currentPage) userParams.set('page', String(currentPage));
        userParams.set('pageSize', String(PAGE_SIZE));
        
        try {
            const [usersRes, processesRes] = await Promise.all([
                fetch(`/api/users?${userParams.toString()}`),
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
    }, [currentUser, debouncedSearchTerm, currentPage, toast]);
    
    const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

    useEffect(() => {
        setPageTitle('Control Central');
        if (currentUser?.role !== 'ADMINISTRATOR') return;
        fetchData();
    }, [currentUser, fetchData, setPageTitle]);
    
    const createQueryString = useCallback((paramsToUpdate: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(paramsToUpdate).forEach(([name, value]) => {
          if (value === null || value === '' || value === 'all') params.delete(name);
          else params.set(name, String(value));
      });
      return params.toString();
    }, [searchParams]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      router.push(`${pathname}?${createQueryString({ search: e.target.value, page: 1 })}`);
    };

    const handlePageChange = (page: number) => {
        router.push(`${pathname}?${createQueryString({ page })}`);
    };
    
    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveDraggable(null);
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const userId = active.id as string;
            const processId = over.id as string;
            try {
                const res = await fetch('/api/processes/assign', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ processId, userIds: [userId] }),
                });
                if (!res.ok) throw new Error((await res.json()).message);
                toast({ title: "Usuario Asignado", description: "El usuario ha sido movido al nuevo proceso."});
                fetchData();
            } catch (err) {
                toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
            }
        }
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
    
    const UserTable = () => (
         <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"><span className="sr-only">Arrastrar</span></TableHead>
                            <TableHead>Colaborador</TableHead>
                            <TableHead className="hidden md:table-cell">Rol</TableHead>
                            <TableHead className="hidden lg:table-cell">Estado</TableHead>
                            <TableHead className="hidden lg:table-cell">Proceso</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? [...Array(5)].map((_,i) => (
                            <TableRow key={i}>
                                <TableCell colSpan={6}><Skeleton className="h-[68px] w-full" /></TableCell>
                            </TableRow>
                        )) : usersList.map(u => (
                            <DraggableUserTableRow key={u.id} user={u}>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => {setUserToEdit(u); setShowUserModal(true);}}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                        <DropdownMenuSeparator/>
                                        <DropdownMenuItem onSelect={() => {}} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4"/>Inactivar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </DraggableUserTableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
    
     const UserGrid = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
             {isLoading ? [...Array(8)].map((_,i) => <Skeleton key={i} className="h-48 w-full" />) :
                usersList.map(u => (
                    <DraggableUserGridCard key={u.id} user={u}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4"/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => {setUserToEdit(u); setShowUserModal(true);}}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </DraggableUserGridCard>
                ))
            }
        </div>
    );
    
    const ProcessTree = () => (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1"><CardTitle className="flex items-center gap-2"><Network />Estructura</CardTitle><CardDescription>Arrastra usuarios aquí.</CardDescription></div>
                <Button size="sm" variant="outline" onClick={() => { setProcessToEdit(null); setShowProcessModal(true);}}><PlusCircle className="mr-2 h-4 w-4"/>Crear</Button>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[60vh] pr-4">
                    {isLoading ? <Skeleton className="h-full w-full"/> : 
                     processes.map(p => <ProcessDropZone key={p.id} process={p} onEdit={(process) => {setProcessToEdit(process); setShowProcessModal(true);}} onDelete={setProcessToDelete} />)
                    }
                </ScrollArea>
            </CardContent>
        </Card>
    );

     const ProcessDropZone = ({ process, onEdit, onDelete }: { process: ProcessWithChildren, onEdit: (p: ProcessWithChildren) => void, onDelete: (p: ProcessWithChildren) => void }) => {
        const { isOver, setNodeRef } = useDroppable({ id: process.id, data: { type: 'process' } });
        const colors = getProcessColors(process.id);

        return (
            <div ref={setNodeRef} className={cn("pl-4 relative transition-colors my-1", isOver && 'bg-primary/10 rounded-md')}>
                 <div className="absolute left-2 top-0 bottom-0 w-px bg-border -z-10" />
                <div className="flex items-center justify-between group py-1.5">
                    <div className="flex items-center gap-2 flex-grow min-w-0">
                        <div className="absolute left-[3px] top-3 h-2 w-2 rounded-full border-2 border-background" style={{ backgroundColor: colors.raw.medium }}/>
                        <span className="font-semibold truncate">{process.name}</span>
                        <Badge variant="secondary" className="rounded-full">{process.users.length}</Badge>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                         <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); onEdit(process)}}><Edit className="h-4 w-4"/></Button>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => {e.stopPropagation(); onDelete(process)}}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                </div>
                {process.children && process.children.length > 0 && (
                     <div className="ml-2 pl-2 border-l-2" style={{borderColor: colors.raw.light}}>
                        {process.children.map(child => <ProcessDropZone key={child.id} process={child} onEdit={onEdit} onDelete={onDelete}/>)}
                    </div>
                )}
            </div>
        );
    };

    
    if (!currentUser || currentUser.role !== 'ADMINISTRATOR') return <div className="text-center p-8"><AlertTriangle className="mx-auto h-12 w-12 text-destructive"/>Acceso Denegado</div>;

    return (
        <DndContext onDragStart={(e) => setActiveDraggable(e.active)} onDragEnd={handleDragEnd}>
            <div className="space-y-6">
                 <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                     <div className="space-y-1 flex-grow">
                        <h2 className="text-2xl font-semibold">Control Central</h2>
                        <p className="text-muted-foreground">Gestiona los colaboradores y la estructura de procesos de la organización.</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative w-full sm:w-64">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <Input placeholder="Buscar colaborador..." value={searchTerm} onChange={handleSearchChange} className="pl-10"/>
                        </div>
                        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                            <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('table')}><List className="h-4 w-4"/></Button>
                            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}><Grid className="h-4 w-4"/></Button>
                        </div>
                         <Button size="sm" onClick={() => { setUserToEdit(null); setShowUserModal(true); }}><UserPlus className="mr-2 h-4 w-4"/> Añadir</Button>
                    </div>
                 </header>
                
                {isMobile ? (
                    <Tabs defaultValue="users" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="users">Colaboradores</TabsTrigger>
                            <TabsTrigger value="processes">Estructura</TabsTrigger>
                        </TabsList>
                        <TabsContent value="users" className="mt-4"><UserGrid /></TabsContent>
                        <TabsContent value="processes" className="mt-4"><ProcessTree/></TabsContent>
                    </Tabs>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2">
                             {viewMode === 'table' ? <UserTable/> : <UserGrid/>}
                             {totalPages > 1 && !isLoading && <SmartPagination className="mt-4" currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}
                        </div>
                        <div className="lg:col-span-1 lg:sticky lg:top-24"><ProcessTree/></div>
                    </div>
                )}
            </div>
             <DragOverlay>
                {activeDraggable?.data.current?.type === 'user' ? (
                    <Card className="flex items-center p-3 gap-3 shadow-2xl scale-105 bg-card">
                         <GripVertical className="h-5 w-5 text-muted-foreground" />
                         <Avatar className="h-10 w-10">
                            <AvatarImage src={activeDraggable.data.current.user.avatar || undefined} />
                            <AvatarFallback>{getInitials(activeDraggable.data.current.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{activeDraggable.data.current.user.name}</p>
                            <p className="text-xs text-muted-foreground">{activeDraggable.data.current.user.email}</p>
                        </div>
                    </Card>
                ) : null}
            </DragOverlay>
            {showUserModal && <UserFormModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} onSave={fetchData} user={userToEdit} processes={processes} />}
            {(showProcessModal || processToEdit) && <ProcessFormModal isOpen={showProcessModal || !!processToEdit} onClose={() => { setShowProcessModal(false); setProcessToEdit(null); }} onSave={fetchData} process={processToEdit} allProcesses={processes} />}
            {processToDelete && (
                 <AlertDialog open={!!processToDelete} onOpenChange={() => setProcessToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription>Se eliminará el proceso "<strong>{processToDelete.name}</strong>". Los subprocesos y usuarios pasarán al nivel superior.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                           <AlertDialogCancel disabled={isDeletingProcess}>Cancelar</AlertDialogCancel>
                           <AlertDialogAction onClick={handleDeleteProcess} disabled={isDeletingProcess} className={cn(buttonVariants({ variant: 'destructive'}))}>
                            {isDeletingProcess && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Eliminar
                           </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
            )}
        </DndContext>
    );
}
