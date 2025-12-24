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
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { FileIcon } from '@/components/ui/file-icon';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDraggable, useDroppable } from '@dnd-kit/core';

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
    onEdit: (resource: AppResourceType) => void,
    onDelete: (resource: AppResourceType) => void,
    onNavigate: (resource: AppResourceType) => void,
    onRestore: (resource: AppResourceType) => void,
    onTogglePin: (resource: AppResourceType) => void,
    isSelected: boolean,
    onSelectionChange: (id: string, checked: boolean) => void
}) => {
    const { user } = useAuth();
    const canManage = user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR';
    const canModify = canManage && (user?.role === 'ADMINISTRATOR' || resource.uploaderId === user?.id);

    const isFolder = resource.type === 'FOLDER';
    const isPlaylist = resource.type === 'VIDEO_PLAYLIST';
    const fileExtension = resource.filetype?.split('/')[1] || resource.url?.split('.').pop() || 'file';

    // Draggable setup
    const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
        id: resource.id,
        data: { resource },
        disabled: resource.status !== 'ACTIVE',
    });

    // Droppable setup (for folders)
    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: `drop-${resource.id}`,
        data: { folderId: resource.id },
        disabled: !isFolder,
    });

    const setNodeRef = (node: HTMLElement | null) => {
        setDraggableRef(node);
        setDroppableRef(node);
    };

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

    // Calculate if expiring soon (within 7 days)
    const isExpiringSoon = resource.expiresAt && new Date(resource.expiresAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const badges: Array<{ icon: any, label: string, color: string }> = [];
    if (resource.isPinned) badges.push({ icon: Pin, label: 'Fijado', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' });
    if ((resource as any).pinProtected) badges.push({ icon: Lock, label: 'PIN', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' });
    if (resource.quiz) badges.push({ icon: FileQuestion, label: 'Quiz', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' });
    if (resource.sharingMode !== 'PUBLIC') badges.push({ icon: Share2, label: resource.sharingMode === 'PRIVATE' ? 'Privado' : 'Proceso', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' });
    if (isExpiringSoon) badges.push({ icon: Clock, label: 'Expira pronto', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' });

    // Add file type badge for non-folders
    if (!isFolder && !isPlaylist && fileExtension) {
        const typeLabel = fileExtension.toUpperCase();
        badges.push({ icon: FileText, label: typeLabel, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' });
    }

    return (
        <div ref={setNodeRef} {...attributes} {...listeners} className={cn("w-full touch-none", isDragging && 'opacity-50 z-10')}>
            <Card
                className={cn(
                    "group w-full h-full transition-all duration-200 ease-out cursor-pointer relative border flex flex-col overflow-hidden",
                    "hover:scale-[1.02] hover:shadow-xl",
                    isOver && "ring-2 ring-primary ring-offset-2",
                    resource.status === 'ARCHIVED' && 'opacity-60 cursor-default',
                    isSelected ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border/50 hover:border-primary/50"
                )}
                onClick={handleClick}
            >
                {/* Thumbnail Section with Overlay Controls */}
                <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden">
                    {/* Checkbox - Top Left */}
                    {canManage && (
                        <div className="absolute top-2 left-2 z-10">
                            <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => onSelectionChange(resource.id, !!checked)}
                                onClick={e => e.stopPropagation()}
                                className="bg-background/80 backdrop-blur-sm border-2"
                            />
                        </div>
                    )}

                    {/* Action Buttons - Top Right */}
                    {canModify && (
                        <div className="absolute top-2 right-2 z-10 flex gap-1.5">
                            {resource.status === 'ACTIVE' && (
                                <>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-background shadow-md"
                                        onClick={(e) => { e.stopPropagation(); onTogglePin(resource); }}
                                        title={resource.isPinned ? 'Desfijar' : 'Fijar'}
                                    >
                                        <Pin className={cn("h-4 w-4", resource.isPinned && "fill-current text-primary")} />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-background shadow-md"
                                        onClick={(e) => { e.stopPropagation(); onEdit(resource); }}
                                        title="Editar"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-background shadow-md"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    {resource.status === 'ARCHIVED' ? (
                                        <DropdownMenuItem onClick={() => onRestore(resource)}>
                                            <ArchiveRestore className="mr-2 h-4 w-4" /> Restaurar
                                        </DropdownMenuItem>
                                    ) : (
                                        <>
                                            {!isFolder && !isPlaylist && (
                                                <DropdownMenuItem onClick={() => onSelect()}>
                                                    <Eye className="mr-2 h-4 w-4" /> Ver
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    <DropdownMenuItem onClick={() => onDelete(resource)} className="text-destructive focus:bg-destructive/10">
                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}

                    {/* Thumbnail/Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <FileIcon
                            displayMode="grid"
                            type={isFolder ? 'FOLDER' : isPlaylist ? 'VIDEO_PLAYLIST' : fileExtension}
                            thumbnailUrl={resource.url}
                            resourceId={resource.id}
                        />
                    </div>

                    {/* Video Duration Overlay - Bottom Right */}
                    {resource.type === 'VIDEO' && (resource as any).duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-semibold text-white">
                            {formatDuration((resource as any).duration)}
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex flex-col flex-grow p-4 gap-3">
                    {/* Title */}
                    <h4 className="text-lg font-bold leading-tight line-clamp-2 text-foreground">
                        {resource.title}
                    </h4>

                    {/* Badges */}
                    {badges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {badges.map((badge, idx) => (
                                <Badge key={idx} variant="secondary" className={cn("text-[11px] px-2 py-0 h-5.5", badge.color)}>
                                    <badge.icon className="h-3 w-3 mr-1" />
                                    {badge.label}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Footer Metadata */}
                    <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-border/30">
                        <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border border-border/50">
                                <AvatarImage src={resource.uploader?.avatar || undefined} alt={resource.uploaderName} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                    {resource.uploaderName?.substring(0, 2).toUpperCase() || '??'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold text-foreground/90 truncate">
                                {resource.uploaderName}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
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
                                <span className="font-semibold text-foreground/70">
                                    {formatFileSize(resource.size)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
});
ResourceGridItem.displayName = 'ResourceGridItem';