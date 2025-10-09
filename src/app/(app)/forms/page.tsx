// src/app/(app)/forms/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, FileText, Share2, Users, FilePen, Trash2, Eye, BarChart, MoreVertical, Loader2, AlertTriangle, ShieldAlert, ArrowRight, User as UserIcon, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import type { AppForm, FormStatus, User as AppUser } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SmartPagination } from '@/components/ui/pagination';
import { useTitle } from '@/contexts/title-context';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';

const PAGE_SIZE = 9;

const getStatusDetails = (status: FormStatus) => {
    switch (status) {
        case 'DRAFT': return { label: 'Borrador', color: 'bg-yellow-500' };
        case 'PUBLISHED': return { label: 'Publicado', color: 'bg-green-500' };
        case 'ARCHIVED': return { label: 'Archivado', color: 'bg-red-500' };
        default: return { label: 'Desconocido', color: 'bg-gray-500' };
    }
};

const FormCard = ({ form, onAction, onLaunchGame }: { form: AppForm, onAction: (action: 'edit' | 'delete' | 'share' | 'results', form: AppForm) => void, onLaunchGame: (formId: string) => void }) => {
    const statusDetails = getStatusDetails(form.status);
    
    return (
        <Card className="flex flex-col h-full group card-border-animated">
             <Link href={`/forms/${form.id}/edit`} className="flex flex-col flex-grow">
                <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base font-headline leading-tight mb-1 line-clamp-2">{form.title}</CardTitle>
                    </div>
                    <CardDescription className="text-xs line-clamp-2 h-8">{form.description || 'Sin descripción.'}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow"></CardContent>
            </Link>
            <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", statusDetails.color)} />
                    <span>{statusDetails.label}</span>
                </div>
                 <div className="flex items-center gap-4">
                    <span>{form._count.responses} respuesta{form._count.responses !== 1 && 's'}</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mr-2"><MoreVertical className="h-4 w-4"/></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {form.isQuiz && <DropdownMenuItem onClick={() => onLaunchGame(form.id)}><Zap className="mr-2 h-4 w-4 text-primary"/>Iniciar Quizz-IT</DropdownMenuItem>}
                            {form.isQuiz && <DropdownMenuSeparator />}
                            <DropdownMenuItem onClick={() => onAction('edit', form)}><FilePen className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAction('results', form)}><BarChart className="mr-2 h-4 w-4"/>Resultados</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAction('share', form)}><Share2 className="mr-2 h-4 w-4"/>Compartir</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAction('delete', form)} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                 </div>
            </CardFooter>
        </Card>
    );
};

