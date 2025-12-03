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

const TimelineItem = ({ item, index, onEdit, onDelete }: { item: RoadmapItem, index: number, onEdit: (item: RoadmapItem) => void, onDelete: (id: string) => void }) => {
    const { user } = useAuth();
    const [itemToDelete, setItemToDelete] = useState<RoadmapItem | null>(null);
    const { toast } = useToast();

    const isOdd = index % 2 !== 0;
    const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Lightbulb;

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
        <div className={cn("relative flex flex-col items-center w-48 md:w-56", isOdd ? 'self-end' : 'self-start')}>
            {/* Contenedor del Banderín y Descripción */}
            <div className={cn("relative w-full bg-background border rounded-lg shadow-lg p-3 text-center order-2", isOdd ? 'mt-8' : 'mb-8')}>
                {/* Flecha del Banderín */}
                <div 
                    className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-background border-r border-b transform rotate-45"
                    style={isOdd ? { top: '-8px', borderTop: 'none', borderLeft: 'none' } : { bottom: '-8px', borderBottom: 'none', borderRight: 'none' }}
                />
                 {/* Contenido del Banderín */}
                <div className="relative z-10">
                    <div 
                        className="absolute -top-6 -left-5 -right-5 h-8 text-white font-bold flex items-center justify-center text-lg"
                    >
                         <div className="absolute inset-0 z-0" style={{backgroundColor: item.color, clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)'}}/>
                         <span className="z-10">{format(new Date(item.date), "yyyy")}</span>
                    </div>
                    <div className="pt-4">
                        <p className="text-sm font-semibold text-foreground line-clamp-2">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{item.description}</p>
                    </div>
                </div>
            </div>
            {/* Icono Circular y Línea Vertical */}
            <div className={cn("flex flex-col items-center order-1", isOdd ? 'absolute top-0' : 'absolute bottom-0')}>
                {/* Icono */}
                <div className="relative group">
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-full flex items-center justify-center border-4" style={{ backgroundColor: `${item.color}20`, borderColor: item.color }}>
                        <Icon className="h-8 w-8 md:h-10 md:w-10" style={{ color: item.color }} />
                    </div>
                    {user?.role === 'ADMINISTRATOR' && (
                        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="icon" className="h-6 w-6 rounded-full shadow-md"><MoreVertical className="h-4 w-4"/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => onEdit(item)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setItemToDelete(item)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
                 {/* Línea de Conexión */}
                 <div className={cn("w-0.5 h-16", isOdd ? 'mt-[-4px]' : 'mb-[-4px]')} style={{background: `linear-gradient(${isOdd ? 'to bottom' : 'to top'}, ${item.color}, transparent)`}} />
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

export const InteractiveRoadmap = ({ items, onEdit, onDelete }: { items: RoadmapItem[], onEdit: (item: RoadmapItem) => void, onDelete: (id: string) => void }) => {
    
  return (
    <div className="w-full relative px-4 md:px-10 py-12">
      {/* Línea de tiempo central */}
      <div 
        className="absolute top-1/2 left-0 w-full h-2.5 -translate-y-1/2"
        style={{
            background: 'linear-gradient(90deg, #f59e0b, #ec4899, #8b5cf6)',
            clipPath: 'polygon(0 0, 100% 0, 98% 50%, 100% 100%, 0 100%)'
        }}
      />
      {/* Contenedor de hitos */}
      <div className="relative flex justify-between items-center">
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
             {/* Puntos en la línea de tiempo */}
             <div className="relative flex-shrink-0">
                <div className="h-6 w-6 rounded-full bg-background border-4 border-primary shadow-md" />
            </div>
            {/* Hitos */}
            <TimelineItem item={item} index={index} onEdit={onEdit} onDelete={onDelete} />
          </React.Fragment>
        ))}
        {/* Punto final para balancear visualmente */}
        <div className="relative flex-shrink-0">
           <div className="h-6 w-6 rounded-full bg-background border-4 border-primary shadow-md" />
        </div>
      </div>
    </div>
  );
};
