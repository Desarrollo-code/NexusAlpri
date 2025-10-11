// src/app/(app)/processes/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useTitle } from '@/contexts/title-context';
import { Loader2, AlertTriangle, Network, GripVertical } from 'lucide-react';
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
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProcessWithChildren extends PrismaProcess {
  children: ProcessWithChildren[];
  users: Pick<PrismaUser, 'id' | 'name' | 'avatar'>[];
}

const ProcessItem = ({ process }: { process: ProcessWithChildren }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: process.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-2">
        <CardHeader className="flex flex-row items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <button {...attributes} {...listeners} className="cursor-grab p-1">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            <CardTitle className="text-base">{process.name}</CardTitle>
          </div>
        </CardHeader>
        {process.children.length > 0 && (
          <CardContent className="pl-10 space-y-2">
            <SortableContext items={process.children.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {process.children.map(child => (
                <ProcessItem key={child.id} process={child} />
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

  useEffect(() => {
    setPageTitle('Gestión de Procesos');
  }, [setPageTitle]);

  const fetchProcesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/processes');
      if (!response.ok) {
        throw new Error('No se pudo cargar la estructura de procesos.');
      }
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
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: any) {
    // Lógica para manejar el fin del arrastre (se implementará en el futuro)
    console.log('Drag end:', event);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-16 text-destructive bg-destructive/10 border-destructive">
        <CardHeader>
          <AlertTriangle className="mx-auto h-12 w-12" />
          <CardTitle>Error al Cargar</CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network />
            Estructura Organizacional
          </CardTitle>
          <CardDescription>
            Visualiza y organiza los procesos y subprocesos de la empresa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={processes.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {processes.map(process => (
                <ProcessItem key={process.id} process={process} />
              ))}
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  );
}
