// src/app/(app)/processes/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useTitle } from '@/contexts/title-context';
import { Loader2, AlertTriangle, Network, GripVertical, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { Process as PrismaProcess, User as PrismaUser } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ProcessWithChildren extends PrismaProcess {
  children: ProcessWithChildren[];
  users: Pick<PrismaUser, 'id' | 'name' | 'avatar'>[];
}

const ProcessItem = ({ process, onEdit, onDelete }: { process: ProcessWithChildren, onEdit: (p: ProcessWithChildren) => void, onDelete: (p: ProcessWithChildren) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: process.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-2 bg-card">
        <CardHeader className="flex flex-row items-center justify-between p-3">
          <div className="flex items-center gap-2 flex-grow min-w-0">
            <button {...attributes} {...listeners} className="cursor-grab p-1 touch-none">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            <CardTitle className="text-base truncate">{process.name}</CardTitle>
          </div>
          <div className="flex-shrink-0">
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(process)}><Edit className="h-4 w-4"/></Button>
             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(process)}><Trash2 className="h-4 w-4"/></Button>
          </div>
        </CardHeader>
        {process.children.length > 0 && (
          <CardContent className="pl-10 space-y-2">
            <SortableContext items={process.children.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {process.children.map(child => (
                <ProcessItem key={child.id} process={child} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </SortableContext>
          </CardContent>
        )}
      </Card>
    </div>
  );
};


export default function ProcessesPage() {
  const { setPageTitle } = useTitle();
  const { toast } = useToast();
  const [processes, setProcesses] = useState<ProcessWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // State para los modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<ProcessWithChildren | null>(null);
  const [processToDelete, setProcessToDelete] = useState<ProcessWithChildren | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [processName, setProcessName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle('Gestión de Procesos');
  }, [setPageTitle]);

  const fetchProcesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/processes');
      if (!response.ok) throw new Error('No se pudo cargar la estructura de procesos.');
      const data: ProcessWithChildren[] = await response.json();
      setProcesses(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event: DragStartEvent) { setActiveId(event.active.id as string); }
  function handleDragEnd(event: DragEndEvent) { setActiveId(null); }
  
  function findProcessById(id: string, list: ProcessWithChildren[]): ProcessWithChildren | null {
      for (const process of list) {
          if (process.id === id) return process;
          const foundInChildren = findProcessById(id, process.children);
          if (foundInChildren) return foundInChildren;
      }
      return null;
  }
  
  const activeProcess = activeId ? findProcessById(activeId, processes) : null;
  
  const flattenedProcesses = useCallback(() => {
      const flatList: { id: string; name: string; level: number }[] = [];
      const traverse = (processList: ProcessWithChildren[], level: number) => {
          processList.forEach(p => {
              flatList.push({ id: p.id, name: p.name, level });
              if (p.children.length > 0) {
                  traverse(p.children, level + 1);
              }
          });
      };
      traverse(processes, 0);
      return flatList;
  }, [processes]);

  const openCreateModal = () => {
    setEditingProcess(null);
    setProcessName('');
    setParentId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (process: ProcessWithChildren) => {
    setEditingProcess(process);
    setProcessName(process.name);
    setParentId(process.parentId);
    setIsModalOpen(true);
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const endpoint = editingProcess ? `/api/processes/${editingProcess.id}` : '/api/processes';
    const method = editingProcess ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: processName, parentId: parentId === 'null' ? null : parentId }),
        });
        if (!response.ok) throw new Error((await response.json()).message || 'Error al guardar el proceso.');
        
        toast({ title: 'Éxito', description: `Proceso ${editingProcess ? 'actualizado' : 'creado'} correctamente.`});
        setIsModalOpen(false);
        fetchProcesses(); // Recargar
    } catch(err) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleDeleteProcess = async () => {
    if (!processToDelete) return;
    setIsSubmitting(true);
    try {
        const response = await fetch(`/api/processes/${processToDelete.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).message || 'Error al eliminar el proceso.');
        toast({ title: 'Proceso Eliminado' });
        setProcessToDelete(null);
        fetchProcesses();
    } catch(err) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <CardDescription>
                Visualiza, organiza y gestiona los procesos y subprocesos de la empresa.
            </CardDescription>
            <Button onClick={openCreateModal}>
              <PlusCircle className="mr-2 h-4 w-4" /> Crear Proceso
            </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network /> Estructura Organizacional
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? ( <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : error ? ( <div className="flex flex-col items-center justify-center h-64 text-destructive bg-destructive/10 rounded-lg"><AlertTriangle className="h-8 w-8 mb-2" /><p className="font-semibold">Error al Cargar</p><p className="text-sm">{error}</p></div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={processes.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  {processes.map(process => (
                    <ProcessItem key={process.id} process={process} onEdit={openEditModal} onDelete={setProcessToDelete} />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {activeProcess ? <ProcessItem process={activeProcess} onEdit={()=>{}} onDelete={()=>{}} /> : null}
                </DragOverlay>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>

       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingProcess ? 'Editar Proceso' : 'Crear Nuevo Proceso'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="process-name">Nombre del Proceso</Label>
                        <Input id="process-name" value={processName} onChange={(e) => setProcessName(e.target.value)} required disabled={isSubmitting}/>
                    </div>
                     <div>
                        <Label htmlFor="parent-process">Proceso Padre (Opcional)</Label>
                        <Select value={parentId || 'null'} onValueChange={(value) => setParentId(value)} disabled={isSubmitting}>
                           <SelectTrigger id="parent-process"><SelectValue placeholder="Seleccionar proceso padre..." /></SelectTrigger>
                           <SelectContent>
                              <SelectItem value="null">Ninguno (Nivel Superior)</SelectItem>
                              {flattenedProcesses().filter(p => p.id !== editingProcess?.id).map(p => (
                                <SelectItem key={p.id} value={p.id} style={{ paddingLeft: `${p.level * 1.5 + 1}rem`}}>
                                    {p.name}
                                </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting || !processName.trim()}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {editingProcess ? 'Guardar Cambios' : 'Crear Proceso'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <AlertDialog open={!!processToDelete} onOpenChange={(open) => !open && setProcessToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Se eliminará el proceso "<strong>{processToDelete?.name}</strong>". Si tiene subprocesos, estos quedarán en el nivel superior.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProcess} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
