// src/components/roadmap/interactive-roadmap.tsx
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type { RoadmapItem } from '@/types';
import { Button, buttonVariants } from '../ui/button';
import { Edit, MoreVertical, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/auth-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { IconLightbulb } from '../icons/icon-lightbulb';
import { IconCode } from '../icons/icon-code';
import { IconDatabase } from '../icons/icon-database';
import { IconPaintbrush } from '../icons/icon-paintbrush';
import { IconRocket } from '../icons/icon-rocket';

const getPhaseColor = (phase: string) => {
    const hash = phase.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))',
    ];
    return colors[hash % colors.length];
};

const iconMap = {
    ...LucideIcons,
    Lightbulb: IconLightbulb,
    Code: IconCode,
    Database: IconDatabase,
    Paintbrush: IconPaintbrush,
    Rocket: IconRocket,
};

const RoadmapGridCard = ({ item, onSelect }: { item: RoadmapItem, onSelect: () => void }) => {
    const Icon = (iconMap as any)[item.icon] || LucideIcons.Lightbulb;
    const phaseColor = getPhaseColor(item.phase);

    return (
        <motion.div layoutId={`roadmap-card-${item.id}`} onClick={onSelect} className="cursor-pointer h-full">
            <Card className="h-full flex flex-col group overflow-hidden transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-1.5 border-2 border-transparent hover:border-primary/50">
                 <CardHeader className="p-4 border-b">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: phaseColor }}>
                            <Icon className="w-6 h-6 text-primary-foreground"/>
                         </div>
                        <div>
                            <CardTitle className="text-base font-bold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">{item.title}</CardTitle>
                            <p className="text-xs font-semibold" style={{ color: phaseColor }}>
                              {item.phase.replace(/_/g, ' ')}
                            </p>
                        </div>
                    </div>
                 </CardHeader>
                 <CardContent className="p-4 flex-grow">
                    <div className="text-sm text-muted-foreground line-clamp-3 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: item.description }} />
                 </CardContent>
                 <CardFooter className="p-3 border-t text-xs text-muted-foreground font-medium">
                    {format(new Date(item.date), "dd MMMM, yyyy", { locale: es })}
                 </CardFooter>
            </Card>
        </motion.div>
    );
};

export const InteractiveRoadmap = ({ items, onEdit, onDelete }: { items: RoadmapItem[], onEdit: (item: RoadmapItem) => void, onDelete: (id: string) => void }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<RoadmapItem | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    const selectedIndex = useMemo(() => {
        if (!selectedId) return -1;
        return items.findIndex(item => item.id === selectedId);
    }, [selectedId, items]);

    const selectedItem = items[selectedIndex];

    const handleNext = useCallback(() => {
        if (selectedIndex === -1) return;
        const nextIndex = (selectedIndex + 1) % items.length;
        setSelectedId(items[nextIndex].id);
    }, [selectedIndex, items]);

    const handlePrevious = useCallback(() => {
        if (selectedIndex === -1) return;
        const prevIndex = (selectedIndex - 1 + items.length) % items.length;
        setSelectedId(items[prevIndex].id);
    }, [selectedIndex, items]);
    
    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            const res = await fetch(`/api/roadmap/${itemToDelete.id}`, { method: 'DELETE' });
            if (res.status !== 204) throw new Error("No se pudo eliminar el hito.");
            toast({ title: 'Hito eliminado' });
            onDelete(itemToDelete.id);
            if(selectedId === itemToDelete.id) setSelectedId(null);
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setItemToDelete(null);
        }
    };
    
    const handleEdit = (e: React.MouseEvent, item: RoadmapItem) => {
        e.stopPropagation();
        onEdit(item);
    }
    
    const handleDeleteClick = (e: React.MouseEvent, item: RoadmapItem) => {
        e.stopPropagation();
        setItemToDelete(item);
    }
    
    return (
        <div className="w-full">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {items.map(item => (
                    <RoadmapGridCard key={item.id} item={item} onSelect={() => setSelectedId(item.id)} />
                ))}
            </div>

            <AnimatePresence>
                {selectedItem && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
                            onClick={() => setSelectedId(null)}
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                             <Button variant="ghost" size="icon" className="fixed top-6 right-6 h-10 w-10 rounded-full bg-background/80 hover:bg-background text-foreground shadow-lg z-[51]" onClick={() => setSelectedId(null)}><X className="h-5 w-5"/></Button>
                            
                             {items.length > 1 && (
                                <>
                                 <Button variant="ghost" size="icon" className="fixed left-4 md:left-8 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background text-foreground shadow-lg z-[51]" onClick={handlePrevious}><ChevronLeft className="h-6 w-6"/></Button>
                                 <Button variant="ghost" size="icon" className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background text-foreground shadow-lg z-[51]" onClick={handleNext}><ChevronRight className="h-6 w-6"/></Button>
                                </>
                             )}
                            
                            <motion.div layoutId={`roadmap-card-${selectedItem.id}`} className="w-full max-w-2xl max-h-[80vh] flex">
                                <Card className="w-full flex flex-col overflow-hidden shadow-2xl">
                                    <CardHeader className="relative p-0">
                                         {selectedItem.imageUrl ? (
                                            <div className="relative w-full aspect-video">
                                                <Image src={selectedItem.imageUrl} alt={selectedItem.title} fill className="object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                            </div>
                                         ) : (
                                            <div className="h-12" style={{backgroundColor: getPhaseColor(selectedItem.phase) }} />
                                         )}
                                        <div className={cn("absolute bottom-0 left-0 right-0 p-4", selectedItem.imageUrl && "text-white")}>
                                            <p className="text-sm font-bold uppercase tracking-wider" style={{ color: !selectedItem.imageUrl ? getPhaseColor(selectedItem.phase) : undefined }}>{selectedItem.phase.replace('_', ' ')}</p>
                                            <CardTitle className="text-2xl font-bold font-headline">{selectedItem.title}</CardTitle>
                                            <CardDescription className={cn(selectedItem.imageUrl && "text-white/80")}>{format(new Date(selectedItem.date), "dd MMMM, yyyy", { locale: es })}</CardDescription>
                                        </div>
                                         {user?.role === 'ADMINISTRATOR' && (
                                            <div className="absolute top-2 right-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/30 hover:bg-black/50 text-white" onClick={(e) => handleEdit(e, selectedItem)}><Edit className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 ml-1 bg-black/30 hover:bg-black/50 text-white" onClick={(e) => handleDeleteClick(e, selectedItem)}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent className="flex-1 p-0">
                                         <ScrollArea className="h-full max-h-[calc(80vh-200px)]">
                                            <div className="prose prose-sm dark:prose-invert max-w-none p-6" dangerouslySetInnerHTML={{ __html: selectedItem.description }} />
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
            
            <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription>Se eliminará permanentemente el hito "<strong>{itemToDelete?.title}</strong>".</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({ variant: "destructive" }))}><Trash2 className="mr-2 h-4 w-4"/> Sí, eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};