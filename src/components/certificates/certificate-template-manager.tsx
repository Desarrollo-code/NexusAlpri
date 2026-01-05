
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, AlertTriangle, PlusCircle, Award, Edit, Trash2, Eye, MoreVertical, Copy, Search, Filter } from 'lucide-react';
import Image from 'next/image';
import type { CertificateTemplate } from '@prisma/client';
import { CertificateEditorModal } from './certificate-editor-modal';
import { CertificatePreview } from './certificate-preview';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import { EmptyState } from '../empty-state';
import { Skeleton } from '../ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const TemplateCardSkeleton = () => (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden h-full flex flex-col">
        <div className="p-6 pb-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex-grow bg-muted/50 p-4 flex items-center justify-center">
            <Skeleton className="w-full aspect-[1.414] rounded-md shadow-sm" />
        </div>
        <div className="p-4 pt-0 flex justify-between items-center mt-auto border-t bg-muted/20 h-14">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
        </div>
    </div>
);

const TemplateCard = ({ template, onEdit, onDelete, onPreview, onDuplicate }: {
    template: CertificateTemplate,
    onEdit: (t: CertificateTemplate) => void,
    onDelete: (t: CertificateTemplate) => void,
    onPreview: (t: CertificateTemplate) => void,
    onDuplicate: (t: CertificateTemplate) => void
}) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="group relative flex flex-col rounded-xl border bg-white shadow-sm transition-all hover:shadow-md overflow-hidden"
        >
            <div className="relative aspect-[1.5] overflow-hidden bg-muted">
                <Image
                    src={template.backgroundImageUrl}
                    alt={template.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                    <Button size="sm" variant="secondary" className="backdrop-blur-md bg-white/90 hover:bg-white" onClick={() => onPreview(template)}>
                        <Eye className="mr-2 h-4 w-4" /> Vista Previa
                    </Button>
                </div>
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg leading-tight truncate pr-2" title={template.name}>{template.name}</h3>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(template)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicate(template)}><Copy className="mr-2 h-4 w-4" /> Duplicar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(template)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {template.footerText || "Sin descripción adicional."}
                </p>

                <div className="mt-auto flex items-center gap-2 pt-4 border-t border-slate-100">
                    <div className="flex -space-x-2">
                        {/* Mock usage avatars or count */}
                        <div className="h-6 w-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] text-blue-700 font-bold">C</div>
                        <div className="h-6 w-6 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-[10px] text-green-700 font-bold">R</div>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">Usado en 2 cursos</span>
                </div>
            </div>
        </motion.div>
    )
}

export function CertificateTemplateManager() {
    const { user, settings } = useAuth();
    const { toast } = useToast();
    const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
    const [previewingTemplate, setPreviewingTemplate] = useState<CertificateTemplate | null>(null);
    const [deletingTemplate, setDeletingTemplate] = useState<CertificateTemplate | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);


    const fetchTemplates = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/certificates/templates');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'No se pudieron cargar las plantillas' }));
                throw new Error(errorData.message);
            }
            const data = await response.json();
            setTemplates(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
            setTemplates([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchTemplates();
        }
    }, [user, fetchTemplates]);

    const handleOpenEditor = (template: CertificateTemplate | null = null) => {
        setEditingTemplate(template);
        setIsEditorOpen(true);
    };

    const handleSaveSuccess = () => {
        fetchTemplates();
        setIsEditorOpen(false);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingTemplate) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/certificates/templates/${deletingTemplate.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo eliminar la plantilla.');
            }
            toast({ title: "Plantilla Eliminada", description: `La plantilla "${deletingTemplate.name}" ha sido eliminada.` });
            fetchTemplates();
        } catch (err) {
            toast({ title: 'Error al Eliminar', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsDeleting(false);
            setDeletingTemplate(null);
        }
    };

    const handleDuplicate = async (template: CertificateTemplate) => {
        // Logic to duplicate would go here (typically a backend call or opening editor with copied data)
        // For now, let's open editor with data but no ID
        const { id, createdAt, updatedAt, ...rest } = template;
        setEditingTemplate({ ...rest, name: `${template.name} (Copia)` } as unknown as CertificateTemplate);
        setIsEditorOpen(true);
    }

    const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <TemplateCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="p-12 text-center border rounded-xl bg-red-50 text-red-600"><AlertTriangle className="mx-auto h-10 w-10 mb-4" />{error}</div>
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Diseñador de Certificados</h1>
                    <p className="text-muted-foreground text-lg">Crea plantillas profesionales para reconocer los logros de tus estudiantes.</p>
                </div>
                <Button onClick={() => handleOpenEditor()} size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Nueva Plantilla
                </Button>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -my-4 lg:static lg:bg-transparent lg:p-0">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar plantillas..."
                        className="pl-10 bg-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                    Mostrando {filteredTemplates.length} plantilla{filteredTemplates.length !== 1 && 's'}
                </p>
            </div>

            {filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {filteredTemplates.map(template => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                onEdit={handleOpenEditor}
                                onDelete={setDeletingTemplate}
                                onPreview={setPreviewingTemplate}
                                onDuplicate={handleDuplicate}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <EmptyState
                    icon={Award}
                    title={search ? "No se encontraron resultados" : "Sin Plantillas de Certificados"}
                    description={search ? "Intenta con otros términos de búsqueda." : "Aún no has creado ninguna plantilla. ¡Comienza ahora!"}
                    imageUrl={settings?.emptyStateCertificatesUrl}
                    actionButton={!search && (
                        <Button onClick={() => handleOpenEditor()} className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Crear Primera Plantilla
                        </Button>
                    )}
                />
            )}

            <CertificateEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                template={editingTemplate}
                onSave={handleSaveSuccess}
            />

            <Dialog open={!!previewingTemplate} onOpenChange={(isOpen) => !isOpen && setPreviewingTemplate(null)}>
                <DialogContent className="max-w-5xl p-0 border-0 bg-transparent shadow-none overflow-hidden">
                    {previewingTemplate && (
                        <div className="rounded-xl overflow-hidden shadow-2xl">
                            <CertificatePreview template={previewingTemplate} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la plantilla <strong>{deletingTemplate?.name}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className={cn(buttonVariants({ variant: "destructive" }))}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
