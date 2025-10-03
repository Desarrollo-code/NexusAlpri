
// src/components/certificates/certificate-template-manager.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, PlusCircle, Award, Edit, Trash2, Eye } from 'lucide-react';
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
import { cn } from '@/lib/utils';

const TemplateCard = ({ template, onEdit, onDelete, onPreview }: { template: CertificateTemplate, onEdit: (t: CertificateTemplate) => void, onDelete: (t: CertificateTemplate) => void, onPreview: (t: CertificateTemplate) => void }) => {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="truncate">{template.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                 <div className="relative w-full aspect-[1.414] rounded-md overflow-hidden bg-muted border">
                    <Image src={template.backgroundImageUrl} alt={template.name} fill className="object-cover" />
                </div>
            </CardContent>
             <CardContent className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => onPreview(template)}><Eye className="mr-2 h-4 w-4"/>Previsualizar</Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(template)}><Edit className="mr-2 h-4 w-4"/>Editar</Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(template)}><Trash2 className="mr-2 h-4 w-4"/>Eliminar</Button>
             </CardContent>
        </Card>
    )
}

export function CertificateTemplateManager() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        fetchTemplates(); // Recargar la lista de plantillas
        setIsEditorOpen(false); // Cerrar el modal
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
            fetchTemplates(); // Refresh the list
        } catch (err) {
            toast({ title: 'Error al Eliminar', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsDeleting(false);
            setDeletingTemplate(null);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error) {
        return <div className="p-8 text-center text-destructive"><AlertTriangle className="mx-auto h-8 w-8 mb-2" />{error}</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Gestionar Plantillas de Certificados</h1>
                    <p className="text-muted-foreground">Crea y personaliza las plantillas que se usarán para generar los certificados de finalización.</p>
                </div>
                <Button onClick={() => handleOpenEditor()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear Nueva Plantilla
                </Button>
            </div>

            {templates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <TemplateCard key={template.id} template={template} onEdit={handleOpenEditor} onDelete={setDeletingTemplate} onPreview={setPreviewingTemplate}/>
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16 border-dashed">
                    <CardHeader>
                        <Award className="mx-auto h-12 w-12 text-muted-foreground" />
                        <CardTitle>Sin Plantillas de Certificados</CardTitle>
                        <CardDescription>Aún no has creado ninguna plantilla. ¡Crea la primera para empezar a reconocer los logros de tus estudiantes!</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button onClick={() => handleOpenEditor()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Crear Mi Primera Plantilla
                        </Button>
                    </CardContent>
                </Card>
            )}

            <CertificateEditorModal 
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                template={editingTemplate}
                onSave={handleSaveSuccess}
            />
            
            <Dialog open={!!previewingTemplate} onOpenChange={(isOpen) => !isOpen && setPreviewingTemplate(null)}>
                <DialogContent className="max-w-4xl p-0 border-0">
                    {previewingTemplate && <CertificatePreview template={previewingTemplate} />}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la plantilla "<strong>{deletingTemplate?.name}</strong>". 
                            No podrás eliminarla si está siendo usada por algún curso.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className={cn(buttonVariants({ variant: "destructive" }))}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