const FormCreationModal = ({ open, onOpenChange, onFormCreated }: { open: boolean, onOpenChange: (open: boolean) => void, onFormCreated: (newForm: AppForm) => void }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast({ title: 'Error', description: 'El título es obligatorio.', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/forms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description }),
            });
            if (!res.ok) throw new Error((await res.json()).message || 'No se pudo crear el formulario.');
            const newForm = await res.json();
            toast({ title: '¡Éxito!', description: 'El formulario ha sido creado. Ahora puedes añadirle preguntas.' });
            onFormCreated(newForm);
            setTitle('');
            setDescription('');
        } catch (err) {
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-lg p-0">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle>Crear Nuevo Formulario</DialogTitle>
                    <DialogDescription>Comienza con un título y una descripción. Podrás añadir las preguntas después.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} id="create-form">
                    <div className="space-y-4 px-6 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="form-title">Título del Formulario</Label>
                            <Input id="form-title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSubmitting} placeholder="Ej: Encuesta de Satisfacción"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="form-description">Descripción (Opcional)</Label>
                            <Textarea id="form-description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSubmitting} placeholder="Describe el propósito de este formulario..."/>
                        </div>
                    </div>
                </form>
                 <DialogFooter className="p-6 pt-4 bg-muted/50 rounded-b-lg">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" form="create-form" disabled={isSubmitting || !title.trim()}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Crear y Continuar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ShareFormModal = ({ form, isOpen, onOpenChange, onShareSuccess }: { form: AppForm | null, isOpen: boolean, onOpenChange: (open: boolean) => void, onShareSuccess: () => void }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setIsLoading(true);
            fetch('/api/users/list')
                .then(res => res.json())
                .then(data => setAllUsers(data.users.filter((u: AppUser) => u.id !== user.id)))
                .catch(() => toast({ title: "Error", description: "No se pudo cargar la lista de usuarios.", variant: "destructive" }))
                .finally(() => setIsLoading(false));
            
            setSharedWithUserIds(form?.sharedWith?.map(u => u.id) || []);
        }
    }, [isOpen, user, form, toast]);

    const filteredUsers = React.useMemo(() => {
        return allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));
    }, [allUsers, userSearch]);
    
    const handleUserShareToggle = (userId: string, checked: boolean) => {
        setSharedWithUserIds(prev => checked ? [...prev, userId] : prev.filter(id => id !== userId));
    }

    const handleSaveChanges = async () => {
        if (!form) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/forms/${form.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sharedWithUserIds }),
            });
            if (!res.ok) throw new Error((await res.json()).message || 'No se pudo compartir el formulario.');
            toast({ title: '¡Éxito!', description: 'Se han guardado los permisos del formulario.' });
            onShareSuccess();
            onOpenChange(false);
        } catch (err) {
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Compartir Formulario</DialogTitle>
                    <DialogDescription>Selecciona los usuarios que podrán ver y responder a "{form?.title}".</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Input placeholder="Buscar usuarios para compartir..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="mb-2"/>
                    <ScrollArea className="h-48 border rounded-md">
                        {isLoading ? <div className="p-4 text-center"><Loader2 className="animate-spin" /></div> :
                        <div className="p-4 space-y-2">
                            {filteredUsers.map(u => (
                                <div key={u.id} className="flex items-center space-x-3">
                                    <Checkbox id={`share-${u.id}`} checked={sharedWithUserIds.includes(u.id)} onCheckedChange={(c) => handleUserShareToggle(u.id, !!c)} />
                                    <Label htmlFor={`share-${u.id}`} className="flex items-center gap-2 font-normal cursor-pointer">
                                        <Avatar className="h-7 w-7"><AvatarImage src={u.avatar || undefined} /><AvatarFallback><Identicon userId={u.id}/></AvatarFallback></Avatar>
                                        {u.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        }
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function FormsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { setPageTitle } = useTitle();
    const { toast } = useToast();

    const [forms, setForms] = useState<AppForm[]>([]);
    const [totalForms, setTotalForms] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formToDelete, setFormToDelete] = useState<AppForm | null>(null);
    const [formToShare, setFormToShare] = useState<AppForm | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);
    
    const activeTab = searchParams.get('tab') || (user?.role === 'STUDENT' ? 'for-student' : 'my-forms');
    const currentPage = Number(searchParams.get('page')) || 1;
    const totalPages = Math.ceil(totalForms / PAGE_SIZE);

    useEffect(() => {
        setPageTitle('Formularios');
    }, [setPageTitle]);

    const fetchForms = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams(searchParams.toString());
            const res = await fetch(`/api/forms?${params.toString()}`);
            if (!res.ok) throw new Error((await res.json()).message || 'No se pudieron cargar los formularios.');
            const data = await res.json();
            setForms(data.forms);
            setTotalForms(data.totalForms);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    }, [user, searchParams]);

    useEffect(() => {
        fetchForms();
    }, [fetchForms]);
    
    const createQueryString = useCallback((paramsToUpdate: Record<string, string | number>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(paramsToUpdate).forEach(([name, value]) => {
        params.set(name, String(value));
      });
      return params.toString();
    }, [searchParams]);

    const handleTabChange = (tab: string) => {
        router.push(`${pathname}?${createQueryString({ tab, page: 1 })}`);
    }

    const handlePageChange = (page: number) => {
        router.push(`${pathname}?${createQueryString({ page })}`);
    };
    
    const handleFormCreated = (newForm: AppForm) => {
        setShowCreateModal(false);
        router.push(`/forms/${newForm.id}/edit`);
    };

    const handleFormAction = (action: 'edit' | 'delete' | 'share' | 'results', form: AppForm) => {
       if (action === 'edit') {
           router.push(`/forms/${form.id}/edit`);
           return;
       }
       if (action === 'results') {
           router.push(`/forms/${form.id}/results`);
           return;
       }
        if (action === 'share') {
           setFormToShare(form);
           return;
       }
       if (action === 'delete') {
           setFormToDelete(form);
           return;
       }
    };
    
    const handleLaunchGame = async (formId: string) => {
        setIsLaunching(true);
        try {
            const res = await fetch('/api/quizz-it/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'No se pudo iniciar el juego.');
            router.push(`/quizz-it/host/${data.id}`);
        } catch (err) {
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
        } finally {
            setIsLaunching(false);
        }
    };

    const handleDeleteForm = async () => {
        if (!formToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/forms/${formToDelete.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error((await res.json()).message || 'No se pudo eliminar el formulario.');
            toast({ title: '¡Eliminado!', description: 'El formulario ha sido eliminado correctamente.' });
            fetchForms(); // Refrescar la lista
        } catch (err) {
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
            setFormToDelete(null);
        }
    };


    const FormList = ({ formsList, view }: { formsList: AppForm[], view: 'management' | 'student' }) => {
        if (view === 'management') {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {formsList.map(form => <FormCard key={form.id} form={form} onAction={handleFormAction} onLaunchGame={handleLaunchGame} />)}
                </div>
            );
        }
        
        return (
             <div className="space-y-4">
                {formsList.map(form => (
                    <Card key={form.id} className="hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="break-words line-clamp-none">{form.title}</CardTitle>
                             <CardDescription className="break-words line-clamp-none">{form.description || 'Completa este formulario.'}</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button asChild>
                                <Link href={`/forms/${form.id}/view`}>
                                    Responder Formulario <ArrowRight className="ml-2 h-4 w-4"/>
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
             </div>
        )
    };
    
    const SkeletonGrid = () => (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <Card key={i} className="flex flex-col h-full"><CardHeader><Skeleton className="h-5 w-3/4"/><Skeleton className="h-4 w-1/2 mt-2"/></CardHeader><CardContent className="flex-grow"></CardContent><CardFooter className="border-t pt-3 flex justify-between"><Skeleton className="h-5 w-16"/><Skeleton className="h-5 w-24"/></CardFooter></Card>
            ))}
        </div>
    );
    
    const SkeletonList = () => (
         <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4"/><Skeleton className="h-4 w-1/2 mt-2"/></CardHeader><CardFooter><Skeleton className="h-10 w-48"/></CardFooter></Card>
            ))}
         </div>
    );

    const EmptyState = ({ tab }: { tab: string }) => {
      let message = "No hay formularios que mostrar en esta sección.";
      if (tab === 'my-forms') message = "Aún no has creado ningún formulario. ¡Crea el primero!";
      if (tab === 'shared-with-me') message = "Nadie ha compartido formularios contigo todavía.";
      if (tab === 'for-student') message = "No hay formularios públicos disponibles en este momento.";

      return (
        <div className="text-center border-2 border-dashed rounded-lg p-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sección Vacía</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{message}</p>
        </div>
      )
    };
    
    // Management View for Admins/Instructors
    const ManagementView = () => (
        <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <p className="text-muted-foreground">
                        Crea, gestiona y analiza encuestas, evaluaciones y formularios personalizados.
                    </p>
                </div>
                 <Button onClick={() => setShowCreateModal(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear Nuevo Formulario
                </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="h-auto flex-wrap justify-start md:h-10 md:flex-nowrap">
                    <TabsTrigger value="my-forms">Mis Formularios</TabsTrigger>
                    <TabsTrigger value="shared-with-me">Compartidos Conmigo</TabsTrigger>
                    {user?.role === 'ADMINISTRATOR' && <TabsTrigger value="all">Todos</TabsTrigger>}
                </TabsList>
                <div className="mt-6">
                    {isLaunching && <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50"><Loader2 className="h-8 w-8 animate-spin"/></div>}
                    {isLoading ? <SkeletonGrid /> 
                     : error ? <div className="text-destructive text-center py-10">{error}</div>
                     : forms.length === 0 ? <EmptyState tab={activeTab} /> 
                     : <FormList formsList={forms} view="management" />}
                </div>
            </Tabs>
        </>
    );

    // Student-facing view
    const StudentView = () => (
        <>
           <div>
              <p className="text-muted-foreground">
                  Completa los formularios y encuestas disponibles para ti.
              </p>
           </div>
           <div className="mt-6">
                 {isLoading ? <SkeletonList /> 
                 : error ? <div className="text-destructive text-center py-10">{error}</div>
                 : forms.length === 0 ? <EmptyState tab="for-student" /> 
                 : <FormList formsList={forms} view="student" />}
           </div>
        </>
    );

    return (
        <div className="space-y-8">
            {user?.role === 'STUDENT' ? <StudentView /> : <ManagementView />}
            
            {totalPages > 1 && !isLoading && (
                <SmartPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            <FormCreationModal open={showCreateModal} onOpenChange={setShowCreateModal} onFormCreated={handleFormCreated} />
            
            <ShareFormModal form={formToShare} isOpen={!!formToShare} onOpenChange={() => setFormToShare(null)} onShareSuccess={fetchForms} />

             <AlertDialog open={!!formToDelete} onOpenChange={(open) => !open && setFormToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            El formulario "<strong>{formToDelete?.title}</strong>" y todas sus respuestas serán eliminados permanentemente. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteForm} disabled={isDeleting} className={buttonVariants({ variant: 'destructive' })}>
                           {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                           Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
