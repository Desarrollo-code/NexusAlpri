// src/components/users/bulk-assign-modal.tsx
'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Process } from '@/types';

interface BulkAssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    userIds: string[];
    processes: Process[];
}

interface FlatProcess {
    id: string;
    name: string;
    level: number;
}

export function BulkAssignModal({ isOpen, onClose, onSave, userIds, processes }: BulkAssignModalProps) {
    const { toast } = useToast();
    const [targetProcessId, setTargetProcessId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

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

    const flattenedProcesses = flattenProcesses(processes);

    const handleBulkAssign = async () => {
        if (!targetProcessId) {
            toast({ title: 'Selecciona un proceso de destino.', variant: 'destructive' });
            return;
        }
        setIsSaving(true);
        try {
            const response = await fetch('/api/processes/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    processId: targetProcessId === 'unassigned' ? null : targetProcessId,
                    userIds
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al asignar usuarios.');
            }

            toast({ title: '¡Éxito!', description: `${userIds.length} usuario(s) han sido asignados.` });
            onSave();
            onClose();

        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Asignar Proceso en Lote</DialogTitle>
                    <DialogDescription>
                        Selecciona un proceso para asignar a los {userIds.length} colaboradores seleccionados.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Select value={targetProcessId || 'unassigned'} onValueChange={v => setTargetProcessId(v)}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar proceso..." /></SelectTrigger>
                        <SelectContent>
                             <SelectItem value="unassigned">Sin Asignar</SelectItem>
                             {flattenedProcesses.map(p => (
                                 <SelectItem key={p.id} value={p.id} style={{ paddingLeft: `${p.level * 1.5 + 1}rem` }}>
                                     {p.name}
                                 </SelectItem>
                             ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleBulkAssign} disabled={isSaving || !targetProcessId}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Asignar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}