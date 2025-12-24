// src/components/resources/resource-grid-item.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import type { AppResourceType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, MoreVertical, Trash2, Lock, Download, Globe, Users, ArchiveRestore, Pin, FileQuestion, Share2, Clock, Eye, MoreHorizontal, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

// Helper function to format video duration
const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds || seconds === 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins >= 60) {
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        const target = e.target as HTMLElement;
        if (target instanceof HTMLButtonElement || target instanceof HTMLInputElement || target.closest('button, a, input[type="checkbox"]')) {
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
    const isExpiringSoon = resource.expiresAt && new Date(resource.expiresAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const badges: Array<{ icon: any, label: string, color: string }> = [];
    if (resource.isPinned) badges.push({ icon: Pin, label: 'Fijado', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' });
    if (resource.pinProtected) badges.push({ icon: Lock, label: 'PIN', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' });
    if (resource.quiz) badges.push({ icon: FileQuestion, label: 'Quiz', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' });
    if (resource.sharingMode !== 'PUBLIC') badges.push({ icon: Share2, label: resource.sharingMode === 'PRIVATE' ? 'Privado' : 'Proceso', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' });
    if (isExpiringSoon) badges.push({ icon: Clock, label: 'Expira pronto', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' });

    // Add file type badge for non-folders
    if (!isFolder && !isPlaylist && fileExtension) {
        const typeLabel = fileExtension.toUpperCase();
        badges.push({ icon: FileText, label: typeLabel, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' });
    }

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
                <CardHeader className="flex flex-col gap-2 p-3 pb-2 border-b border-border/40">
                    <div className="flex items-start justify-between gap-2">
                        {canManage && <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelectionChange(resource.id, !!checked)} onClick={e => e.stopPropagation()} className="mt-0.5" />}
                        <div className="flex-grow min-w-0">
                            <h4 className="text-base font-bold leading-tight line-clamp-2 min-h-[2.5rem] flex-grow text-foreground">
                                {resource.title}
                            </h4>
                        </div>
                        {canModify && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground" aria-label={`Opciones para ${resource.title}`} onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button>
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
                    </div>
                </CardHeader>

                {/* Badges Row */}
                {badges.length > 0 && (
                    <div className="px-3 pt-2 pb-2 flex flex-wrap gap-1 bg-muted/20">
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

                        {/* Video Duration Overlay */}
                        {resource.type === 'VIDEO' && resource.duration && (
                            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-semibold text-white">
                                {formatDuration(resource.duration)}
                            </div>
                        )}
                    </div>
                </CardContent>

                {/* Enhanced Footer with Metadata */}
                <CardFooter className="p-3 pt-3 flex flex-col gap-2.5 border-t border-border/40 bg-muted/10">
                    <div className="flex items-center gap-2 w-full">
                        <Avatar className="h-5 w-5">
                            <AvatarImage src={resource.uploader?.avatar || undefined} />
                            <AvatarFallback className="text-[10px]"><Identicon userId={resource.uploaderId || ''} /></AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-normal text-muted-foreground truncate flex-grow">{resource.uploaderName}</span>
                    </div>
                    <div className="flex items-center justify-between w-full text-xs">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="cursor-help text-muted-foreground/90 font-medium">
                                        {formatDistanceToNow(new Date(resource.uploadDate), { addSuffix: true, locale: es })}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs font-medium">
                                        {format(new Date(resource.uploadDate), "PPP 'a las' p", { locale: es })}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {resource.size && resource.size > 0 && (
                            <span className="font-semibold text-foreground/80">{formatFileSize(resource.size)}</span>
                        )}
                    </div>
                </CardFooter>

                {/* Quick Actions on Hover */}
                {resource.status === 'ACTIVE' && (
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-background via-background/95 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                        <div className="flex items-center justify-center gap-2">
                            {!isFolder && !isPlaylist && (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 gap-1.5 shadow-md"
                                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    Ver
                                </Button>
                            )}

                            {canModify && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 gap-1.5 shadow-md"
                                        onClick={(e) => { e.stopPropagation(); onEdit(resource); }}
                                    >
                                        <Edit className="h-3.5 w-3.5" />
                                        Editar
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 w-8 p-0 shadow-md"
                                        onClick={(e) => { e.stopPropagation(); onTogglePin(resource); }}
                                        title={resource.isPinned ? 'Desfijar' : 'Fijar'}
                                    >
                                        <Pin className={cn("h-3.5 w-3.5", resource.isPinned && "fill-current")} />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
});
ResourceGridItem.displayName = 'ResourceGridItem';