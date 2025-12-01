// src/app/(app)/roadmap/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTitle } from '@/contexts/title-context';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldAlert } from 'lucide-react';
import { RoadmapEditorModal } from '@/components/roadmap/roadmap-editor-modal';
import type { RoadmapItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ColorfulLoader } from '@/components/ui/colorful-loader';
import { InteractiveRoadmap } from '@/components/roadmap/interactive-roadmap';

export default function RoadmapPage() {
  const { setPageTitle } = useTitle();
  const { user, settings } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  
  const isMountedRef = useRef(true);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
        const res = await fetch('/api/roadmap');
        if (!res.ok) throw new Error("No se pudo cargar la hoja de ruta.");
        const data = await res.json();
        if (isMountedRef.current) {
            // Ordenar por fecha para la línea de tiempo
            const sortedData = data.sort((a: RoadmapItem, b: RoadmapItem) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setItems(sortedData);
        }
    } catch(err) {
        if (isMountedRef.current) {
            toast({ title: "Error", description: (err as Error).message, variant: "destructive"});
        }
    } finally {
        if (isMountedRef.current) {
            setIsLoading(false);
        }
    }
  }, [toast]);

  useEffect(() => {
    setPageTitle('Ruta del Proyecto');
    isMountedRef.current = true;
    fetchItems();
    return () => {
      isMountedRef.current = false;
    };
  }, [setPageTitle, fetchItems]);

  const handleOpenEditor = (item: RoadmapItem | null = null) => {
    setEditingItem(item);
    setIsEditorOpen(true);
  };

  const handleSaveSuccess = () => {
    fetchItems();
    setIsEditorOpen(false);
  };
  
  const canView = user && ((settings?.roadmapVisibleTo && settings.roadmapVisibleTo.includes(user.role)) || user.role === 'ADMINISTRATOR');
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-[calc(100vh-10rem)]"><ColorfulLoader /></div>
  }

  if (!canView) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
            <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground max-w-md">
                Esta sección solo está disponible para los roles autorizados por un administrador.
            </p>
        </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center">
        <div className="text-center mb-12 container max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold font-headline tracking-tight">La Evolución de NexusAlpri</h1>
            <p className="mt-4 text-lg text-muted-foreground">
                Un viaje interactivo a través de nuestro desarrollo. Desliza para explorar cada hito que ha dado forma a nuestra plataforma.
            </p>
            {user?.role === 'ADMINISTRATOR' && (
                <div className="text-center mt-6">
                    <Button onClick={() => handleOpenEditor()}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Añadir Hito
                    </Button>
                </div>
            )}
        </div>
        
        <div className="w-full flex-grow">
            <InteractiveRoadmap items={items} onEdit={handleOpenEditor} onDelete={handleSaveSuccess} />
        </div>

        {isEditorOpen && (
            <RoadmapEditorModal 
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                item={editingItem}
                onSave={handleSaveSuccess}
            />
        )}
    </div>
  );
}
