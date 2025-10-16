
// src/app/(app)/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Edit, Trash2, UserPlus, Loader2, MoreVertical, GripVertical, Users as UsersIcon, List, Grid, SlidersHorizontal, Briefcase, Filter, X, Check, MessageSquare } from 'lucide-react';
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
import { getProcessColors } from '@/lib/utils';
import { getRoleInSpanish } from '@/lib/security-log-utils';
import { DndContext, useDraggable, useDroppable, DragOverlay, type DragEndEvent, type Active, type Over, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { UserFormModal } from '@/components/users/user-form-modal';
import { ProcessFormModal } from '@/components/users/process-form-modal';
import { UserProfileCard } from '@/components/profile/user-profile-card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDebounce } from '@/hooks/use-debounce';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { Identicon } from '@/components/ui/identicon';
import { AlertTriangle } from 'lucide-react';
import { ProcessTree } from '@/components/users/process-tree';
import { BulkAssignModal } from '@/components/users/bulk-assign-modal';
import { AnimatePresence, motion } from 'framer-motion';

// --- TYPES & CONTEXT ---
interface ProcessWithChildren extends Process {
    users: (Pick<User, 'id' | 'name' | 'avatar'>)[];
    children: ProcessWithChildren[];
}
interface UserWithProcess extends User {
    process: { id: string; name: string } | null;
}

const PAGE_SIZE = 12;

const DraggableUserCard = ({ user, isSelected, onSelectionChange }: { user: UserWithProcess, isSelected: boolean, onSelectionChange: (id: string, selected: boolean) => void }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: user.id });
    
    return (
        <div ref={setNodeRef} {...attributes} {...listeners} className={cn("touch-none", isDragging && "opacity-30")}>
            <div className="relative">
                <UserProfileCard user={user} />
                 <div className="absolute top-2 left-2">
                    <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelectionChange(user.id, !!checked)} className="bg-background border-primary" />
                </div>
            </div>
        </div>
    )
}

