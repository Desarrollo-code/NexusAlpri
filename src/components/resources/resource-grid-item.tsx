// src/components/resources/resource-grid-item.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import type { AppResourceType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Edit, MoreVertical, Trash2, Lock, Download, Globe, Users, Move, Grip, ArchiveRestore, Pin, BrainCircuit, ListVideo, Edit2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { FileIcon } from '../ui/file-icon';
import { Checkbox } from '../ui/checkbox';
import Link from 'next/link';
import { getProcessColors } from '@/lib/utils';
import { IconFolderDynamic } from '../icons/icon-folder-dynamic';
import { IconVideoPlaylist } from '../icons/icon-video-playlist';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Identicon } from '../ui/identicon';


// --- Sub-components for Page ---
export const ResourceGridItem = React.memo(({ resource, isFolder, onSelect, onEdit, onDelete, onNavigate, onRestore, onTogglePin, isSelected, onSelectionChange }: { 
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
    
    const setNodeRef = (node: HTMLElement | null) => {
        setDraggableNodeRef(node);
        if (isFolder) {
            setDroppableNodeRef(node);
        }
    };
    
    const isQuizEnabled = isFolder && resource.category === 'Formación Interna';
    const hasQuiz = !!resource.quiz;

    const fileExtension = resource.filetype?.split('/')[1] || resource.url?.split('.').pop() || 'file';

    return (
        <div ref={setNodeRef} className={cn("w-full touch-none", isDragging && 'opacity-50 z-10')}>
            <Card
                className={cn(
                    "group w-full h-full transition-all duration-300 ease-in-out cursor-pointer relative border",
                    isFolder ? "hover:-translate-y-1 bg-transparent" : "hover:shadow-lg",
                    isOver && "ring-2 ring-primary ring-offset-2",
                    resource.status === 'ARCHIVED' && 'opacity-60 cursor-default',
                    isSelected && "ring-2 ring-primary"
                )}
                onClick={handleClick}
            >
                <CardHeader className="flex flex-row items-center justify-between p-2">
                    <div className="flex items-center gap-2 flex-grow min-w-0">
                         <FileIcon displayMode="header" type={fileExtension} className="w-5 h-5 flex-shrink-0" />
                         <span className="text-sm font-medium truncate">{resource.title}</span>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground" aria-label={`Opciones para ${resource.title}`} onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            {resource.status === 'ACTIVE' && (
                                <>
                                    <DropdownMenuItem onSelect={() => onTogglePin(resource)}><Pin className="mr-2 h-4 w-4"/>{resource.isPinned ? 'Desfijar' : 'Fijar'}</DropdownMenuItem>
                                    <DropdownMenuItem onClick={()=> onEdit(resource)}><Edit className="mr-2 h-4 w-4" /> Editar / Compartir</DropdownMenuItem>
                                    {isQuizEnabled && (
                                        <DropdownMenuItem asChild>
                                            <Link href={`/resources/${resource.id}/edit-quiz`}><BrainCircuit className="mr-2 h-4 w-4"/> {hasQuiz ? 'Editar Quiz' : 'Añadir Quiz'}</Link>
                                        </DropdownMenuItem>
                                    )}
                                </>
                            )}
                            {resource.status === 'ARCHIVED' && (
                                <DropdownMenuItem onClick={() => onRestore(resource)}><ArchiveRestore className="mr-2 h-4 w-4" /> Restaurar</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(resource)} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>

                <CardContent className="p-0 border-t border-b">
                    <div className="aspect-video w-full flex items-center justify-center relative rounded-none overflow-hidden bg-muted/20">
                       <FileIcon displayMode="grid" type={fileExtension} thumbnailUrl={resource.url} />
                       {resource.hasPin && (
                           <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm p-1 rounded-full">
                               <Lock className="h-3 w-3 text-white"/>
                           </div>
                       )}
                    </div>
                </CardContent>
                
                <CardFooter className="p-2">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={resource.uploader?.avatar || ''} />
                            <AvatarFallback><Identicon userId={resource.uploaderId!} /></AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                            {resource.uploaderName} • {new Date(resource.uploadDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
});
ResourceGridItem.displayName = 'ResourceGridItem';
