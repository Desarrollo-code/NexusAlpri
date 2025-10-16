// src/app/(app)/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Edit, Trash2, UserPlus, Loader2, AlertTriangle, MoreHorizontal, UserCheck, UserX, Filter, Check, Network, GripVertical, Users as UsersIcon, Briefcase } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { getProcessColors } from '@/lib/utils';
import { getRoleBadgeVariant, getRoleInSpanish } from '@/lib/security-log-utils';
import { Identicon } from '@/components/ui/identicon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DndContext, useDraggable, useDroppable, DragOverlay, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UserFormModal } from '@/components/users/user-form-modal';
import { ProcessFormModal } from '@/components/users/process-form-modal';
import { ScrollArea } from '@/components/ui/scroll-area';

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
const DraggableUserRow = ({ user, colors, ...props }: { user: UserWithProcess, colors: any }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: user.id,
        data: { type: 'user', user }
    });

    return (
        <TableRow 
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={cn(
                "touch-none",
                isDragging && "opacity-50",
                !user.isActive && "opacity-60"
            )}
            {...props}
        >
            <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9"><AvatarImage src={user.avatar || undefined} alt={user.name} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
                    <div className="font-medium">{user.name}</div>
                </div>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell><Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">{getRoleInSpanish(user.role)}</Badge></TableCell>
            <TableCell>
                {user.process ? (
                    <Badge variant="outline" style={{ backgroundColor: colors?.raw.light, color: colors?.raw.dark, borderColor: colors?.raw.medium }} className="border">{user.process.name}</Badge>
                ) : <span className="text-xs text-muted-foreground">Sin asignar</span>}
            </TableCell>
             <TableCell><Badge variant={user.isActive ? 'default' : 'destructive'} className={cn(user.isActive && "bg-green-600 hover:bg-green-700")}>{user.isActive ? 'Activo' : 'Inactivo'}</Badge></TableCell>
             <TableCell>{/* Action Menu will be here */}</TableCell>
        </TableRow>
    );
};

const ProcessDropZone = ({ process, onEdit, onDelete }: { process: ProcessWithChildren, onEdit: (p: ProcessWithChildren) => void, onDelete: (p: ProcessWithChildren) => void }) => {
    const { isOver, setNodeRef } = useDroppable({ id: process.id, data: { type: 'process' } });
    const colors = getProcessColors(process.id);

    return (
        <div ref={setNodeRef} className={cn("pl-4", isOver && 'bg-primary/10 rounded-md')}>
            <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2 py-1 flex-grow">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.raw.medium }} />
                    <span className="font-semibold">{process.name}</span>
                    <Badge variant="secondary">{process.users.length}</Badge>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(process)}><Edit className="h-4 w-4"/></Button>
                     <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(process)}><Trash2 className="h-4 w-4"/></Button>
                </div>
            </div>
            {process.children && process.children.length > 0 && (
                 <div className="border-l-2 ml-1" style={{borderColor: colors.raw.light}}>
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
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [userToEdit, setUserToEdit] = useState<UserWithProcess | null>(null);
    const [processToEdit, setProcessToEdit] = useState<ProcessWithChildren | null>(null);
    const [processToDelete, setProcessToDelete] = useState<ProcessWithChildren | null>(null);
    
    const [showUserModal, setShowUserModal] = useState(false);
    const [showProcessModal, setShowProcessModal] = useState(false);

    const [activeDraggable, setActiveDraggable] = useState<any>(null);

    const searchTerm = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || 'all';
    const statusFilter = searchParams.get('status') || 'all';
    const currentPage = Number(searchParams.get('page')) || 1;
    const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

    const fetchData = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        setError(null);
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
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, searchParams]);

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

    const handleFilterChange = (filterType: 'search' | 'role' | 'status', value: string) => {
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
    
    const UserTable = () => (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Rol</TableHead><TableHead>Proceso</TableHead><TableHead>Estado</TableHead><TableHead><span className="sr-only">Acciones</span></TableHead></TableRow></TableHeader>
                <TableBody>
                    {isLoading ? [...Array(5)].map((_,i) => (<TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>)) :
                     usersList.map(u => {
                         const colors = u.process ? getProcessColors(u.process.id) : null;
                         return <DraggableUserRow key={u.id} user={u} colors={colors}/>
                     })}
                </TableBody>
             </Table>
             { totalPages > 1 && !isLoading && <div className="p-4"><SmartPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /></div> }
        </div>
    );
    
    const ProcessTree = () => (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1"><CardTitle className="flex items-center gap-2"><Network />Estructura Organizacional</CardTitle><CardDescription>Arrastra usuarios a un proceso.</CardDescription></div>
                <Button size="sm" variant="outline" onClick={() => { setProcessToEdit(null); setShowProcessModal(true);}}><PlusCircle className="mr-2 h-4 w-4"/>Crear</Button>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[60vh] pr-4">
                    {isLoading ? <Skeleton className="h-full w-full"/> : 
                     processes.map(p => <ProcessDropZone key={p.id} process={p} onEdit={setProcessToEdit} onDelete={setProcessToDelete} />)
                    }
                </ScrollArea>
            </CardContent>
        </Card>
    );
    
    if (!currentUser || currentUser.role !== 'ADMINISTRATOR') return <div className="text-center p-8"><AlertTriangle className="mx-auto h-12 w-12 text-destructive"/>Acceso Denegado</div>;

    if (isMobile) {
        return (
            <Tabs defaultValue="users" className="w-full">
                <div className="flex justify-between items-center mb-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="users">Colaboradores</TabsTrigger>
                        <TabsTrigger value="processes">Estructura</TabsTrigger>
                    </TabsList>
                    <Button size="icon" variant="ghost" onClick={() => { setShowUserModal(true); setUserToEdit(null); }}><UserPlus className="h-5 w-5"/></Button>
                </div>
                <TabsContent value="users"><UserTable /></TabsContent>
                <TabsContent value="processes"><ProcessTree/></TabsContent>
            </Tabs>
        )
    }

    return (
        <DndContext onDragStart={(e) => setActiveDraggable(e.active)} onDragEnd={handleDragEnd}>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-semibold">Control Central</h2>
                        <p className="text-muted-foreground">Gestiona los colaboradores y la estructura de procesos de la organización.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2"><UserTable/></div>
                    <div className="lg:col-span-1 lg:sticky lg:top-24"><ProcessTree/></div>
                </div>
            </div>
             <DragOverlay>
                {activeDraggable?.data.current?.type === 'user' ? (
                    <div className="p-2 bg-primary text-primary-foreground rounded-lg shadow-xl font-semibold">{activeDraggable.data.current.user.name}</div>
                ) : null}
            </DragOverlay>
            {showUserModal && <UserFormModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} onSave={fetchData} user={userToEdit} processes={processes} />}
            {processToEdit && <ProcessFormModal isOpen={!!processToEdit} onClose={() => setProcessToEdit(null)} onSave={fetchData} process={processToEdit} allProcesses={processes} />}
            {processToDelete && <AlertDialog open={!!processToDelete} onOpenChange={() => setProcessToDelete(null)}><AlertDialogContent>...</AlertDialogContent></AlertDialog>}
        </DndContext>
    );
}
```