const UserTable = ({ users, onSelectionChange, selectedUserIds }: { users: UserWithProcess[], onSelectionChange: (id: string, selected: boolean) => void, selectedUserIds: Set<string> }) => {
    const router = useRouter();

    return (
         <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox 
                                checked={users.length > 0 && users.every(u => selectedUserIds.has(u.id))}
                                onCheckedChange={(checked) => {
                                    const allPageIds = users.map(u => u.id);
                                    if(checked) {
                                        onSelectionChange('all', true);
                                    } else {
                                        onSelectionChange('all', false);
                                    }
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
                    {users.map(user => (
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
                                        <AvatarFallback><Identicon userId={user.id} /></AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell><Badge variant={getRoleBadgeVariant(user.role)}>{getRoleInSpanish(user.role)}</Badge></TableCell>
                            <TableCell>
                                {user.process ? (
                                    <Badge style={{ backgroundColor: getProcessColors(user.process.id).raw.light, color: getProcessColors(user.process.id).raw.dark }}>
                                        {user.process.name}
                                    </Badge>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Sin asignar</span>
                                )}
                            </TableCell>
                            <TableCell><Badge variant={user.isActive ? 'default' : 'secondary'} className={cn(user.isActive ? 'bg-green-500' : 'bg-gray-400', 'text-white')}>{user.isActive ? 'Activo' : 'Inactivo'}</Badge></TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => router.push(`/messages?new=${user.id}`)}>
                                            <MessageSquare className="mr-2 h-4 w-4"/>Enviar Mensaje
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
};

// --- MAIN PAGE COMPONENT ---
export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const { setPageTitle } = useTitle();

    const [usersList, setUsersList] = useState<UserWithProcess[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [processes, setProcesses] = useState<ProcessWithChildren[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    
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
    
    const [activeDraggable, setActiveDraggable] = useState<Active | null>(null);
    const draggedUser = useMemo(() => {
        if (!activeDraggable) return null;
        return usersList.find(u => u.id === activeDraggable.id)
    }, [activeDraggable, usersList]);

    const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 10, }, }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5, }, }));
    
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);

    const handleSelectionChange = (userId: string, isSelected: boolean) => {
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
    };
    
    const createQueryString = useCallback((paramsToUpdate: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(paramsToUpdate).forEach(([name, value]) => {
          if (value === null || value === '' || (name === 'role' && value === 'ALL') || (name === 'status' && value === 'ALL') || (name === 'processId' && value === 'ALL')) params.delete(name);
          else params.set(name, String(value));
      });
      return params.toString();
    }, [searchParams]);
    
    const activeFilters = { search, role, status, processId };

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

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveDraggable(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        
        const userId = active.id as string;
        const targetProcessId = over.id as string;

        const originalUsers = [...usersList];
        setUsersList(prev => prev.map(u => 
            u.id === userId 
                ? { ...u, processId: targetProcessId, process: processes.flatMap(p => p.children.concat(p)).find(p => p.id === targetProcessId) || null }
                : u
        ));

        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ processId: targetProcessId }),
            });
            if (!res.ok) throw new Error("No se pudo asignar el proceso.");
            
            toast({ title: "Usuario Asignado", description: "El colaborador ha sido movido al nuevo proceso."});
            fetchData();
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
            setUsersList(originalUsers);
        }
    };
    
    const flattenProcesses = (processList: Process[], level = 0): FlatProcess[] => {
      let flatList: FlatProcess[] = [];
      processList.forEach(p => {
          flatList.push({ id: p.id, name: p.name, level });
          if (p.children && p.children.length > 0) {
              flatList.push(...flattenProcesses(p.children, level + 1));
          }
      });
      return flatList;
  };
  const flattenedProcesses = flattenProcesses(processes);

    if (!currentUser || currentUser.role !== 'ADMINISTRATOR') {
        return <div className="text-center p-8"><AlertTriangle className="mx-auto h-12 w-12 text-destructive"/>Acceso Denegado</div>;
    }

    return (
        <DndContext sensors={sensors} onDragStart={(e) => setActiveDraggable(e.active)} onDragEnd={handleDragEnd}>
            <div className="space-y-6">
                 <Card>
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="relative w-full md:max-w-xs">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                             <Input placeholder="Buscar por nombre o email..." value={search} onChange={handleSearchChange} className="pl-10"/>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full sm:w-auto justify-start">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filtros ({Object.values(activeFilters).filter(v => v && v !== 'ALL').length})
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0" align="end">
                                    <div className="p-4 space-y-4">
                                        <div className="space-y-2">
                                            <Label>Rol</Label>
                                            <Select value={role || 'ALL'} onValueChange={(v) => handleFilterChange('role', v)}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="ADMINISTRATOR">Admin</SelectItem><SelectItem value="INSTRUCTOR">Instructor</SelectItem><SelectItem value="STUDENT">Estudiante</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                         <div className="space-y-2">
                                            <Label>Estado</Label>
                                            <Select value={status || 'ALL'} onValueChange={(v) => handleFilterChange('status', v)}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="active">Activo</SelectItem><SelectItem value="inactive">Inactivo</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Proceso</Label>
                                            <Select value={processId || 'ALL'} onValueChange={(v) => handleFilterChange('processId', v)}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">Todos</SelectItem>
                                                    <SelectItem value="unassigned">Sin Asignar</SelectItem>
                                                    <Separator/>
                                                    {flattenedProcesses.map(p => (
                                                        <SelectItem key={p.id} value={p.id} style={{ paddingLeft: `${p.level * 1.5 + 1}rem` }}>{p.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full sm:w-auto justify-start"><Grid className="mr-2 h-4 w-4" />Vista</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => setViewMode('grid')}><Grid className="mr-2 h-4 w-4"/>Cuadrícula</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setViewMode('table')}><List className="mr-2 h-4 w-4"/>Tabla</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                             <Button onClick={() => handleOpenUserModal(null)} className="w-full sm:w-auto"><UserPlus className="mr-2 h-4 w-4"/>Añadir Colaborador</Button>
                        </div>
                    </CardContent>
                </Card>

                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    <div className="lg:col-span-3">
                         {isLoading ? (
                            viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(8)].map((_,i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
                            ) : (
                                <Card><CardContent className="p-4"><Skeleton className="h-96 w-full"/></CardContent></Card>
                            )
                        ) : usersList.length > 0 ? (
                           viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {usersList.map(u => (
                                        <DraggableUserCard key={u.id} user={u} isSelected={selectedUserIds.has(u.id)} onSelectionChange={handleSelectionChange}/>
                                    ))}
                                </div>
                           ) : (
                                <UserTable users={usersList} selectedUserIds={selectedUserIds} onSelectionChange={handleSelectionChange} />
                           )
                        ) : (
                           <div className="text-center py-16 border-2 border-dashed rounded-lg col-span-full">
                                <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                                <h3 className="text-xl font-semibold mb-2">No se encontraron colaboradores</h3>
                                <p className="text-muted-foreground">Prueba a ajustar los filtros o a añadir un nuevo colaborador.</p>
                           </div>
                        )}
                         {totalPages > 1 && <SmartPagination className="mt-6" currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}
                    </div>

                    <aside className="lg:col-span-1 lg:sticky lg:top-24">
                        <ProcessTree processes={processes} onProcessUpdate={fetchData} onProcessClick={(id) => handleFilterChange('processId', id)} activeProcessId={processId}/>
                    </aside>
                </div>
            </div>
             <DragOverlay dropAnimation={null}>
                {draggedUser ? <UserProfileCard user={draggedUser} /> : null}
            </DragOverlay>
            
            <AnimatePresence>
                {selectedUserIds.size > 0 && (
                    <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-4 left-1/2 -translate-x-1/2 w-auto">
                        <Card className="shadow-2xl flex items-center gap-4 p-2">
                           <p className="text-sm font-semibold px-2">{selectedUserIds.size} seleccionados</p>
                           <Button size="sm" onClick={() => setIsBulkAssignModalOpen(true)}><Briefcase className="mr-2 h-4 w-4"/> Asignar Proceso</Button>
                           <Button size="sm" variant="ghost" onClick={() => setSelectedUserIds(new Set())}>Limpiar</Button>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {showUserModal && <UserFormModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} onSave={fetchData} user={userToEdit} processes={processes} />}
            {isBulkAssignModalOpen && <BulkAssignModal isOpen={isBulkAssignModalOpen} onClose={() => setIsBulkAssignModalOpen(false)} onSave={fetchData} userIds={Array.from(selectedUserIds)} processes={processes}/>}
        </DndContext>
    )
}
