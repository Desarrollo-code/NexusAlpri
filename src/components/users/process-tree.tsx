// src/components/users/process-tree.tsx
'use client';
import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, ChevronDown, Network, MoreVertical, Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ProcessFormModal } from './process-form-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getProcessColors } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import type { Process } from '@/types';
import { ColorfulLoader } from '../ui/colorful-loader';

interface ProcessWithChildren extends Process {
    users: any[];
    children: ProcessWithChildren[];
}

const ProcessNode = ({ process, onEdit, onDelete, onProcessClick, activeProcessId }: { process: ProcessWithChildren, onEdit: (p: ProcessWithChildren) => void, onDelete: (p: ProcessWithChildren) => void, onProcessClick: (id: string | null) => void, activeProcessId: string | null }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: process.id,
    });
    const colors = getProcessColors(process.id);
    const isActive = activeProcessId === process.id;

    return (
        <div ref={setNodeRef} className={cn("rounded-md transition-colors", isOver && "bg-primary/20")}>
            <div className={cn("flex items-center group gap-1 p-1 rounded-md transition-colors", isActive && "bg-primary/10")}>
                <div className="flex items-center gap-2 flex-grow cursor-pointer" onClick={() => onProcessClick(isActive ? null : process.id)}>
                    <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: colors.raw.medium }} />
                    <span className="font-medium text-sm truncate">{process.name}</span>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{process.users.length}</span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"><MoreVertical className="h-4 w-4"/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onEdit(process)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onDelete(process)} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {process.children && process.children.length > 0 && (
                <div className="pl-4 border-l-2 ml-2.5" style={{ borderColor: colors.raw.light }}>
                    {process.children.map(child => (
                        <ProcessNode key={child.id} process={child} onEdit={onEdit} onDelete={onDelete} onProcessClick={onProcessClick} activeProcessId={activeProcessId} />
                    ))}
                </div>
            )}
        </div>
    )
}

export function ProcessTree({ processes, onProcessUpdate, onProcessClick, activeProcessId }: { processes: ProcessWithChildren[], onProcessUpdate: () => void, onProcessClick: (id: string | null) => void, activeProcessId: string | null }) {
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [processToEdit, setProcessToEdit] = useState<ProcessWithChildren | null>(null);
    const [processToDelete, setProcessToDelete] = useState<ProcessWithChildren | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();
    const { isOver, setNodeRef: unassignedDroppableRef } = useDroppable({ id: 'unassigned' });


    const handleOpenModal = (p: ProcessWithChildren | null = null) => {
        setProcessToEdit(p);
        setShowProcessModal(true);
    };

    const handleDelete = (p: ProcessWithChildren) => {
        setProcessToDelete(p);
    };

    const confirmDelete = async () => {
        if (!processToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/processes/${processToDelete.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error((await res.json()).message || "No se pudo eliminar el proceso.");
            toast({ title: 'Proceso Eliminado' });
            onProcessUpdate();
        } catch(err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
        } finally {
            setIsDeleting(false);
            setProcessToDelete(null);
        }
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2"><Network />Estructura Organizacional</CardTitle>
                    <Button size="icon" variant="ghost" onClick={() => handleOpenModal()}><PlusCircle className="h-5 w-5"/></Button>
                </CardHeader>
                <CardContent className="space-y-2">
                     <div 
                        ref={unassignedDroppableRef} 
                        className={cn(
                            "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors", 
                            isOver && "bg-primary/20",
                            activeProcessId === 'unassigned' && 'bg-primary/10'
                        )} 
                        onClick={() => onProcessClick('unassigned')}
                    >
                        <div className="w-1.5 h-6 rounded-full bg-muted-foreground/50"/>
                        <span className="font-medium text-sm text-muted-foreground">Sin Asignar</span>
                    </div>
                    {processes.map(process => (
                        <ProcessNode key={process.id} process={process} onEdit={handleOpenModal} onDelete={handleDelete} onProcessClick={onProcessClick} activeProcessId={activeProcessId} />
                    ))}
                </CardContent>
            </Card>
            {showProcessModal && (
                <ProcessFormModal 
                    isOpen={showProcessModal} 
                    onClose={() => setShowProcessModal(false)}
                    onSave={onProcessUpdate}
                    process={processToEdit}
                    allProcesses={processes}
                />
            )}
             <AlertDialog open={!!processToDelete} onOpenChange={() => setProcessToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>Se eliminará el proceso "{processToDelete?.name}". Si tiene subprocesos, estos quedarán en el nivel superior.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {isDeleting && <div className="w-4 h-4 mr-2"><ColorfulLoader /></div>}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
