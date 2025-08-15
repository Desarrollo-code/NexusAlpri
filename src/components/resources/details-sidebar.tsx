// src/components/resources/details-sidebar.tsx
'use client';

import type { EnterpriseResource as AppResourceType, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Download, Share2, Edit, Trash2, Tag, Calendar, User, Eye, Lock, Globe, Users as UsersIcon, FolderIcon, Loader2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getInitials } from '@/lib/security-log-utils';
import { DecorativeFolder } from './decorative-folder';
import React, { useState, useEffect } from 'react';
import * as mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import { getYoutubeVideoId, getIconForType } from '@/lib/resource-utils';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DownloadButton } from '@/components/ui/download-button';
import { cn } from '@/lib/utils';
import Link from 'next/link';


const OfficePreviewer = ({ url }: { url: string }) => {
    const [html, setHtml] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadFile = async () => {
            setIsLoading(true);
            setError(null);
            setHtml(null);
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('No se pudo cargar el archivo.');
                const arrayBuffer = await response.arrayBuffer();

                if (url.endsWith('.docx')) {
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    setHtml(result.value);
                } else if (url.endsWith('.xlsx')) {
                    const workbook = xlsx.read(arrayBuffer, { type: 'buffer' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const htmlString = xlsx.utils.sheet_to_html(worksheet);
                    setHtml(`<style>
                        .xlsx-table { border-collapse: collapse; width: 100%; font-size: 12px; }
                        .xlsx-table th, .xlsx-table td { border: 1px solid #ccc; padding: 4px; text-align: left; }
                        .xlsx-table th { background-color: #f2f2f2; }
                    </style>
                    <div class="overflow-x-auto"><table class="xlsx-table">${htmlString}</table></div>`);
                }

            } catch (e) {
                console.error("Error processing Office file:", e);
                setError(e instanceof Error ? e.message : "Error al procesar el archivo.");
            } finally {
                setIsLoading(false);
            }
        };

        loadFile();
    }, [url]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin"/></div>;
    }
    if (error) {
        return <div className="p-4 text-center text-destructive-foreground bg-destructive/80 text-sm"><AlertTriangle className="inline-block h-4 w-4 mr-1"/>{error}</div>
    }
    if (html) {
        return <div className="p-4 bg-white text-black prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return null;
};


const ResourcePreview = ({ resource }: { resource: AppResourceType }) => {
    const isImage = resource.url && /\.(jpe?g|png|gif|webp)$/i.test(resource.url);
    const isPdf = resource.url && resource.url.toLowerCase().endsWith('.pdf');
    const isDocx = resource.url && resource.url.toLowerCase().endsWith('.docx');
    const isXlsx = resource.url && resource.url.toLowerCase().endsWith('.xlsx');
    const isVideoFile = resource.url && /\.(mp4|webm|ogv)$/i.test(resource.url);
    const youtubeId = resource.type === 'VIDEO' ? getYoutubeVideoId(resource.url) : null;
    
    const FallbackIcon = () => {
        const Icon = getIconForType(resource.type);
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/50">
                <Icon className='h-16 w-16'/>
                <span className="mt-2 text-sm">Sin vista previa disponible</span>
            </div>
        );
    };

    if (resource.type === 'FOLDER') {
        return (
            <div className="w-full h-full relative">
                <DecorativeFolder patternId={resource.id} className="absolute inset-0" />
                 <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <FolderIcon className="h-24 w-24 text-white/50" strokeWidth={1} />
                 </div>
            </div>
        );
    }
    
    if (resource.type === 'VIDEO') {
        if (youtubeId) {
            return <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${youtubeId}`} title={`YouTube video: ${resource.title}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
        }
        if (isVideoFile) {
            return <video src={resource.url} controls className="w-full h-full object-contain bg-black" />
        }
    }
    
    if (isImage) {
        return <Image src={resource.url!} alt={resource.title} fill className="object-contain p-2" data-ai-hint="document image" />;
    }
    
    if (isPdf) {
         return <iframe src={resource.url!} className="w-full h-full" title={`PDF Preview: ${resource.title}`}/>;
    }
    
    if (isDocx || isXlsx) {
        return <OfficePreviewer url={resource.url!} />;
    }

    return <FallbackIcon />;
}


export function ResourceDetailsSidebar({ resource, onClose, onEdit, onDelete }: { 
    resource: AppResourceType | null;
    onClose: () => void;
    onEdit: (resource: AppResourceType) => void;
    onDelete: (id: string) => void;
}) {
    const { user } = useAuth();

    if (!resource) {
        return <div className="h-full w-full bg-card" />;
    }

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
                    <div className="aspect-video w-full bg-muted rounded-md mb-4 flex items-center justify-center overflow-hidden border">
                       <ResourcePreview resource={resource} />
                    </div>

                    <div className="flex gap-2 mb-4">
                       {resource.url && resource.type !== 'FOLDER' && (
                           <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                             <Button className="w-full"><Download className="mr-2 h-4 w-4"/> Descargar</Button>
                           </a>
                       )}
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
                            <Badge variant={resource.ispublic ? 'secondary' : 'default'} className="bg-primary/10 text-primary">
                                {resource.ispublic ? 'Público' : 'Privado'}
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
                    
                    {!resource.ispublic && resource.sharedWith && resource.sharedWith.length > 0 && (
                        <div>
                             <h4 className="font-semibold mb-3 flex items-center gap-2"><UsersIcon className="h-4 w-4"/> Compartido Con</h4>
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
