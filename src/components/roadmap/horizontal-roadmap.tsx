// src/components/roadmap/horizontal-roadmap.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, buttonVariants } from '@/components/ui/button';
import type { RoadmapItem } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Trash2, MoreVertical, ChevronRight, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '../ui/card';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';

const RoadmapItemNode = ({ item, index, onEdit, onDelete }: { item: RoadmapItem; index: number; onEdit: (item: RoadmapItem) => void; onDelete: (id: string) => void }) => {
    const { user } = useAuth();
    const isEven = index % 2 === 0;
    const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Lightbulb;
    const [itemToDelete, setItemToDelete] = useState<RoadmapItem | null>(null);
    const { toast } = useToast();
    const [isExpanded, setIsExpanded] = useState(false);

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
    
    const cardContent = (
        <motion.div layout>
            <Card className="w-full max-w-xs p-4 rounded-xl shadow-lg border bg-card/80 backdrop-blur-sm relative">
                <h3 className="font-bold text-base text-foreground text-left pr-8">{item.title}</h3>
                <AnimatePresence>
                     <motion.p 
                        layout 
                        className="text-xs text-muted-foreground text-left mt-1 overflow-hidden"
                        initial={{ height: 40 }}
                        animate={{ height: isExpanded ? 'auto' : 40 }}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                        {item.description}
                    </motion.p>
                </AnimatePresence>
                 <div className="mt-2">
                     <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? 'Leer menos' : 'Leer más'} 
                        {isExpanded ? <ChevronDown className="h-3 w-3 ml-1"/> : <ChevronRight className="h-3 w-3 ml-1"/>}
                     </Button>
                 </div>
                 {user?.role === 'ADMINISTRATOR' && (
                    <div className="absolute top-2 right-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full"><MoreVertical className="h-4 w-4"/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => onEdit(item)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setItemToDelete(item)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </Card>
        </motion.div>
    );

    return (
        <div className="flex flex-col items-center w-64 md:w-80 flex-shrink-0">
            {isEven ? <div className="h-auto min-h-[160px] flex items-end pb-4">{cardContent}</div> : <div className="h-40"></div>}
            
            <div className="flex flex-col items-center">
                <span className="text-lg font-bold font-headline">{format(new Date(item.date), "yyyy")}</span>
                <div className="w-0.5 h-4 bg-muted-foreground/30" />
                <div className="w-12 h-12 rounded-full border-4 flex items-center justify-center relative shadow-md bg-background" style={{ borderColor: item.color }}>
                    <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 20px 3px ${item.color}66` }}/>
                    <Icon className="h-6 w-6" style={{ color: item.color }} />
                </div>
                <div className="w-0.5 h-4 bg-muted-foreground/30" />
            </div>

            {!isEven ? <div className="h-auto min-h-[160px] flex items-start pt-4">{cardContent}</div> : <div className="h-40"></div>}
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

export const HorizontalRoadmap = ({ items, onEdit, onDelete }: { items: RoadmapItem[], onEdit: (item: RoadmapItem) => void, onDelete: (id: string) => void }) => {
    return (
        <ScrollArea className="w-full whitespace-nowrap rounded-lg">
            <div className="relative flex items-center justify-start p-10 min-w-max">
                {/* Central line */}
                <div className="absolute top-1/2 left-0 w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: items.length * 0.5, ease: "easeInOut" }}
                    />
                </div>
                {/* Items */}
                <div className="flex gap-4 md:gap-8">
                    {items.map((item, index) => (
                        <RoadmapItemNode key={item.id} item={item} index={index} onEdit={onEdit} onDelete={onDelete} />
                    ))}
                </div>
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
};
