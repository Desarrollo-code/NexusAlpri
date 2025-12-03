// src/app/(app)/roadmap/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTitle } from '@/contexts/title-context';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlusCircle, ShieldAlert, Rocket } from 'lucide-react';
import { RoadmapEditorModal } from '@/components/roadmap/roadmap-editor-modal';
import type { RoadmapItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { InteractiveRoadmap } from '@/components/roadmap/interactive-roadmap';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';
import { Card, CardHeader } from '@/components/ui/card';
import Image from 'next/image';


const RoadmapSkeleton = () => (
    <div className="w-full flex flex-col items-center">
        <div className="text-center mb-12 container max-w-4xl mx-auto">
            <Skeleton className="h-10 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-full max-w-2xl mx-auto mt-4" />
        </div>
        <div className="w-full space-y-8">
            <Skeleton className="h-10 w-full max-w-xl mx-auto" />
            <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
    </div>
);


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
  
  const handleDeleteSuccess = () => {
      fetchItems();
  }
  
  const canView = user && ((settings?.roadmapVisibleTo && settings.roadmapVisibleTo.includes(user.role)) || user.role === 'ADMINISTRATOR');
  
  if (isLoading) {
    return <RoadmapSkeleton />;
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
    <div className="w-full">
        <Card className="relative z-10 w-full p-6 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg border-2 border-primary/10 mb-12">
            <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: `url(${settings?.publicPagesBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
             <div className="relative z-10 grid md:grid-cols-3 items-center gap-6">
               <div className="md:col-span-2 space-y-2">
                  <h1 className="text-3xl font-bold font-headline flex items-center gap-2">La Evolución de NexusAlpri</h1>
                  <p className="text-muted-foreground max-w-2xl">
                    Un viaje interactivo a través de los hitos clave que han dado forma a nuestra plataforma.
                  </p>
                   {user?.role === 'ADMINISTRATOR' && (
                        <div className="pt-4">
                            <Button onClick={() => handleOpenEditor()} size="sm">
                                <PlusCircle className="mr-2 h-4 w-4"/>
                                Añadir Hito
                            </Button>
                        </div>
                    )}
               </div>
               {settings?.roadmapImageUrl && (
                 <div className="relative w-full h-24 md:h-full flex-shrink-0">
                   <Image src={settings.roadmapImageUrl} alt="Ilustración de la hoja de ruta" fill className="object-contain" data-ai-hint="roadmap illustration" />
                 </div>
               )}
            </div>
        </Card>

        <div className="w-full flex-grow px-4">
            {items.length === 0 ? (
                <div className="container max-w-lg mx-auto">
                <div className="text-center py-12">
                    <Rocket className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">La Hoja de Ruta está en Blanco</h3>
                    <p className="text-muted-foreground mb-6">Un administrador necesita añadir hitos para poder visualizarlos aquí.</p>
                </div>
                </div>
            ) : (
                <InteractiveRoadmap items={items} onEdit={handleOpenEditor} onDelete={handleDeleteSuccess} />
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
