// src/components/roadmap/roadmap-view.tsx
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Code, Database, Paintbrush, Rocket, CheckCircle, Lightbulb, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoadmapItem } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/auth-context';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
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

const ICONS: Record<string, React.ElementType> = {
    Lightbulb, Code, Database, Paintbrush, Rocket, CheckCircle, Award: Rocket, Sparkles: Rocket, UsersRound: Rocket, FileText: Rocket, Shield: Rocket
};

const RoadmapItemCard = ({ item, onEdit, onDelete }: { item: RoadmapItem, onEdit: () => void, onDelete: () => void }) => {
    const { user } = useAuth();
    const Icon = ICONS[item.icon] || Lightbulb;
    
    return (
        <Card className="relative shadow-lg hover:shadow-2xl transition-shadow duration-300">
            {user?.role === 'ADMINISTRATOR' && (
                <div className="absolute top-2 right-2">
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
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                        <Icon className="h-5 w-5" style={{ color: item.color }}/>
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">{format(new Date(item.date), "MMMM, yyyy", { locale: es })}</p>
                </div>
                <CardTitle className="text-base font-headline pt-2">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm">{item.description}</p>
            </CardContent>
        </Card>
    );
};

export const RoadmapView = ({ items, onEdit, onDelete }: { items: RoadmapItem[], onEdit: (item: RoadmapItem) => void, onDelete: () => void }) => {
    const [itemToDelete, setItemToDelete] = React.useState<RoadmapItem | null>(null);
    const { toast } = useToast();

    const phases = ['FASE_1', 'FASE_2', 'FASE_3', 'FASE_4', 'FASE_5'];
    const phaseLabels: Record<string, string> = {
        'FASE_1': 'Fase 1: Concepción y Planificación',
        'FASE_2': 'Fase 2: Arquitectura y Backend',
        'FASE_3': 'Fase 3: Interfaz de Usuario',
        'FASE_4': 'Fase 4: Refinamiento y Despliegue',
        'FASE_5': 'Fase 5: Evolución Continua',
    };

    const groupedItems = phases.map(phase => ({
        phase,
        label: phaseLabels[phase],
        items: items.filter(item => item.phase === phase).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    })).filter(group => group.items.length > 0);
    
    const handleDelete = async () => {
        if(!itemToDelete) return;
        try {
            const res = await fetch(`/api/roadmap/${itemToDelete.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("No se pudo eliminar el hito.");
            toast({ title: 'Hito eliminado' });
            onDelete(); // Callback to refresh data
        } catch(err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
        } finally {
            setItemToDelete(null);
        }
    };
    
    return (
        <div className="relative w-full max-w-4xl mx-auto">
            <div className="absolute left-6 md:left-1/2 top-0 h-full w-0.5 bg-border -translate-x-1/2" />

            <div className="space-y-12">
                {groupedItems.map((group, groupIndex) => (
                    <div key={group.phase} className="space-y-8">
                         <h2 className="text-center md:text-left md:pl-16 text-2xl font-bold font-headline sticky top-16 bg-background/80 backdrop-blur-sm py-2 z-10">{group.label}</h2>
                        {group.items.map((item, itemIndex) => {
                            const isEven = itemIndex % 2 === 0;
                            return (
                                <div key={item.id} className="relative flex items-start gap-4 md:gap-8">
                                    <div className={cn("absolute left-6 top-1 h-10 w-10 rounded-full flex items-center justify-center -translate-x-1/2", "md:static md:translate-x-0", !isEven && "md:order-2")} style={{ backgroundColor: `${item.color}20` }}>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: item.color }}><span className="text-white font-bold text-xs"></span></div>
                                    </div>
                                    <div className={cn("w-full pl-12 md:pl-0", isEven ? "md:w-1/2" : "md:w-1/2 md:pl-8 md:order-1")}>
                                        <RoadmapItemCard item={item} onEdit={() => onEdit(item)} onDelete={() => setItemToDelete(item)}/>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará permanentemente el hito "<strong>{itemToDelete?.title}</strong>".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: 'destructive'})}>
                           <Trash2 className="mr-2 h-4 w-4"/> Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
