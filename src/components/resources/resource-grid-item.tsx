// src/components/resources/resource-grid-item.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import type { AppResourceType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { Card } from '@/components/ui/card';
import { Edit, MoreVertical, Trash2, Lock, Download, Globe, Users, Move, Grip, ArchiveRestore, Pin, BrainCircuit, FileText, ListVideo, Brain, PlusCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DownloadButton } from '../ui/download-button';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { FileIcon } from '../ui/file-icon';
import { Checkbox } from '../ui/checkbox';
import Link from 'next/link';
import { getProcessColors } from '@/lib/utils';
import { IconFolderDynamic } from '../icons/icon-folder-dynamic';
import { IconVideoPlaylist } from '../icons/icon-video-playlist';


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
                    "group w-full h-full transition-all duration-300 ease-in-out cursor-pointer relative border",
                    isFolder ? "hover:-translate-y-1 bg-transparent" : "hover:shadow-lg",
                    isOver && "ring-2 ring-primary ring-offset-2",
                    resource.status === 'ARCHIVED' && 'opacity-60 cursor-default',
                    isSelected && "ring-2 ring-primary"
                )}
            >
                <div className="relative p-2" onClick={handleClick}>
                    {canModify && (
                        <div className="absolute top-2 left-2 z-20" onClick={e => e.stopPropagation()}>
                            <Checkbox 
                                checked={isSelected} 
                                onCheckedChange={(checked) => onSelectionChange(resource.id, !!checked)} 
                                className="bg-background/80 backdrop-blur-sm border-2 border-white shadow-lg"
                                aria-label={`Seleccionar ${resource.title}`}
                            />
                        </div>
                    )}
                    <div className="aspect-[3/2.5] w-full flex items-center justify-center relative rounded-lg overflow-hidden">
                        {isFolder ? (
                             <div className="w-full h-full relative flex items-center justify-center">
                                {resource.type === 'VIDEO_PLAYLIST' ? (
                                    <IconVideoPlaylist className="w-24 h-24 text-primary drop-shadow-md" />
                                ) : (
                                    <IconFolderDynamic color={getProcessColors(resource.id).raw.medium} className="w-full h-full drop-shadow-md" />
                                )}
                                <div className="absolute top-2 right-2 bg-black/30 backdrop-blur-sm p-1.5 rounded-full">
                                   {resource.sharingMode === 'PUBLIC' ? <Globe className="h-4 w-4 text-white"/> : <Users className="h-4 w-4 text-white" />}
                                </div>
                                {isOver && (
                                    <div className="absolute inset-0 bg-primary/20 border-2 border-dashed border-primary flex items-center justify-center rounded-lg">
                                        <Move className="h-8 w-8 text-primary/80 animate-pulse" />
                                    </div>
                                )}
                                {hasQuiz && (
                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                                        <BrainCircuit className="h-3 w-3" />
                                        <span>Quiz</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <FileIcon displayMode="grid" type={resource.filetype?.split('/')[1] || resource.url?.split('.').pop() || 'file'} thumbnailUrl={resource.url} />
                        )}
                        {resource.isPinned && (
                            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm p-2 rounded-full">
                                <Pin className="h-4 w-4 text-white fill-white" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-2 pt-1 border-t">
                    <div className="flex justify-between items-start gap-1">
                        <div className="flex items-start gap-1 flex-grow overflow-hidden text-left" onClick={handleClick}>
                             {canModify && !isFolder && resource.status === 'ACTIVE' && (
                                <div {...listeners} {...attributes} className="p-1 cursor-grab touch-none -ml-1">
                                    <Grip className="h-4 w-4 text-muted-foreground/50" />
                                </div>
                            )}
                            <div className="flex-grow min-w-0">
                                <p className="font-medium text-xs leading-tight break-words">{resource.title}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3"/>{new Date(resource.uploadDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                            </div>
                        </div>
                        {canModify && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground" aria-label={`Opciones para ${resource.title}`} onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button>
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
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
});
ResourceGridItem.displayName = 'ResourceGridItem';
