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
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '../ui/tooltip';


interface ResourceListItemProps {
    resource: AppResourceType;
    onSelect: () => void;
    onEdit: (resource: AppResourceType) => void;
    onDelete: (resource: AppResourceType) => void;
}


export const ResourceListItem = React.memo(({ resource, onSelect, onEdit, onDelete }: ResourceListItemProps) => {
    const { user } = useAuth();
    const canModify = user && (user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && resource.uploaderId === user.id));
    const Icon = getIconForType(resource.type);

    return (
        <div className="grid grid-cols-12 gap-4 p-3 transition-colors hover:bg-muted/50 items-center">
            <div 
                className="col-span-6 flex items-center gap-4 cursor-pointer"
                onClick={onSelect}
            >
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-muted rounded-lg">
                    <Icon className="h-5 w-5" />
                </div>
                 <div className="flex-grow overflow-hidden">
                    <p className="font-semibold truncate text-foreground">{resource.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{resource.description || 'Sin descripción'}</p>
                </div>
            </div>

            <div className="col-span-2 hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <Avatar className="h-6 w-6">
                    <AvatarImage src={resource.uploader?.avatar || undefined} />
                    <AvatarFallback className="text-xs"><Identicon userId={resource.uploaderId || ''} /></AvatarFallback>
                </Avatar>
                <span className="truncate">{resource.uploaderName}</span>
            </div>
            
            <div className="col-span-2 hidden lg:block text-sm text-muted-foreground">
                {new Date(resource.uploadDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>

             <div className="col-span-1 hidden md:flex items-center gap-2 text-muted-foreground">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            {resource.ispublic ? <Globe className="h-4 w-4 text-green-500" /> : <Users className="h-4 w-4 text-blue-500"/>}
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
            
            <div className="col-span-full md:col-span-1 text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Opciones para ${resource.title}`}>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                            <DropdownMenuItem onClick={() => onDelete(resource)} className="text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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
