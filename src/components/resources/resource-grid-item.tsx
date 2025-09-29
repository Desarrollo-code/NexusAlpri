// src/components/resources/resource-grid-item.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import type { AppResourceType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { Card } from '@/components/ui/card';
import { DecorativeFolder } from '@/components/resources/decorative-folder';
import { Edit, MoreVertical, Trash2, Lock, Download, Globe, ExternalLink, Users, Move, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Image from 'next/image';
import { getIconForType, getYoutubeVideoId, FallbackIcon } from '@/lib/resource-utils';
import { DownloadButton } from '../ui/download-button';
import { useDraggable, useDroppable } from '@dnd-kit/core';

// --- Sub-components for Page ---
const ResourceGridItem = React.memo(({ resource, isFolder, onSelect, onEdit, onDelete, onNavigate }: { resource: AppResourceType, isFolder: boolean, onSelect: () => void, onEdit: (r: AppResourceType) => void, onDelete: (r: AppResourceType) => void, onNavigate: (r: AppResourceType) => void }) => {
    const { user } = useAuth();
    const canModify = user && (user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && resource.uploaderId === user.id));

    const { attributes, listeners, setNodeRef: setDraggableNodeRef, isDragging } = useDraggable({
        id: resource.id,
        data: { type: 'resource', resource: resource },
        disabled: isFolder || !canModify,
    });

    const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
        id: resource.id,
        disabled: !isFolder,
    });

    const handleClick = (e: React.MouseEvent) => {
        // Previene que el evento de clic se propague al listener de dnd-kit
        e.stopPropagation();
        if (isFolder) {
            onNavigate(resource);
        } else {
            onSelect();
        }
    };
    
    const Thumbnail = () => {
        const isImage = !isFolder && resource.url && /\.(jpe?g|png|gif|webp)$/i.test(resource.url);
        const youtubeId = !isFolder && resource.type === 'VIDEO' ? getYoutubeVideoId(resource.url) : null;
        
        if (isFolder) {
            return (
                <div className="w-full h-full relative" onClick={handleClick}>
                    <DecorativeFolder patternId={resource.id} className="absolute inset-0" />
                    <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm p-1.5 rounded-full">
                       {resource.ispublic ? <Globe className="h-3.5 w-3.5 text-green-500"/> : <Users className="h-3.5 w-3.5 text-blue-500" />}
                    </div>
                    {isOver && (
                        <div className="absolute inset-0 bg-primary/20 border-2 border-dashed border-primary flex items-center justify-center">
                            <Move className="h-8 w-8 text-primary/80 animate-pulse" />
                        </div>
                    )}
                </div>
            );
        }

        if (isImage) {
           return <Image src={resource.url!} alt={resource.title} fill className="object-contain p-2" data-ai-hint="resource document"/>
        }
        if (youtubeId) {
            return <Image src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`} alt={resource.title} fill className="object-cover" data-ai-hint="video thumbnail" quality={100} priority/>
        }
        return <FallbackIcon resource={resource} />;
    };

    const Icon = !isFolder ? getIconForType(resource.type) : null;

    const setNodeRef = (node: HTMLElement | null) => {
        setDraggableNodeRef(node);
        if (isFolder) {
            setDroppableNodeRef(node);
        }
    };
    
    return (
        <div ref={setNodeRef} className={cn("w-full touch-none", isDragging && 'opacity-50')}>
            <Card 
                className={cn(
                    "group w-full h-full transition-all duration-200 bg-card hover:border-primary/50 hover:shadow-lg",
                    isFolder ? "hover:-translate-y-1" : "",
                    isOver && "ring-2 ring-primary ring-offset-2"
                )}
            >
                <div className="aspect-video w-full flex items-center justify-center relative border-b overflow-hidden rounded-t-lg bg-muted/20 cursor-pointer" onClick={handleClick}>
                    <Thumbnail />
                     {resource.hasPin && !isFolder && (
                        <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm p-1 rounded-full">
                            <Lock className="h-3 w-3 text-amber-400" />
                        </div>
                    )}
                </div>
                <div className="p-3">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-2 flex-grow overflow-hidden">
                          {canModify && !isFolder && (
                            <div {...listeners} {...attributes} className="p-1 cursor-grab touch-none">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          {!canModify && Icon && <Icon className="h-4 w-4 shrink-0 mt-0.5" />}
                          <p className="font-medium text-sm leading-tight break-words">{resource.title}</p>
                        </div>
                        {canModify && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-2 text-muted-foreground" aria-label={`Opciones para ${resource.title}`} onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    {!isFolder && resource.url && (
                                        resource.type === 'EXTERNAL_LINK' ? (
                                            <DropdownMenuItem asChild>
                                                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="mr-2 h-4 w-4" /> Visitar Enlace
                                                </a>
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem asChild>
                                               <DownloadButton
                                                    url={resource.url}
                                                    resourceId={resource.id}
                                                    hasPin={resource.hasPin}
                                                    className="w-full justify-start font-normal h-auto py-1.5 px-2"
                                                    variant="ghost"
                                                >
                                                     <Download className="mr-2 h-4 w-4" /> Descargar
                                                </DownloadButton>
                                            </DropdownMenuItem>
                                        )
                                    )}
                                    <DropdownMenuItem onClick={()=> onEdit(resource)}>
                                        <Edit className="mr-2 h-4 w-4" /> Editar / Compartir
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onDelete(resource)} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                    <p className={cn("text-xs text-muted-foreground mt-1", canModify && !isFolder && "pl-8")}>
                        {new Date(resource.uploadDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                </div>
            </Card>
        </div>
    );
});
ResourceGridItem.displayName = 'ResourceGridItem';
export { ResourceGridItem };
