// src/components/resources/resource-list-item.tsx
'use client';
import React from 'react';
import type { AppResourceType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Lock, Download, Globe, Users, ExternalLink, User, Grip, ArchiveRestore, Tag, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DownloadButton } from '../ui/download-button';
import { Identicon } from '../ui/identicon';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { useDraggable } from '@dnd-kit/core';
import { FileIcon } from '../ui/file-icon';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import { Badge } from '../ui/badge';
import { formatFileSize } from '@/lib/utils';
import { TableRow, TableCell } from '../ui/table';

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
        <div ref={setNodeRef} onClick={onSelect} className={cn("grid grid-cols-12 gap-4 px-4 items-center h-16 cursor-pointer border-b hover:bg-muted/50 transition-colors", isDragging && 'opacity-50 z-10')}>
            {/* Drag Handle, Thumbnail & Title */}
            <div className="col-span-5 md:col-span-4 flex items-center gap-2 min-w-0">
                 {canModify && !resource.type.includes('FOLDER') && resource.status === 'ACTIVE' ? (
                    <div {...listeners} {...attributes} className="p-1 cursor-grab touch-none text-muted-foreground"><Grip className="h-5 w-5" /></div>
                ) : ( <div className="w-7"/> )}
                <FileIcon displayMode="list" type={fileExtension} thumbnailUrl={youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null} />
                <div className="flex-grow min-w-0">
                    <p className="font-semibold truncate text-foreground text-sm">{resource.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{resource.description || 'Sin descripción'}</p>
                </div>
            </div>

            {/* Uploader */}
            <div className="col-span-2 hidden md:flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                 <Avatar className="h-6 w-6">
                    <AvatarImage src={resource.uploader?.avatar || undefined} />
                    <AvatarFallback className="text-xs"><Identicon userId={resource.uploaderId || ''} /></AvatarFallback>
                </Avatar>
                <span className="truncate">{resource.uploaderName}</span>
            </div>
            
            {/* Category */}
            <div className="col-span-2 hidden md:flex items-center min-w-0">
               <Badge variant="outline" className="truncate">{resource.category || "General"}</Badge>
            </div>

            {/* Date */}
            <div className="col-span-2 hidden md:flex items-center text-sm text-muted-foreground">
                {new Date(resource.uploadDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>

            {/* Status Icons */}
            <div className="col-span-1 hidden md:flex items-center justify-center gap-3">
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
                     {resource.expiresAt && (
                         <Tooltip>
                             <TooltipTrigger asChild>
                                 <Calendar className="h-4 w-4 text-red-500"/>
                             </TooltipTrigger>
                             <TooltipContent><p>Expira el {new Date(resource.expiresAt).toLocaleDateString()}</p></TooltipContent>
                         </Tooltip>
                     )}
                </TooltipProvider>
            </div>
            
            {/* Actions */}
            <div className="col-span-2 md:col-span-1 text-right">
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
                                        <DropdownMenuItem onClick={()=> onEdit(resource)}>
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
    );
});

ResourceListItem.displayName = 'ResourceListItem';
