// src/app/(app)/roadmap/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTitle } from '@/contexts/title-context';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldAlert, Rocket } from 'lucide-react';
import { RoadmapEditorModal } from '@/components/roadmap/roadmap-editor-modal';
import type { RoadmapItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ColorfulLoader } from '@/components/ui/colorful-loader';
import { EmptyState } from '@/components/empty-state';
import { HorizontalRoadmap } from '@/components/roadmap/horizontal-roadmap'; // Cambiado
import { ScrollArea } from '@/components/ui/scroll-area';

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
            setItems(data);
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
  
  const handleDeleteSuccess = (deletedId: string) => {
      setItems(prev => prev.filter(item => item.id !== deletedId));
  }
  
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
    <div className="w-full flex flex-col items-center">
        <div className="text-center mb-12 container max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold font-headline tracking-tight">La Evolución de NexusAlpri</h1>
            <p className="mt-4 text-lg text-muted-foreground">
                Un viaje visual a través de los hitos clave que han dado forma a nuestra plataforma.
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
        
        <div className="w-full flex-grow px-4">
            {items.length === 0 ? (
                <div className="container max-w-lg mx-auto">
                <EmptyState 
                    icon={Rocket}
                    title="La Hoja de Ruta está en Blanco"
                    description="Un administrador necesita añadir hitos para poder visualizarlos aquí."
                />
                </div>
            ) : (
                <HorizontalRoadmap items={items} onEdit={handleOpenEditor} onDelete={handleDeleteSuccess} />
            )}
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
