// src/components/resources/resource-list-item.tsx
'use client';
import React from 'react';
import type { AppResourceType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Lock, Download, Globe, Users, ExternalLink, User, GripVertical, ArchiveRestore, Tag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DownloadButton } from '../ui/download-button';
import { Identicon } from '../ui/identicon';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { useDraggable } from '@dnd-kit/core';
import { FileIcon } from '../ui/file-icon';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import { Badge } from '../ui/badge';
import { formatFileSize } from '@/lib/utils';

interface ResourceListItemProps {
    resource: AppResourceType;
    onSelect: () => void;
    onEdit: (resource: AppResourceType) => void;
    onDelete: (resource: AppResourceType) => void;
    onRestore: (resource: AppResourceType) => void;
}


export const ResourceListItem = React.memo(({ resource, onSelect, onEdit, onDelete, onRestore }: ResourceListItemProps) => {
    const { user } = useAuth();
    const canModify = user && (user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && resource.uploaderId === user.id));
    
    const youtubeId = getYoutubeVideoId(resource.url);
    const fileExtension = youtubeId ? 'youtube' : (resource.fileType?.split('/')[1] || resource.url?.split('.').pop() || 'file');

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: resource.id,
        data: { type: 'resource', resource: resource },
        disabled: !canModify || resource.status === 'ARCHIVED',
    });

    return (
        <div ref={setNodeRef} className={cn("touch-none", isDragging && 'opacity-50 z-10')}>
            <div onClick={onSelect} className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_minmax(0,3fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center p-2 rounded-lg hover:bg-muted/50 cursor-pointer border-b gap-4">
                {/* Drag Handle */}
                <div 
                    {...attributes} 
                    {...listeners} 
                    className={cn(
                        "p-2 cursor-grab text-muted-foreground",
                        (!canModify || resource.status === 'ARCHIVED') && "cursor-default opacity-0"
                    )}
                     onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="h-5 w-5" />
                </div>
                
                {/* Thumbnail y Título */}
                 <div className="flex items-center gap-3 min-w-0">
                     <FileIcon displayMode="list" type={fileExtension} thumbnailUrl={youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null} />
                    <div className="min-w-0">
                        <p className="font-semibold truncate text-foreground text-sm">{resource.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{resource.description || 'Sin descripción'}</p>
                    </div>
                </div>

                {/* Uploader */}
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={resource.uploader?.avatar || undefined} />
                        <AvatarFallback className="text-xs"><Identicon userId={resource.uploaderId || ''} /></AvatarFallback>
                    </Avatar>
                    <span className="truncate">{resource.uploaderName}</span>
                </div>
                
                 {/* Category */}
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                   <Badge variant="outline">{resource.category || "General"}</Badge>
                </div>
                
                {/* Size */}
                <div className="hidden lg:flex text-sm text-muted-foreground font-mono">
                    {formatFileSize(resource.size)}
                </div>

                {/* Fecha y Permisos */}
                <div className="hidden md:flex items-center gap-4 text-muted-foreground text-sm justify-end">
                     <span>{new Date(resource.uploadDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5">
                                {resource.ispublic ? <Globe className="h-4 w-4 text-green-500" /> : <Users className="h-4 w-4 text-blue-500"/>}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{resource.ispublic ? 'Público' : 'Privado'}</p>
                            </TooltipContent>
                        </Tooltip>
                         {resource.hasPin && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Lock className="h-4 w-4 text-amber-500" />
                                </TooltipTrigger>
                                 <TooltipContent><p>Protegido con PIN</p></TooltipContent>
                            </Tooltip>
                         )}
                    </TooltipProvider>
                </div>
                
                {/* Actions */}
                <div className="ml-auto pl-2 flex-shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Opciones para ${resource.title}`} onClick={(e) => e.stopPropagation()}>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            {resource.status === 'ACTIVE' ? (
                                <>
                                    {resource.url && (
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
                                    {canModify && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onEdit(resource)}>
                                                <Edit className="mr-2 h-4 w-4" /> Editar / Compartir
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </>
                            ) : (
                               <>
                                 {canModify && (
                                    <DropdownMenuItem onClick={() => onRestore(resource)}>
                                        <ArchiveRestore className="mr-2 h-4 w-4" /> Restaurar
                                    </DropdownMenuItem>
                                 )}
                               </>
                            )}
                             {canModify && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onDelete(resource)} className="text-destructive focus:bg-destructive/10">
                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar Permanentemente
                                    </DropdownMenuItem>
                                </>
                             )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
});

ResourceListItem.displayName = 'ResourceListItem';
