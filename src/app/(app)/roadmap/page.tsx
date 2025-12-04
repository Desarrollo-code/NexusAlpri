// src/app/(app)/roadmap/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTitle } from '@/contexts/title-context';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, PlusCircle, Rocket } from 'lucide-react';
import type { RoadmapItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { InteractiveRoadmap } from '@/components/roadmap/interactive-roadmap';
import { RoadmapEditorModal } from '@/components/roadmap/roadmap-editor-modal';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';

export default function RoadmapPage() {
    const { setPageTitle } = useTitle();
    const { user, settings } = useAuth();
    const { toast } = useToast();

    const [items, setItems] = useState<RoadmapItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);

    const isVisible = settings?.roadmapVisibleTo?.includes(user?.role as any);

    const fetchRoadmapItems = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/roadmap');
            if (!response.ok) throw new Error("No se pudo cargar la hoja de ruta.");
            const data = await response.json();
            setItems(data);
        } catch (err) {
            setError((err as Error).message);
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        setPageTitle('Ruta del Proyecto');
        if (isVisible) {
            fetchRoadmapItems();
        } else {
            setIsLoading(false);
        }
    }, [setPageTitle, isVisible, fetchRoadmapItems]);

    const handleOpenModal = (item: RoadmapItem | null = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        fetchRoadmapItems();
        setIsModalOpen(false);
    };

    const handleDelete = (deletedId: string) => {
        setItems(prev => prev.filter(item => item.id !== deletedId));
    };

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!isVisible) {
        return (
            <div className="flex h-full items-center justify-center text-center">
                <p className="text-muted-foreground">Esta sección no está visible para tu rol.</p>
            </div>
        );
    }
    
    return (
        <div className="relative overflow-hidden w-full min-h-[calc(100vh-10rem)] flex flex-col items-center">
            <DecorativeHeaderBackground />
             <header className="z-10 w-full flex flex-col md:flex-row items-center justify-between gap-6 mb-8 md:mb-12">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-extrabold font-headline">La Evolución de NexusAlpri</h1>
                    <p className="mt-2 text-lg text-muted-foreground max-w-xl">
                        Un recorrido interactivo por las fases de desarrollo que han dado forma a nuestra plataforma.
                    </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                     <div className="w-16 h-16 rounded-full border-2 border-primary/50 bg-card shadow-lg flex items-center justify-center">
                        <Rocket className="h-8 w-8 text-primary"/>
                    </div>
                    {user?.role === 'ADMINISTRATOR' && (
                        <Button onClick={() => handleOpenModal()} className="shadow-lg">
                            <PlusCircle className="mr-2 h-4 w-4"/> Añadir Hito
                        </Button>
                    )}
                </div>
            </header>
            
            {error ? (
                <div className="text-destructive text-center"><AlertTriangle className="mx-auto h-8 w-8" />{error}</div>
            ) : items.length > 0 ? (
                <InteractiveRoadmap items={items} onEdit={handleOpenModal} onDelete={handleDelete} />
            ) : (
                <div className="text-center text-muted-foreground mt-8">No hay hitos en la hoja de ruta todavía.</div>
            )}
            
            {isModalOpen && user?.role === 'ADMINISTRATOR' && (
                <RoadmapEditorModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    item={editingItem}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
