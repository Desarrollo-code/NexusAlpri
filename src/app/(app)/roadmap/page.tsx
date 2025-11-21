// src/app/(app)/roadmap/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTitle } from '@/contexts/title-context';
import { RoadmapView } from '@/components/roadmap/roadmap-view';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldAlert } from 'lucide-react';
import { RoadmapEditorModal } from '@/components/roadmap/roadmap-editor-modal';
import type { RoadmapItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ColorfulLoader } from '@/components/ui/colorful-loader';

export default function RoadmapPage() {
  const { setPageTitle } = useTitle();
  const { user, settings } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
        const res = await fetch('/api/roadmap');
        if (!res.ok) throw new Error("No se pudo cargar la hoja de ruta.");
        const data = await res.json();
        setItems(data);
    } catch(err) {
        toast({ title: "Error", description: (err as Error).message, variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setPageTitle('Ruta del Proyecto');
    fetchItems();
  }, [setPageTitle, fetchItems]);

  const handleOpenEditor = (item: RoadmapItem | null = null) => {
    setEditingItem(item);
    setIsEditorOpen(true);
  };

  const handleSaveSuccess = () => {
    fetchItems();
    setIsEditorOpen(false);
  };
  
  const canView = user && (settings?.roadmapVisibleTo?.includes(user.role) || user.role === 'ADMINISTRATOR');
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><ColorfulLoader /></div>
  }

  if (!canView) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
            <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground max-w-md">
                Esta sección solo está disponible para los roles autorizados por un administrador.
            </p>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-headline tracking-tight">La Evolución de NexusAlpri</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                Un vistazo a nuestro viaje, desde la primera línea de código hasta las últimas funcionalidades. Esta es la historia de cómo construimos juntos el futuro del aprendizaje.
            </p>
        </div>
        
        {user?.role === 'ADMINISTRATOR' && (
            <div className="text-center mb-12">
                <Button onClick={() => handleOpenEditor()}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Añadir Hito a la Hoja de Ruta
                </Button>
            </div>
        )}

        <RoadmapView items={items} onEdit={handleOpenEditor} onDelete={fetchItems}/>

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
