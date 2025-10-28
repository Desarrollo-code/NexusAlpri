// src/components/announcements/announcement-card.tsx
'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Announcement, Reaction, UserRole, Attachment } from '@/types';
import { Edit, Trash2, SmilePlus, MoreVertical, Pin, PinOff, X, ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Identicon } from '@/components/ui/identicon';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getIconForFileType } from '@/lib/resource-utils';
import { useInView } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import useEmblaCarousel from 'embla-carousel-react';
import { VerifiedBadge } from '@/components/ui/verified-badge';

const EMOJI_REACTIONS = ['👍', '❤️', '🎉', '💡', '🤔'];

// --- Visor de Imágenes ---
const ImageViewer = ({ isOpen, onClose, images, startIndex }: { isOpen: boolean, onClose: () => void, images: Attachment[], startIndex: number }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, startIndex });
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => {
            setCurrentIndex(emblaApi.selectedScrollSnap());
        };
        emblaApi.on('select', onSelect);
        return () => {
            emblaApi.off('select', onSelect);
        };
    }, [emblaApi]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-screen h-screen max-w-full max-h-full p-0 flex flex-col bg-black/80 backdrop-blur-sm border-0 rounded-none">
                <DialogTitle className="sr-only">Visor de Imágenes</DialogTitle>
                <div className="absolute top-4 right-4 z-50">
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:text-white hover:bg-white/20">
                        <X className="h-6 w-6"/>
                    </Button>
                </div>
                 <div className="relative w-full h-full flex-1" ref={emblaRef}>
                    <div className="flex h-full">
                        {images.map((img, index) => (
                            <div key={index} className="relative flex-[0_0_100%] h-full flex items-center justify-center p-8">
                                <Image src={img.url} alt={img.name} fill className="object-contain" />
                            </div>
                        ))}
                    </div>
                </div>
                {images.length > 1 && (
                    <>
                        <div className="absolute top-1/2 left-4 -translate-y-1/2 z-50">
                            <Button variant="ghost" size="icon" onClick={scrollPrev} className="rounded-full h-12 w-12 text-white hover:text-white hover:bg-white/20">
                                <ChevronLeft className="h-8 w-8"/>
                            </Button>
                        </div>
                        <div className="absolute top-1/2 right-4 -translate-y-1/2 z-50">
                            <Button variant="ghost" size="icon" onClick={scrollNext} className="rounded-full h-12 w-12 text-white hover:text-white hover:bg-white/20">
                                <ChevronRight className="h-8 w-8"/>
                            </Button>
                        </div>
                         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};


interface AnnouncementCardProps {
  announcement: Announcement;
  onSelect: () => void;
  isSelected: boolean;
}

const timeSince = (date: string): string => {
  const dateObj = new Date(date);
  const now = new Date();
  const diffSeconds = Math.round((now.getTime() - dateObj.getTime()) / 1000);

  if (diffSeconds < 5) return 'Ahora';
  if (diffSeconds < 60) return `Hace ${diffSeconds}s`;
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `Hace ${diffMinutes}m`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};


export function AnnouncementCard({ announcement, onSelect, isSelected }: AnnouncementCardProps) {
  
  return (
    <button
        onClick={onSelect}
        className={cn(
            "flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors w-full",
            isSelected ? "bg-primary/10" : "hover:bg-muted"
        )}
    >
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Megaphone className="h-5 w-5" />
        </div>
        <div className="flex-grow overflow-hidden">
            <div className="flex justify-between items-center">
                <p className="font-semibold truncate text-sm">{announcement.title}</p>
                <p className="text-xs text-muted-foreground shrink-0 ml-2">{timeSince(announcement.date)}</p>
            </div>
            <p className="text-xs text-muted-foreground truncate">{announcement.author?.name || 'Sistema'}</p>
        </div>
    </button>
  );
}

// ... (ImageViewer y otras funciones auxiliares se mantienen igual)
