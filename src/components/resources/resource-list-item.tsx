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
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../ui/card';
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
    const isMobile = useIsMobile();
    const canModify = user && (user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && resource.uploaderId === user.id));
    
    const youtubeId = getYoutubeVideoId(resource.url);
    const fileExtension = youtubeId ? 'youtube' : (resource.fileType?.split('/')[1] || resource.url?.split('.').pop() || 'file');

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: resource.id,
        data: { type: 'resource', resource: resource },
        disabled: !canModify || resource.status === 'ARCHIVED',
    });

    const handleAction = (e: React.MouseEvent | Event, action: () => void) => {
        e.stopPropagation();
        action();
    }
    
     if (isMobile) {
        return (
            <div className="w-full flex justify-center">
                <Card onClick={onSelect} className="w-full max-w-md flex flex-col shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-4 p-3 relative">
                        <FileIcon displayMode="list" type={fileExtension} thumbnailUrl={youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null} />
                        <div className="flex-grow min-w-0">
                           <p className="font-semibold truncate text-foreground">{resource.title}</p>
                           <p className="text-xs text-muted-foreground">{resource.description || 'Sin descripción'}</p>
                        </div>
                        {canModify && (
                            <div className="absolute top-1 right-1">
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4"/></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                                        <DropdownMenuItem onSelect={(e) => handleAction(e, () => onEdit(resource))}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={(e) => handleAction(e, () => onDelete(resource))} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="px-3 pb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/> <span>{resource.uploaderName}</span></div>
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground"/> <span>{new Date(resource.uploadDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span></div>
                        <div className="flex items-center gap-2"><Tag className="h-4 w-4 text-muted-foreground"/> <Badge variant="outline">{resource.category}</Badge></div>
                        <div className="flex items-center gap-2">{resource.ispublic ? <><Globe className="h-4 w-4 text-green-500"/><span>Público</span></> : <><Users className="h-4 w-4 text-blue-500"/><span>Compartido</span></>}</div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <TableRow ref={setNodeRef} onClick={onSelect} className={cn("cursor-pointer", isDragging && 'opacity-50')}>
             <TableCell className="w-[40%]">
                <div className="flex items-center gap-4">
                    <div {...listeners} {...attributes} className="p-1 cursor-grab touch-none">
                        <Grip className="h-4 w-4 text-muted-foreground/50"/>
                    </div>
                    <FileIcon displayMode="list" type={fileExtension} thumbnailUrl={youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null} />
                    <div className="min-w-0">
                        <p className="font-semibold truncate text-foreground">{resource.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{resource.description || 'Sin descripción'}</p>
                    </div>
                </div>
            </TableCell>
            <TableCell className="w-[15%] hidden md:table-cell">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-6 w-6"><AvatarImage src={resource.uploader?.avatar || undefined} /><AvatarFallback className="text-xs"><Identicon userId={resource.uploaderId || ''} /></AvatarFallback></Avatar>
                    <span className="truncate">{resource.uploaderName}</span>
                </div>
            </TableCell>
            <TableCell className="w-[15%] hidden lg:table-cell">
                <Badge variant="outline">{resource.category}</Badge>
            </TableCell>
            <TableCell className="w-[15%] hidden lg:table-cell text-sm text-muted-foreground">
                {new Date(resource.uploadDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
            </TableCell>
             <TableCell className="w-[10%] hidden md:table-cell">
                <div className="flex items-center justify-start gap-2">
                    {resource.ispublic ? (
                        <TooltipProvider><Tooltip><TooltipTrigger><Globe className="h-4 w-4 text-green-500"/></TooltipTrigger><TooltipContent><p>Público</p></TooltipContent></Tooltip></TooltipProvider>
                    ) : (
                        <TooltipProvider><Tooltip><TooltipTrigger><Users className="h-4 w-4 text-blue-500"/></TooltipTrigger><TooltipContent><p>Compartido ({resource.sharedWith?.length || 0})</p></TooltipContent></Tooltip></TooltipProvider>
                    )}
                     {resource.hasPin && (
                        <TooltipProvider><Tooltip><TooltipTrigger><Lock className="h-4 w-4 text-amber-500"/></TooltipTrigger><TooltipContent><p>Protegido con PIN</p></TooltipContent></Tooltip></TooltipProvider>
                    )}
                </div>
             </TableCell>
            <TableCell className="w-[5%] text-right">
                <div className="flex items-center justify-end">
                    {canModify && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                                 {resource.status === 'ACTIVE' ? (
                                    <>
                                      <DropdownMenuItem onSelect={(e) => handleAction(e, () => onEdit(resource))}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onSelect={(e) => handleAction(e, () => onDelete(resource))} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Eliminar</DropdownMenuItem>
                                    </>
                                 ) : (
                                    <DropdownMenuItem onSelect={(e) => handleAction(e, () => onRestore(resource))}><ArchiveRestore className="mr-2 h-4 w-4"/>Restaurar</DropdownMenuItem>
                                 )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
});

ResourceListItem.displayName = 'ResourceListItem';
