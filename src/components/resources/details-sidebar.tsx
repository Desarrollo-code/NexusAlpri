// src/components/resources/details-sidebar.tsx
'use client';

import type { EnterpriseResource as AppResourceType, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Download, Share2, Edit, Trash2, Tag, Calendar, User, Eye, Lock, Globe, Users } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getInitials } from '@/lib/security-log-utils';

interface ResourceDetailsSidebarProps {
    resource: AppResourceType | null;
    onClose: () => void;
    onEdit: (resource: AppResourceType) => void;
    onDelete: (id: string) => void;
}

const getYoutubeVideoId = (url: string | undefined): string | null => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
            return urlObj.searchParams.get('v');
        } else if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.substring(1);
        }
    } catch (e) {}
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
};

export function ResourceDetailsSidebar({ resource, onClose, onEdit, onDelete }: ResourceDetailsSidebarProps) {
    const { user } = useAuth();

    if (!resource) {
        return <div className="h-full w-full bg-card" />;
    }

    const isImage = resource.url && /\.(jpe?g|png|gif|webp)$/i.test(resource.url);
    const youtubeId = resource.type === 'VIDEO' ? getYoutubeVideoId(resource.url) : null;
    const canModify = user?.role === 'ADMINISTRATOR' || user?.id === resource.uploaderId;

    return (
        <div className="flex flex-col h-full bg-card">
            <header className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold text-lg line-clamp-1">{resource.title}</h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-5 w-5" />
                </Button>
            </header>
            
            <ScrollArea className="flex-1">
                <div className="p-4">
                    <div className="aspect-video w-full bg-muted rounded-md mb-4 flex items-center justify-center overflow-hidden">
                        {isImage ? (
                            <Image src={resource.url!} alt={resource.title} width={300} height={169} className="object-cover" data-ai-hint="document image" />
                        ) : youtubeId ? (
                            <Image src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`} alt={resource.title} width={300} height={169} className="object-cover" data-ai-hint="video thumbnail" />
                        ) : (
                            <Eye className="h-12 w-12 text-muted-foreground" />
                        )}
                    </div>

                    <div className="flex gap-2 mb-4">
                        <Button className="flex-1"><Download className="mr-2 h-4 w-4"/> Descargar</Button>
                        {canModify && 
                            <Button variant="outline" onClick={() => onEdit(resource)}>
                                <Share2 className="mr-2 h-4 w-4"/> Compartir
                            </Button>
                        }
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-4 text-sm">
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex items-center gap-2"><Globe className="h-4 w-4"/> Visibilidad</span>
                            <Badge variant={resource.isPublic ? 'secondary' : 'default'} className="bg-primary/10 text-primary">
                                {resource.isPublic ? 'Público' : 'Privado'}
                            </Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Nombre</span>
                            <span className="font-medium text-right line-clamp-2">{resource.title}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Categoría</span>
                            <Badge variant="secondary">{resource.category}</Badge>
                        </div>
                         <div className="flex justify-between items-start">
                            <span className="text-muted-foreground">Subido por</span>
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="font-medium">{resource.uploaderName}</span>
                            </div>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Fecha</span>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="font-medium">{new Date(resource.uploadDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                        {resource.hasPin && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Seguridad</span>
                                <div className="flex items-center gap-2 text-amber-500">
                                    <Lock className="h-4 w-4" />
                                    <span className="font-medium">Protegido con PIN</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    {!resource.isPublic && resource.sharedWith && resource.sharedWith.length > 0 && (
                        <div>
                             <h4 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4"/> Compartido Con</h4>
                             <div className="flex flex-wrap gap-2">
                                {resource.sharedWith.map(u => (
                                    <div key={u.id} className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full bg-muted text-sm">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={u.avatar || undefined} alt={u.name || undefined} />
                                            <AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback>
                                        </Avatar>
                                        <span>{u.name}</span>
                                    </div>
                                ))}
                             </div>
                            <Separator className="my-4" />
                        </div>
                    )}
                    
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Tag className="h-4 w-4"/> Etiquetas</h4>
                        <div className="flex flex-wrap gap-2">
                            {resource.tags.length > 0 ? (
                                resource.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)
                            ) : (
                                <p className="text-xs text-muted-foreground">Sin etiquetas.</p>
                            )}
                        </div>
                    </div>

                </div>
            </ScrollArea>
            
            {canModify && (
                <footer className="p-4 border-t flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => onEdit(resource)}>
                        <Edit className="mr-2 h-4 w-4"/> Editar
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => onDelete(resource.id)}>
                        <Trash2 className="mr-2 h-4 w-4"/> Eliminar
                    </Button>
                </footer>
            )}
        </div>
    )
}
