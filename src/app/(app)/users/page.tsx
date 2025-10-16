
// src/app/(app)/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Edit, Trash2, UserPlus, Loader2, AlertTriangle, MoreVertical, UserCheck, UserX, Filter, Check, Network, GripVertical, Users as UsersIcon } from 'lucide-react';
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
import type { User, UserRole, Process } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

const PAGE_SIZE = 10;

// --- Components ---

const DraggableUserCard = ({ user, ...props }: { user: UserWithProcess, isOverlay?: boolean } & React.HTMLAttributes<HTMLDivElement>) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: user.id,
        data: { type: 'user', user }
    });

    return (
        <div ref={setNodeRef}>
            <Card className={cn(
                "flex items-center p-3 gap-3 transition-shadow",
                !user.isActive && "opacity-60",
                isDragging && "shadow-lg",
                props.isOverlay && "shadow-2xl scale-105"
            )}>
                 <div {...attributes} {...listeners} className="cursor-grab p-1 touch-none">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
                <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow overflow-hidden">
                    <p className="font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                 <div className="flex items-center gap-2 text-xs shrink-0">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="hidden sm:inline-flex">{getRoleInSpanish(user.role)}</Badge>
                    <Badge variant={user.isActive ? 'default' : 'destructive'} className={cn(user.isActive && 'bg-green-500 hover:bg-green-600')}>{user.isActive ? 'Activo' : 'Inactivo'}</Badge>
                </div>
                {props.children}
            </Card>
        </div>
    )
}

const ProcessDropZone = ({ process, onEdit, onDelete }: { process: ProcessWithChildren, onEdit: (p: ProcessWithChildren) => void, onDelete: (p: ProcessWithChildren) => void }) => {
    const { isOver, setNodeRef } = useDroppable({ id: process.id, data: { type: 'process' } });
    const colors = getProcessColors(process.id);

    return (
        <div ref={setNodeRef} className={cn("pl-4 relative transition-colors", isOver && 'bg-primary/10 rounded-md')}>
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

    const searchTerm = searchParams.get('search') || '';
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const roleFilter = searchParams.get('role') || 'all';
    const statusFilter = searchParams.get('status') || 'all';
    const processFilter = searchParams.get('processId') || 'all';
    const currentPage = Number(searchParams.get('page')) || 1;
    
    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        const userParams = new URLSearchParams(searchParams.toString());
        
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
    }, [currentUser, searchParams, toast]);
    
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

    const handleFilterChange = (filterType: 'search' | 'role' | 'status' | 'processId', value: string) => {
        router.push(`${pathname}?${createQueryString({ [filterType]: value, page: 1 })}`);
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
            <CardHeader>
                <div className="flex items-center justify-between">
                     <CardTitle>Colaboradores ({totalUsers})</CardTitle>
                      <Input
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="max-w-xs"
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {isLoading ? [...Array(5)].map((_,i) => <Skeleton key={i} className="h-[76px] w-full" />) :
                usersList.map(u => (
                    <DraggableUserCard key={u.id} user={u}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="h-4 w-4"/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => {setUserToEdit(u); setShowUserModal(true);}}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem onSelect={() => {}} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4"/>Inactivar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </DraggableUserCard>
                ))}
            </CardContent>
             { totalPages > 1 && !isLoading && <CardFooter><SmartPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /></CardFooter> }
        </Card>
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
    
    if (!currentUser || currentUser.role !== 'ADMINISTRATOR') return <div className="text-center p-8"><AlertTriangle className="mx-auto h-12 w-12 text-destructive"/>Acceso Denegado</div>;

    return (
        <DndContext onDragStart={(e) => setActiveDraggable(e.active)} onDragEnd={handleDragEnd}>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-semibold">Control Central</h2>
                        <p className="text-muted-foreground">Gestiona los colaboradores y la estructura de procesos de la organización.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => { setUserToEdit(null); setShowUserModal(true); }}><UserPlus className="mr-2 h-4 w-4"/> Añadir Colaborador</Button>
                    </div>
                </div>
                
                {isMobile ? (
                    <Tabs defaultValue="users" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="users">Colaboradores</TabsTrigger>
                            <TabsTrigger value="processes">Estructura</TabsTrigger>
                        </TabsList>
                        <TabsContent value="users" className="mt-4"><UserTable /></TabsContent>
                        <TabsContent value="processes" className="mt-4"><ProcessTree/></TabsContent>
                    </Tabs>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2"><UserTable/></div>
                        <div className="lg:col-span-1 lg:sticky lg:top-24"><ProcessTree/></div>
                    </div>
                )}
            </div>
             <DragOverlay>
                {activeDraggable?.data.current?.type === 'user' ? (
                   <DraggableUserCard user={activeDraggable.data.current.user} isOverlay />
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

