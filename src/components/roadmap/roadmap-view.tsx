// src/components/roadmap/roadmap-view.tsx
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoadmapItem } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/auth-context';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Button, buttonVariants } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
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
import * as LucideIcons from 'lucide-react';
import { motion } from 'framer-motion';

const RoadmapItemCard = ({ item, onEdit, onDelete }: { item: RoadmapItem, onEdit: () => void, onDelete: () => void }) => {
    const { user } = useAuth();
    const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Lightbulb;
    
    return (
        <Card className="relative shadow-lg hover:shadow-2xl transition-shadow duration-300 w-72 bg-card/80 backdrop-blur-sm border">
            {user?.role === 'ADMINISTRATOR' && (
                <div className="absolute top-1 right-1 z-10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4"/></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={onEdit}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                            <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
            <CardHeader className="pt-8 text-center">
                 <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" 
                    style={{ backgroundColor: `${item.color}20` }}
                >
                    <Icon className="h-5 w-5" style={{ color: item.color }}/>
                </div>
                <CardTitle className="text-base font-headline">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-xs text-center whitespace-normal">{item.description}</p>
            </CardContent>
        </Card>
    );
};

export const RoadmapView = ({ items, onEdit, onDelete }: { items: RoadmapItem[], onEdit: (item: RoadmapItem) => void, onDelete: () => void }) => {
    const [itemToDelete, setItemToDelete] = React.useState<RoadmapItem | null>(null);
    const { toast } = useToast();
    const { settings } = useAuth();
    
    const phases = settings?.roadmapPhases || [];
    
    const groupedItems = phases.map(phase => {
        const phaseItems = items.filter(item => item.phase === phase).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (phaseItems.length === 0) return null;
        return {
            phase,
            items: phaseItems,
        };
    }).filter((group): group is { phase: string; items: RoadmapItem[] } => group !== null);
    
    const handleDelete = async () => {
        if(!itemToDelete) return;
        try {
            const res = await fetch(`/api/roadmap/${itemToDelete.id}`, { method: 'DELETE' });
            if (res.status !== 204) throw new Error("No se pudo eliminar el hito.");
            toast({ title: 'Hito eliminado' });
            onDelete(); // Callback to refresh data
        } catch(err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
        } finally {
            setItemToDelete(null);
        }
    };
    
    let isEven = true;

    return (
        <div className="relative w-full px-12 md:px-24">
            <div className="relative flex items-center" style={{ minWidth: `${groupedItems.reduce((acc, g) => acc + g.items.length, 0) * 20}rem`}}>
                {/* Timeline rail */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-border -translate-y-1/2" />
                
                <div className="flex items-start gap-4">
                    {groupedItems.map((group, groupIndex) => (
                        <React.Fragment key={group.phase}>
                            <div className="relative pt-4">
                                <div className="absolute top-1/2 left-0 w-px h-12 bg-border -translate-y-full"/>
                                <div className="absolute top-1/2 left-0 w-3 h-3 bg-foreground rounded-full -translate-x-1/2 -translate-y-[calc(100%+14px)]"/>
                                <h2 className="text-xl font-bold font-headline whitespace-nowrap -translate-y-[calc(100%+3rem)]">{group.phase}</h2>
                            </div>
                            {group.items.map((item, itemIndex) => {
                                const currentIsEven = isEven;
                                isEven = !isEven;
                                return (
                                <div key={item.id} className={cn("relative flex flex-col items-center", currentIsEven ? "pt-12" : "pb-12", "ml-4 md:ml-8")}>
                                     {/* Vertical Connector */}
                                     <div className={cn("absolute left-1/2 -translate-x-1/2 w-0.5 h-12", currentIsEven ? 'top-0' : 'bottom-0', 'bg-border')}/>
                                     {/* Dot on timeline */}
                                     <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                                        <div className="relative group">
                                           <div className="w-4 h-4 rounded-full border-2 border-background" style={{ backgroundColor: item.color }}/>
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-max bg-background px-2 py-0.5 rounded-md text-xs font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {format(new Date(item.date), "d MMM, yyyy", { locale: es })}
                                            </div>
                                        </div>
                                     </div>
                                     <motion.div
                                        initial={{ opacity: 0, y: currentIsEven ? 20 : -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: (groupIndex + itemIndex) * 0.1, duration: 0.5 }}
                                        className={cn(currentIsEven ? "mt-[60px]" : "mb-[60px]")}
                                    >
                                        <RoadmapItemCard item={item} onEdit={() => onEdit(item)} onDelete={() => setItemToDelete(item)} />
                                     </motion.div>
                                 </div>
                                )
                            })}
                        </React.Fragment>
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
