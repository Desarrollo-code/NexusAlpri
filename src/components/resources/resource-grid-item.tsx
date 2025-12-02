// src/components/resources/resource-grid-item.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import type { AppResourceType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { Card } from '@/components/ui/card';
import { Edit, MoreVertical, Trash2, Lock, Download, Globe, Users, Move, Grip, ArchiveRestore, Pin, BrainCircuit, FileText, ListVideo, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from 'next/image';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import { DownloadButton } from '../ui/download-button';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { FileIcon } from '../ui/file-icon';
import { DecorativeFolder } from './decorative-folder';
import { ExternalLink } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import Link from 'next/link';

// --- Sub-components for Page ---
const ResourceGridItem = React.memo(({ resource, isFolder, onSelect, onEdit, onDelete, onNavigate, onRestore, onTogglePin, isSelected, onSelectionChange }: { 
    resource: AppResourceType, 
    isFolder: boolean, 
    onSelect: () => void, 
    onEdit: (r: AppResourceType) => void, 
    onDelete: (r: AppResourceType) => void, 
    onNavigate: (r: AppResourceType) => void, 
    onRestore: (r:AppResourceType) => void,
    onTogglePin: (r: AppResourceType) => void,
    isSelected: boolean,
    onSelectionChange: (id: string, checked: boolean) => void,
}) => {
    const { user } = useAuth();
    const canModify = user && (user.role === 'ADMINISTRATOR' || user.role === 'INSTRUCTOR');

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
        if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement || e.target.closest('button, a, input[type="checkbox"]')) {
            return;
        }
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
                    {resource.type === 'VIDEO_PLAYLIST' && (
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                            <ListVideo className="h-3 w-3"/>
                            <span>Playlist</span>
                        </div>
                    )}
                </div>
            );
        }

        const youtubeId = getYoutubeVideoId(resource.url);
        const fileExtension = youtubeId ? 'youtube' : (resource.fileType?.split('/')[1] || resource.url?.split('.').pop() || 'file');
        
        return <FileIcon displayMode="grid" type={fileExtension} thumbnailUrl={youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : resource.url} />;
    };

    const setNodeRef = (node: HTMLElement | null) => {
        setDraggableNodeRef(node);
        if (isFolder) {
            setDroppableNodeRef(node);
        }
    };
    
    const isQuizEnabled = isFolder && resource.category === 'Formación Interna';
    const hasQuiz = !!resource.quiz;

    return (
        <div ref={setNodeRef} className={cn("w-full touch-none", isDragging && 'opacity-50 z-10')}>
            <Card 
                className={cn(
                    "group w-full h-full transition-all duration-200 bg-card hover:border-primary/50 hover:shadow-lg relative",
                    isFolder ? "hover:-translate-y-1" : "",
                    isOver && "ring-2 ring-primary ring-offset-2",
                    resource.status === 'ARCHIVED' && 'opacity-60 bg-muted/50',
                    isSelected && "ring-2 ring-primary ring-offset-2 border-primary/80"
                )}
            >
                {canModify && (
                  <div className="absolute top-2 left-2 z-20">
                     <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelectionChange(resource.id, !!checked)}
                        onClick={e => e.stopPropagation()}
                        className="bg-background/80 backdrop-blur-sm data-[state=checked]:bg-primary"
                    />
                  </div>
                )}
                <div className="aspect-[3/2] w-full flex items-center justify-center relative border-b overflow-hidden rounded-t-lg bg-muted cursor-pointer" onClick={handleClick}>
                    <Thumbnail />
                     {resource.hasPin && !isFolder && (
                        <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm p-1 rounded-full">
                            <Lock className="h-3 w-3 text-amber-400" />
                        </div>
                    )}
                    {resource.isPinned && (
                         <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm p-1 rounded-full">
                            <Pin className="h-3 w-3 text-blue-500 fill-blue-500" />
                        </div>
                    )}
                </div>
                <div className="p-2.5">
                    <div className="flex justify-between items-start gap-1">
                         <div className="flex items-start gap-1.5 flex-grow overflow-hidden">
                            {canModify && !isFolder && resource.status === 'ACTIVE' ? (
                                <div {...listeners} {...attributes} className="p-1 cursor-grab touch-none">
                                    <Grip className="h-4 w-4 text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="w-6 h-4"/>
                            )}
                            <p className="font-medium text-xs leading-tight break-words">{resource.title}</p>
                        </div>
                        {canModify && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mr-1 -mt-1 text-muted-foreground" aria-label={`Opciones para ${resource.title}`} onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    {resource.status === 'ACTIVE' && (
                                        <>
                                            <DropdownMenuItem onSelect={() => onTogglePin(resource)}><Pin className="mr-2 h-4 w-4"/>{resource.isPinned ? 'Desfijar' : 'Fijar'}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={()=> onEdit(resource)}><Edit className="mr-2 h-4 w-4" /> Editar / Compartir</DropdownMenuItem>
                                        </>
                                    )}
                                    {resource.status === 'ARCHIVED' && (
                                        <DropdownMenuItem onClick={() => onRestore(resource)}><ArchiveRestore className="mr-2 h-4 w-4" /> Restaurar</DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onDelete(resource)} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                     <p className={cn("text-xs text-muted-foreground mt-1", canModify && !isFolder && "pl-7")}>
                        {new Date(resource.uploadDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                </div>
                 {isQuizEnabled && (
                    <div className="px-2 pb-2">
                        <Button asChild size="sm" className="w-full">
                           <Link href={canModify ? `/resources/${resource.id}/edit-quiz` : (hasQuiz ? `/forms/${resource.quiz?.id}/view` : '#')}>
                              {hasQuiz ? <BrainCircuit className="mr-2 h-4 w-4"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                              {canModify ? (hasQuiz ? 'Editar Quiz' : 'Crear Quiz') : (hasQuiz ? 'Realizar Quiz' : 'Quiz no disponible')}
                           </Link>
                        </Button>
                    </div>
                 )}
            </Card>
        </div>
    );
});
ResourceGridItem.displayName = 'ResourceGridItem';
export { ResourceGridItem };
