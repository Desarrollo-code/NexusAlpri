// src/components/resources/resource-grid-item.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import type { AppResourceType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, MoreVertical, Trash2, Lock, Download, Globe, Users, ArchiveRestore, Pin, FileQuestion, Share2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { FileIcon } from '../ui/file-icon';
import Link from 'next/link';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { IconFolderDynamic } from '../icons/icon-folder-dynamic';
import { IconVideoPlaylist } from '../icons/icon-video-playlist';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Identicon } from '../ui/identicon';
import { Checkbox } from '@/components/ui/checkbox';


// Helper function to format file size
const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes || bytes === 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

// --- Sub-components for Page ---
export const ResourceGridItem = React.memo(({ resource, onSelect, onEdit, onDelete, onNavigate, onRestore, onTogglePin, isSelected, onSelectionChange }: {
    resource: AppResourceType,
    onSelect: () => void,
    onEdit: (r: AppResourceType) => void,
    onDelete: (r: AppResourceType) => void,
    onNavigate: (r: AppResourceType) => void,
    onRestore: (r: AppResourceType) => void,
    onTogglePin: (r: AppResourceType) => void,
    isSelected: boolean,
    onSelectionChange: (id: string, checked: boolean) => void,
}) => {
    const { user } = useAuth();
    const isFolder = resource.type === 'FOLDER';
    const isPlaylist = resource.type === 'VIDEO_PLAYLIST';
    const canManage = user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR';
    const canModify = canManage && (user.role === 'ADMINISTRATOR' || resource.uploaderId === user.id);

    const { attributes, listeners, setNodeRef: setDraggableNodeRef, isDragging } = useDraggable({
        id: resource.id,
        data: { type: 'resource', resource: resource },
        disabled: !canModify || resource.status === 'ARCHIVED',
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
        if (isFolder || isPlaylist) {
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

    const fileExtension = resource.filetype?.split('/')[1] || resource.url?.split('.').pop() || 'file';

    // Calculate if expiring soon (within 7 days)
    const isExpiringSoon = resource.expiresAt && differenceInDays(new Date(resource.expiresAt), new Date()) <= 7 && differenceInDays(new Date(resource.expiresAt), new Date()) >= 0;

    // Determine status badges
    const badges = [];
    if (resource.isPinned) badges.push({ icon: Pin, label: 'Fijado', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' });
    if (resource.hasPin) badges.push({ icon: Lock, label: 'PIN', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' });
    if (resource.quiz) badges.push({ icon: FileQuestion, label: 'Quiz', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' });
    if (resource.sharingMode !== 'PUBLIC') badges.push({ icon: Share2, label: resource.sharingMode === 'PRIVATE' ? 'Privado' : 'Proceso', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' });
    if (isExpiringSoon) badges.push({ icon: Clock, label: 'Expira pronto', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' });

    return (
        <div ref={setNodeRef} {...attributes} className={cn("w-full touch-none", isDragging && 'opacity-50 z-10')}>
            <Card
                className={cn(
                    "group w-full h-full transition-all duration-200 ease-out cursor-pointer relative border flex flex-col",
                    "hover:scale-[1.02] hover:shadow-lg",
                    isOver && "ring-2 ring-primary ring-offset-2",
                    resource.status === 'ARCHIVED' && 'opacity-60 cursor-default',
                    isSelected ? "border-primary shadow-lg" : "border-border/50 hover:border-primary/50"
                )}
                onClick={handleClick}
            >
                <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
                    <div className="flex items-center gap-2 flex-grow min-w-0">
                        {canManage && <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelectionChange(resource.id, !!checked)} onClick={e => e.stopPropagation()} className="ml-1" />}
                        <span className="text-sm font-semibold truncate">{resource.title}</span>
                    </div>
                    {canModify && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground" aria-label={`Opciones para ${resource.title}`} onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                {resource.status === 'ACTIVE' && (
                                    <>
                                        <DropdownMenuItem onSelect={() => onTogglePin(resource)}><Pin className="mr-2 h-4 w-4" />{resource.isPinned ? 'Desfijar' : 'Fijar'}</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEdit(resource)}><Edit className="mr-2 h-4 w-4" /> Editar / Compartir</DropdownMenuItem>
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
                </CardHeader>

                {/* Badges Row */}
                {badges.length > 0 && (
                    <div className="px-3 pb-2 flex flex-wrap gap-1">
                        {badges.map((badge, idx) => (
                            <Badge key={idx} variant="secondary" className={cn("text-xs px-1.5 py-0.5", badge.color)}>
                                <badge.icon className="h-3 w-3 mr-1" />
                                {badge.label}
                            </Badge>
                        ))}
                    </div>
                )}

                <CardContent className="p-0 border-y flex-grow">
                    <div className="aspect-[4/3] w-full flex items-center justify-center relative rounded-none overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10">
                        <FileIcon displayMode="grid" type={isFolder ? 'FOLDER' : isPlaylist ? 'VIDEO_PLAYLIST' : fileExtension} thumbnailUrl={resource.url} resourceId={resource.id} />
                    </div>
                </CardContent>

                {/* Enhanced Footer with Metadata */}
                <CardFooter className="p-3 pt-2 flex flex-col gap-2">
                    <div className="flex items-center gap-2 w-full">
                        <Avatar className="h-5 w-5">
                            <AvatarImage src={resource.uploader?.avatar || undefined} />
                            <AvatarFallback className="text-[10px]"><Identicon userId={resource.uploaderId || ''} /></AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-normal text-muted-foreground/70 truncate flex-grow">{resource.uploaderName}</span>
                    </div>
                    <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                        <span title={format(new Date(resource.uploadDate), "PPP", { locale: es })}>
                            {formatDistanceToNow(new Date(resource.uploadDate), { addSuffix: true, locale: es })}
                        </span>
                        {resource.size && resource.size > 0 && (
                            <span className="font-medium">{formatFileSize(resource.size)}</span>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
});
ResourceGridItem.displayName = 'ResourceGridItem';