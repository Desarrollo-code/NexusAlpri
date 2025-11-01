// src/components/resources/resource-grid-item.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import type { AppResourceType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { Card } from '@/components/ui/card';
import { DecorativeFolder } from '@/components/resources/decorative-folder';
import { Edit, MoreVertical, Trash2, Lock, Download, Globe, ExternalLink, Users, Move, GripVertical, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Image from 'next/image';
import { getYoutubeVideoId, FallbackIcon } from '@/lib/resource-utils';
import { DownloadButton } from '../ui/download-button';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { FileIcon } from '../ui/file-icon';

// --- Sub-components for Page ---
const ResourceGridItem = React.memo(({ resource, isFolder, onSelect, onEdit, onDelete, onNavigate, onRestore }: { resource: AppResourceType, isFolder: boolean, onSelect: () => void, onEdit: (r: AppResourceType) => void, onDelete: (r: AppResourceType) => void, onNavigate: (r: AppResourceType) => void, onRestore: (r:AppResourceType) => void }) => {
    const { user } = useAuth();
    const canModify = user && (user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && resource.uploaderId === user.id));

    const { attributes, listeners, setNodeRef: setDraggableNodeRef, isDragging } = useDraggable({
        id: resource.id,
        data: { type: 'resource', resource: resource },
        disabled: isFolder || !canModify || resource.status === 'ARCHIVED',
    });

    const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
        id: resource.id,
        disabled: !isFolder,
    });

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFolder) {
            if (resource.status === 'ACTIVE') onNavigate(resource);
        } else {
            onSelect();
        }
    };
    
    const Thumbnail = () => {
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

        const fileExtension = resource.fileType?.split('/')[1] || resource.url?.split('.').pop() || 'file';
        return <FileIcon type={fileExtension} />;
    };

    const setNodeRef = (node: HTMLElement | null) => {
        setDraggableNodeRef(node);
        if (isFolder) {
            setDroppableNodeRef(node);
        }
    };
    
    return (
        <div ref={setNodeRef} className={cn("w-full touch-none", isDragging && 'opacity-50 z-10')}>
            <Card 
                className={cn(
                    "group w-full h-full transition-all duration-200 bg-card hover:border-primary/50 hover:shadow-lg",
                    isFolder ? "hover:-translate-y-1" : "",
                    isOver && "ring-2 ring-primary ring-offset-2",
                    resource.status === 'ARCHIVED' && 'opacity-60 bg-muted/50'
                )}
            >
                <div className="aspect-[3/2] w-full flex items-center justify-center relative border-b overflow-hidden rounded-t-lg bg-muted/20 cursor-pointer" onClick={handleClick}>
                    <Thumbnail />
                     {resource.hasPin && !isFolder && (
                        <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm p-1 rounded-full">
                            <Lock className="h-3 w-3 text-amber-400" />
                        </div>
                    )}
                </div>
                <div className="p-2.5">
                    <div className="flex justify-between items-start gap-1">
                         <div className="flex items-start gap-1.5 flex-grow overflow-hidden">
                            {canModify && !isFolder && resource.status === 'ACTIVE' ? (
                                <div {...listeners} {...attributes} className="p-1 cursor-grab touch-none">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="w-6 h-4"/>
                            )}
                            <p className="font-medium text-xs leading-tight break-words">{resource.title}</p>
                        </div>
                        {canModify && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mr-1 text-muted-foreground" aria-label={`Opciones para ${resource.title}`} onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    {resource.status === 'ACTIVE' && (
                                        <>
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
                                        </>
                                    )}
                                    {resource.status === 'ARCHIVED' && (
                                        <DropdownMenuItem onClick={() => onRestore(resource)}>
                                            <ArchiveRestore className="mr-2 h-4 w-4" /> Restaurar
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onDelete(resource)} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar Permanentemente</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                    <p className={cn("text-xs text-muted-foreground mt-1", canModify && !isFolder && "pl-7")}>
                        {new Date(resource.uploadDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                </div>
            </Card>
        </div>
    );
});
ResourceGridItem.displayName = 'ResourceGridItem';
export { ResourceGridItem };
