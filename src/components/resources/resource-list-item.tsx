// src/components/resources/resource-list-item.tsx
'use client';

import React from 'react';
import type { AppResourceType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { getIconForType } from '@/lib/resource-utils';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Lock, Download, Globe, Users, ExternalLink, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DownloadButton } from '../ui/download-button';
import { Identicon } from '../ui/identicon';

interface ResourceListItemProps {
    resource: AppResourceType;
    onSelect: () => void;
    onEdit: (resource: AppResourceType) => void;
    onDelete: (resource: AppResourceType) => void;
}

const formatFileSize = (bytes: number | null | undefined): string => {
    if (bytes === null || typeof bytes === 'undefined') return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const ResourceListItem = React.memo(({ resource, onSelect, onEdit, onDelete }: ResourceListItemProps) => {
    const { user } = useAuth();
    const canModify = user && (user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && resource.uploaderId === user.id));
    const Icon = getIconForType(resource.type);

    return (
        <div 
            onClick={onSelect} 
            className="flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-muted/50 cursor-pointer"
        >
            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-muted rounded-lg">
                <Icon className="h-6 w-6" />
            </div>

            <div className="flex-grow overflow-hidden">
                <p className="font-semibold truncate">{resource.title}</p>
                <p className="text-sm text-muted-foreground truncate">{resource.description || 'Sin descripción'}</p>
            </div>

            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground w-40 flex-shrink-0">
                <Avatar className="h-6 w-6">
                    {/* Asumimos que el uploader tiene un avatar, si no, un fallback */}
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="text-xs">
                        <Identicon userId={resource.uploaderId || ''} />
                    </AvatarFallback>
                </Avatar>
                <span className="truncate">{resource.uploaderName}</span>
            </div>
            
            <div className="hidden lg:block text-sm text-muted-foreground w-32 flex-shrink-0">
                {new Date(resource.uploadDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
                {resource.hasPin && <Lock className="h-4 w-4 text-amber-500" title="Protegido con PIN" />}
                {resource.ispublic ? <Globe className="h-4 w-4 text-green-500" title="Público" /> : <Users className="h-4 w-4 text-blue-500" title="Privado"/>}
            </div>
            
            {canModify && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Opciones para ${resource.title}`}>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
                        <DropdownMenuItem onClick={() => onEdit(resource)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar / Compartir
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(resource)} className="text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
});

ResourceListItem.displayName = 'ResourceListItem';
