// src/components/roadmap/interactive-roadmap.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel, { type EmblaCarouselType } from 'embla-carousel-react';
import { motion } from 'framer-motion';
import type { RoadmapItem } from '@/types';
import { Card, CardContent } from '../ui/card';
import { Button, buttonVariants } from '../ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, ArrowRight, MoreVertical, Edit, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import Image from 'next/image';

interface DotButtonProps {
  selected: boolean;
  onClick: () => void;
  label: string;
}

const DotButton: React.FC<DotButtonProps> = ({ selected, onClick, label }) => (
  <button
    className="flex flex-col items-center justify-end h-full group"
    type="button"
    onClick={onClick}
  >
    <span className={`text-xs font-semibold transition-colors capitalize ${selected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
      {label}
    </span>
    <div className={`w-2 h-2 mt-1 rounded-full transition-all duration-300 ${selected ? 'bg-primary scale-125' : 'bg-muted-foreground/50 group-hover:bg-foreground'}`} />
  </button>
);

const RoadmapCard = ({ item, onEdit, onDelete }: { item: RoadmapItem, onEdit: (item: RoadmapItem) => void, onDelete: (id: string) => void }) => {
    const { user } = useAuth();
    const [itemToDelete, setItemToDelete] = useState<RoadmapItem | null>(null);
    const { toast } = useToast();

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
            <Card className="h-full bg-card/80 backdrop-blur-sm border shadow-lg flex flex-col relative group">
                 {user?.role === 'ADMINISTRATOR' && (
                    <div className="absolute top-2 right-2 z-10">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-black/10 hover:text-white">
                                    <MoreVertical className="h-4 w-4"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => onEdit(item)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setItemToDelete(item)} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
                 {item.imageUrl && (
                  <div className="aspect-video w-full relative">
                    <Image src={item.imageUrl} alt={item.title} fill className="object-cover rounded-t-lg" />
                  </div>
                )}
                <CardContent className="p-4 flex flex-col items-center text-center flex-grow">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 border-4" style={{ borderColor: item.color, backgroundColor: `${item.color}20` }}>
                        <Icon className="h-8 w-8" style={{ color: item.color }}/>
                    </div>
                    <Badge style={{ backgroundColor: `${item.color}20`, color: item.color }} className="mb-2 border border-current/30">{item.phase.replace('_', ' ')}</Badge>
                    <h3 className="font-bold text-lg text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{format(new Date(item.date), "d 'de' MMMM, yyyy", { locale: es })}</p>
                    <p className="text-sm text-muted-foreground mt-2 flex-grow whitespace-pre-wrap">{item.description}</p>
                </CardContent>
            </Card>
            <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>Se eliminará permanentemente el hito "<strong>{itemToDelete?.title}</strong>".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({ variant: "destructive" }))}><Trash2 className="mr-2 h-4 w-4"/> Sí, eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export const InteractiveRoadmap = ({ items, onEdit, onDelete }: { items: RoadmapItem[], onEdit: (item: RoadmapItem) => void, onDelete: (id: string) => void }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [indicatorPosition, setIndicatorPosition] = useState({ left: 0, width: 0 });

  const onInit = useCallback((emblaApi: EmblaCarouselType) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on('reInit', onInit);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onInit, onSelect]);

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  useEffect(() => {
    const dotNodes = document.querySelectorAll('.embla__dot');
    if (dotNodes.length > selectedIndex) {
      const selectedDot = dotNodes[selectedIndex] as HTMLElement;
      const container = selectedDot.offsetParent as HTMLElement;
      if (selectedDot && container) {
        const left = selectedDot.offsetLeft;
        const width = selectedDot.offsetWidth;
        setIndicatorPosition({ left, width });
      }
    }
  }, [selectedIndex, scrollSnaps]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  return (
    <div className="w-full max-w-5xl mx-auto">
        <div className="relative mb-8 h-12">
            <div className="flex items-center justify-between h-full px-4 overflow-x-auto thin-scrollbar">
                {items.map((item, index) => (
                    <div key={item.id} className="embla__dot mx-2 flex-shrink-0">
                         <DotButton
                            selected={index === selectedIndex}
                            onClick={() => scrollTo(index)}
                            label={format(new Date(item.date), 'MMM yyyy', { locale: es })}
                        />
                    </div>
                ))}
            </div>
             <motion.div
                className="absolute bottom-0 h-1 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
                animate={indicatorPosition}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
             />
        </div>

      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4">
            {items.map((item) => (
              <div key={item.id} className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 pl-4">
                 <RoadmapCard item={item} onEdit={onEdit} onDelete={onDelete} />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 -left-4 hidden md:block">
           <Button variant="outline" size="icon" onClick={scrollPrev} disabled={!emblaApi?.canScrollPrev()}><ArrowLeft className="h-4 w-4" /></Button>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 -right-4 hidden md:block">
           <Button variant="outline" size="icon" onClick={scrollNext} disabled={!emblaApi?.canScrollNext()}><ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
};
