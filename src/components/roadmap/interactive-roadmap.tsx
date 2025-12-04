// src/components/roadmap/interactive-roadmap.tsx
'use client';

import React, { useState } from 'react';
import type { RoadmapItem } from '@/types';
import { Button, buttonVariants } from '../ui/button';
import { Edit, Trash2, MoreVertical } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '../ui/card';
import { motion } from 'framer-motion';
import Image from 'next/image';


const TimelineItem = ({ item, index, onEdit, onDelete }: { item: RoadmapItem, index: number, onEdit: (item: RoadmapItem) => void, onDelete: (id: string) => void }) => {
    const { user } = useAuth();
    const [itemToDelete, setItemToDelete] = useState<RoadmapItem | null>(null);
    const { toast } = useToast();

    const isOdd = index % 2 !== 0;
    const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Lightbulb;
    
    const colorVar = `hsl(var(--chart-${(index % 5) + 1}))`;

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
    
    return (
       <>
        <div className={cn(
            "relative w-full md:w-auto flex",
            isOdd ? 'md:flex-col-reverse md:justify-end' : 'md:flex-col md:justify-start'
        )}>
            <motion.div 
                className="relative w-full max-w-sm bg-card/80 backdrop-blur-md border rounded-lg shadow-lg p-4 text-center transition-all duration-300 ease-in-out"
                whileHover={{ y: isOdd ? 5 : -5, scale: 1.02 }}
            >
                <div 
                    className="absolute -top-4 left-1/2 -translate-x-1/2 w-fit px-3 py-1 rounded-full text-primary-foreground font-bold text-xs shadow-md"
                    style={{backgroundColor: colorVar}}
                >
                    {format(new Date(item.date), "dd MMM, yyyy", { locale: es })}
                </div>
                <div className="pt-6 text-left">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: colorVar }}>
                      {item.phase.replace('_', ' ')}
                    </p>
                    <p className="text-lg font-bold font-headline text-foreground mt-1">{item.title}</p>
                    
                    {item.imageUrl && (
                        <div className="relative w-full aspect-video rounded-md overflow-hidden my-2 border">
                            <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                        </div>
                    )}

                    <p className="text-sm text-muted-foreground mt-2 text-left whitespace-pre-wrap">{item.description}</p>
                </div>
                 {user?.role === 'ADMINISTRATOR' && (
                    <div className="absolute top-2 right-2">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4"/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => onEdit(item)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setItemToDelete(item)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </motion.div>
            
            <div className={cn(
                "hidden md:flex flex-col items-center",
                isOdd ? 'mb-[-2px]' : 'mt-[-2px]'
            )}>
               <div className="w-0.5 h-20 bg-border" />
                <motion.div 
                    className="relative group"
                    whileHover={{ scale: 1.1 }}
                >
                     <div className="absolute -inset-1.5 rounded-full bg-primary/10 transition-all duration-300 group-hover:inset-0" />
                     <div className="relative h-16 w-16 rounded-full flex items-center justify-center border-4 bg-background" style={{ borderColor: colorVar }}>
                        <Icon className="h-8 w-8" style={{ color: colorVar }}/>
                    </div>
                </motion.div>
               <div className="w-0.5 h-20 bg-border" />
            </div>
        </div>
        <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription>Se eliminará permanentemente el hito "<strong>{itemToDelete?.title}</strong>".</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({ variant: "destructive" }))}><Trash2 className="mr-2 h-4 w-4"/> Sí, eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
       </>
    );
};

const MobileTimelineCard = ({ item, onEdit, onDelete }: { item: RoadmapItem, onEdit: (item: RoadmapItem) => void, onDelete: (id: string) => void }) => {
    const { user } = useAuth();
    const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Lightbulb;

    return (
        <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-1">
            <CardHeader className="p-4 border-b">
                 <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3">
                         <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10">
                            <Icon className="w-6 h-6 text-primary"/>
                         </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-primary">
                              {item.phase.replace('_', ' ')}
                            </p>
                            <CardTitle className="text-base font-bold text-foreground">{item.title}</CardTitle>
                            <p className="text-xs font-semibold text-primary">{format(new Date(item.date), "dd MMMM, yyyy", { locale: es })}</p>
                        </div>
                    </div>
                    {user?.role === 'ADMINISTRATOR' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4"/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => onEdit(item)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onDelete(item.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                 </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                {item.imageUrl && (
                    <div className="relative w-full aspect-video rounded-md overflow-hidden mb-4">
                        <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                    </div>
                )}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
            </CardContent>
        </Card>
    )
}

export const InteractiveRoadmap = ({ items, onEdit, onDelete }: { items: RoadmapItem[], onEdit: (item: RoadmapItem) => void, onDelete: (id: string) => void }) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Carousel className="w-full max-w-sm mx-auto">
                <CarouselContent>
                    {items.map(item => (
                        <CarouselItem key={item.id}>
                            <div className="p-1 h-full">
                                <MobileTimelineCard item={item} onEdit={onEdit} onDelete={onDelete}/>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="-left-4" />
                <CarouselNext className="-right-4" />
            </Carousel>
        )
    }
  
    return (
        <div className="w-full relative px-8 md:px-24 py-16">
            {/* Línea de tiempo central */}
            <div 
                className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20"
            />
            {/* Contenedor de hitos */}
            <div className="relative flex justify-between items-center w-full">
                {items.map((item, index) => (
                    <TimelineItem key={item.id} item={item} index={index} onEdit={onEdit} onDelete={onDelete} />
                ))}
            </div>
        </div>
    );
};
