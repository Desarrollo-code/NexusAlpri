// src/components/roadmap/interactive-roadmap.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button, buttonVariants } from '@/components/ui/button';
import type { RoadmapItem } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Edit, Trash2, MoreVertical } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useAuth } from '@/contexts/auth-context';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { cn } from '@/lib/utils';
import { EmptyState } from '../empty-state';
import { Rocket } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';


const RoadmapCard = ({ item, isActive, onEdit, onDelete }: { item: RoadmapItem, isActive: boolean, onEdit: () => void, onDelete: () => void }) => {
    const { user } = useAuth();
    const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Lightbulb;
    
    return (
        <Card className={cn(
            "w-full h-full transform transition-all duration-300 flex flex-col shadow-lg border",
            isActive ? "scale-100 shadow-primary/20 border-primary/50" : "shadow-md hover:shadow-xl hover:-translate-y-1"
        )}>
            <CardHeader className="relative pb-2">
                <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                        <Icon className="h-5 w-5" style={{ color: item.color }}/>
                    </div>
                    {user?.role === 'ADMINISTRATOR' && (
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4"/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={onEdit}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                 <CardTitle className="text-base font-bold font-headline pt-2">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{item.description}</p>
            </CardContent>
        </Card>
    );
};

export const InteractiveRoadmap = ({ items, onEdit, onDelete }: { items: RoadmapItem[], onEdit: (item: RoadmapItem) => void, onDelete: () => void }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'center',
        containScroll: 'trimSnaps',
    });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [itemToDelete, setItemToDelete] = React.useState<RoadmapItem | null>(null);
    const { toast } = useToast();

    const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi, setSelectedIndex]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);
    
    const handleDelete = async () => {
        if(!itemToDelete) return;
        try {
            const res = await fetch(`/api/roadmap/${itemToDelete.id}`, { method: 'DELETE' });
            if (res.status !== 204) throw new Error("No se pudo eliminar el hito.");
            toast({ title: 'Hito eliminado' });
            onDelete();
        } catch(err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
        } finally {
            setItemToDelete(null);
        }
    };
    
    if (items.length === 0) {
        return (
            <div className="container max-w-lg mx-auto">
              <EmptyState 
                icon={Rocket}
                title="La Hoja de Ruta está en Blanco"
                description="Un administrador necesita añadir hitos para poder visualizarlos aquí."
              />
            </div>
        )
    }

    return (
        <div className="w-full space-y-6">
            <div className="relative">
                <div className="flex justify-center items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => emblaApi?.scrollPrev()} disabled={!emblaApi?.canScrollPrev()}><ChevronLeft /></Button>
                    <div className="w-full max-w-4xl overflow-hidden">
                         <div className="relative flex items-center h-16">
                            <AnimatePresence>
                                <motion.div 
                                    className="absolute top-0 bottom-0 bg-primary/10 rounded-full"
                                    initial={false}
                                    animate={{ 
                                        x: `${selectedIndex * 128 + 64 - 48}px`, // 128 = item width, 64 = half item, 48 = half indicator
                                        width: '96px' 
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            </AnimatePresence>
                            <div className="flex">
                                {items.map((item, index) => (
                                    <button 
                                        key={item.id} 
                                        onClick={() => scrollTo(index)}
                                        className="relative flex-shrink-0 w-32 h-16 text-center"
                                    >
                                        <p className="font-bold capitalize">{format(new Date(item.date), 'MMM', { locale: es })}</p>
                                        <p className="text-2xl font-bold">{format(new Date(item.date), 'yyyy')}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                     <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => emblaApi?.scrollNext()} disabled={!emblaApi?.canScrollNext()}><ChevronRight /></Button>
                </div>
            </div>

            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex -ml-4">
                    {items.map((item, index) => (
                        <div key={item.id} className="relative flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-[28%] xl:w-1/4 pl-4">
                            <RoadmapCard 
                                item={item}
                                isActive={index === selectedIndex}
                                onEdit={() => onEdit(item)}
                                onDelete={() => setItemToDelete(item)}
                            />
                        </div>
                    ))}
                </div>
            </div>
             <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>Se eliminará permanentemente el hito "<strong>{itemToDelete?.title}</strong>".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({ variant: "destructive" }))}>
                           <Trash2 className="mr-2 h-4 w-4"/> Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
