// src/components/resources/resource-grid-item.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import type { AppResourceType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { Card } from '@/components/ui/card';
import { DecorativeFolder } from '@/components/resources/decorative-folder';
import { Edit, FolderIcon, MoreVertical, Trash2, Lock, Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Image from 'next/image';
import { getIconForType, getYoutubeVideoId } from '@/lib/resource-utils';
import { FallbackIcon } from './details-sidebar';

// --- Sub-components for Page ---
const ResourceGridItem = React.memo(({ resource, onSelect, onEdit, onDelete, onNavigate }: { resource: AppResourceType, onSelect: () => void, onEdit: (r: AppResourceType) => void, onDelete: (id: string) => void, onNavigate: (r: AppResourceType) => void }) => {
    const { user } = useAuth();
    const canModify = user && (user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && resource.uploaderId === user.id));
    const isFolder = resource.type === 'FOLDER';

    const handleClick = (e: React.MouseEvent) => {
        if (isFolder) {
            onNavigate(resource);
        } else {
            onSelect();
        }
    };
    
    const Thumbnail = () => {
        const isImage = !isFolder && resource.url && /\.(jpe?g|png|gif|webp)$/i.test(resource.url);
        const youtubeId = !isFolder && resource.type === 'VIDEO' ? getYoutubeVideoId(resource.url) : null;
        
        if (isFolder) {
            return (
                <div className="w-full h-full relative">
                    <DecorativeFolder patternId={resource.id} className="absolute inset-0" />
                </div>
            );
        }

        if (isImage) {
           return <Image src={resource.url!} alt={resource.title} fill className="object-cover" data-ai-hint="resource document"/>
        }
        if (youtubeId) {
            return <Image src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`} alt={resource.title} fill className="object-cover" data-ai-hint="video thumbnail"/>
        }
        return <FallbackIcon resource={resource} />;
    };

    return (
        <div className="w-full">
            <Card 
                className={cn("group w-full h-full transition-all duration-200 cursor-pointer bg-card hover:border-primary/50 hover:shadow-lg", isFolder ? "hover:-translate-y-1" : "")}
                onClick={handleClick}
            >
                <div className="aspect-video w-full flex items-center justify-center relative border-b overflow-hidden rounded-t-lg">
                    <Thumbnail />
                     {resource.hasPin && !isFolder && (
                        <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm p-1 rounded-full">
                            <Lock className="h-3 w-3 text-amber-400" />
                        </div>
                    )}
                </div>
                <div className="p-3">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 flex-grow overflow-hidden">
                          {React.createElement(getIconForType(resource.type), { className: "h-4 w-4 shrink-0 text-muted-foreground" })}
                          <p className="font-medium text-sm leading-tight truncate">{resource.title}</p>
                        </div>
                        {canModify && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-2 text-muted-foreground" aria-label={`Opciones para ${resource.title}`}><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    {!isFolder && resource.url && (
                                        <DropdownMenuItem asChild>
                                            <a href={resource.url} target="_blank" rel="noopener noreferrer" download>
                                                <Download className="mr-2 h-4 w-4" /> Descargar
                                            </a>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={()=> onEdit(resource)}>
                                        <Edit className="mr-2 h-4 w-4" /> Editar / Compartir
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onDelete(resource.id)} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 pl-6">
                        {new Date(resource.uploadDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                </div>
            </Card>
        </div>
    );
});
ResourceGridItem.displayName = 'ResourceGridItem';
export { ResourceGridItem };
