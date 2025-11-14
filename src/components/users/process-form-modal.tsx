// src/components/users/process-form-modal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Process } from '@/types';

interface ProcessFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    process: Process | null;
    allProcesses: Process[];
}

interface FlatProcess {
    id: string;
    name: string;
    level: number;
}

export function ProcessFormModal({ isOpen, onClose, onSave, process, allProcesses }: ProcessFormModalProps) {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [parentId, setParentId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (process) {
            setName(process.name || '');
            setParentId(process.parentId || null);
        } else {
            setName('');
            setParentId(null);
        }
    }, [process, isOpen]);
    
    const flattenProcesses = (processList: Process[], level = 0): FlatProcess[] => {
      let list: FlatProcess[] = [];
      processList.forEach(p => {
        list.push({ id: p.id, name: p.name, level });
        if (p.children && p.children.length > 0) {
          list.push(...flattenProcesses(p.children, level + 1));
        }
      });
      return list;
    };

    const flattenedProcesses = flattenProcesses(allProcesses);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const body = { name, parentId: parentId === 'null' ? null : parentId };
            const endpoint = process ? `/api/processes/${process.id}` : '/api/processes';
            const method = process ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo guardar el proceso.');
            }

            toast({
                title: '¡Éxito!',
                description: `Proceso ${process ? 'actualizado' : 'creado'} correctamente.`,
            });
            onSave();
            onClose();

        } catch (error) {
            toast({
                title: 'Error',
                description: (error as Error).message,
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{process ? 'Editar Proceso' : 'Crear Nuevo Proceso'}</DialogTitle>
                </DialogHeader>
                <form id="process-form" onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Proceso</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="parent">Proceso Padre (Opcional)</Label>
                        <Select value={parentId || 'null'} onValueChange={(value) => setParentId(value === 'null' ? null : value)}>
                            <SelectTrigger id="parent">
                                <SelectValue placeholder="Nivel Superior" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="null">Ninguno (Nivel Superior)</SelectItem>
                                {flattenedProcesses.filter(p => p.id !== process?.id).map(p => (
                                     <SelectItem key={p.id} value={p.id} style={{ paddingLeft: `${p.level * 1.5 + 1}rem`}}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" form="process-form" disabled={isSaving || !name.trim()}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        {process ? 'Guardar Cambios' : 'Crear Proceso'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
