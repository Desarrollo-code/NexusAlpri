// src/components/roadmap/interactive-roadmap.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { RoadmapItem } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Trash2, MoreVertical } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../ui/button';

// --- SVG Winding Roadmap ---

const WindingRoadmap = ({ items, onEdit, onDelete }: { items: RoadmapItem[], onEdit: (item: RoadmapItem) => void, onDelete: (id: string) => void }) => {
    const { user } = useAuth();
    const [itemToDelete, setItemToDelete] = useState<RoadmapItem | null>(null);
    const { toast } = useToast();

    if (!items || items.length === 0) return null;

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            const res = await fetch(`/api/roadmap/${itemToDelete.id}`, { method: 'DELETE' });
            if (res.status !== 204) throw new Error("No se pudo eliminar el hito.");
            toast({ title: 'Hito eliminado' });
            onDelete(itemToDelete.id);
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setItemToDelete(null);
        }
    };
    
    const phases = Array.from(new Set(items.map(item => item.phase)));
    const itemsByPhase: { [key: string]: RoadmapItem[] } = {};
    phases.forEach(phase => {
        itemsByPhase[phase] = items.filter(item => item.phase === phase).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return (
        <div className="w-full">
            {phases.map((phase, phaseIndex) => (
                <div key={phase} className="relative pl-8 md:pl-16 pb-12">
                    {/* Phase line */}
                    {phaseIndex < phases.length -1 && (
                        <div className="absolute top-5 left-[31px] md:left-[63px] w-0.5 h-full" style={{ backgroundColor: itemsByPhase[phase][0]?.color || '#ccc' }} />
                    )}

                    {/* Phase marker */}
                    <div className="absolute left-0 top-0">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-card border-4 shadow-md" style={{ borderColor: itemsByPhase[phase][0]?.color || '#ccc'}}>
                            <p className="text-sm font-bold text-center leading-tight">Fase {phase.split('_')[1]}</p>
                        </div>
                    </div>
                    
                    <div className="ml-4 md:ml-12">
                        {itemsByPhase[phase].map((item, itemIndex) => {
                            const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Lightbulb;
                            return(
                            <motion.div 
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: itemIndex * 0.1 }}
                                className="relative pl-8 md:pl-16 py-4"
                            >
                                {/* Connecting line and dot */}
                                <div className="absolute top-0 left-[1px] md:left-[33px] w-0.5 h-full bg-border" />
                                <div className="absolute top-8 left-[-7px] md:left-[25px] h-4 w-4 rounded-full bg-card border-2" style={{ borderColor: item.color }} />

                                {/* Card */}
                                <div className="relative transform-gpu transition-all duration-300 hover:scale-[1.02]">
                                    <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: item.color }}>
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="bg-card/80 backdrop-blur-sm p-4 rounded-xl border shadow-lg">
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs font-semibold uppercase text-muted-foreground">{format(new Date(item.date), "MMMM yyyy", {locale: es})}</p>
                                             {user?.role === 'ADMINISTRATOR' && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1"><MoreVertical className="h-4 w-4"/></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => onEdit(item)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setItemToDelete(item)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                        <h3 className="font-bold font-headline text-lg mt-1">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{item.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )})}
                    </div>
                </div>
            ))}
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
    )
}

export { WindingRoadmap as InteractiveRoadmap };
