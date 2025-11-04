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
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardHeader, CardContent } from '../ui/card';

interface ResourceListItemProps {
    resource: AppResourceType;
    onSelect: () => void;
    onEdit: (resource: AppResourceType) => void;
    onDelete: (resource: AppResourceType) => void;
    onRestore: (resource: AppResourceType) => void;
}


export const ResourceListItem = React.memo(({ resource, onSelect, onEdit, onDelete, onRestore }: ResourceListItemProps) => {
    const { user } = useAuth();
    const isMobile = useIsMobile();
    const canModify = user && (user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && resource.uploaderId === user.id));
    
    const youtubeId = getYoutubeVideoId(resource.url);
    const fileExtension = youtubeId ? 'youtube' : (resource.fileType?.split('/')[1] || resource.url?.split('.').pop() || 'file');

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: resource.id,
        data: { type: 'resource', resource: resource },
        disabled: !canModify || resource.status === 'ARCHIVED',
    });

    const handleAction = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    }
    
    const content = (
         <div 
            onClick={onSelect} 
            ref={setNodeRef}
            className={cn(
                "flex items-center gap-4 p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors touch-none",
                isDragging && 'opacity-50'
            )}
        >
            <div {...listeners} {...attributes} className="p-1 cursor-grab text-muted-foreground" onMouseDown={(e) => e.stopPropagation()}>
                <FileIcon displayMode="list" type={fileExtension} thumbnailUrl={youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null} />
            </div>

            <div className="flex-grow min-w-0">
                <p className="font-semibold truncate text-foreground text-sm">{resource.title}</p>
            </div>
            
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                <Avatar className="h-6 w-6"><AvatarImage src={resource.uploader?.avatar || undefined} /><AvatarFallback className="text-xs"><Identicon userId={resource.uploaderId || ''} /></AvatarFallback></Avatar>
                <span className="truncate">{resource.uploaderName}</span>
            </div>

            <div className="hidden lg:flex items-center text-sm text-muted-foreground">
                 {new Date(resource.uploadDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>

            <div className="hidden sm:flex items-center text-sm text-muted-foreground">
                {formatFileSize(resource.size)}
            </div>

            <div className="flex items-center justify-end gap-2 ml-auto">
                <div className="flex items-center gap-3 text-muted-foreground">
                    {resource.ispublic ? (
                        <TooltipProvider><Tooltip><TooltipTrigger><Globe className="h-4 w-4 text-green-500"/></TooltipTrigger><TooltipContent><p>Público</p></TooltipContent></Tooltip></TooltipProvider>
                    ) : (
                        <TooltipProvider><Tooltip><TooltipTrigger><Users className="h-4 w-4 text-blue-500"/></TooltipTrigger><TooltipContent><p>Compartido</p></TooltipContent></Tooltip></TooltipProvider>
                    )}
                    {resource.hasPin && <TooltipProvider><Tooltip><TooltipTrigger><Lock className="h-4 w-4 text-amber-500"/></TooltipTrigger><TooltipContent><p>Protegido con PIN</p></TooltipContent></Tooltip></TooltipProvider>}
                </div>
                {canModify && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={(e) => handleAction(e, () => onEdit(resource))}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => handleAction(e, () => onDelete(resource))} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
    
    return content;
});

ResourceListItem.displayName = 'ResourceListItem';
