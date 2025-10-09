
// src/components/resources/resource-preview-modal.tsx
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from '@/components/ui/dialog';
import type { EnterpriseResource as AppResourceType } from '@/types';
import { Button } from '@/components/ui/button';
import { Download, Share2, ChevronLeft, ChevronRight, Lock, Loader2, AlertTriangle, Info, User, Calendar, Tag, Globe, Users, ExternalLink, FileText, Archive, FileCode, List, X, ArrowUpRightSquare, ZoomIn, ZoomOut, Expand } from 'lucide-react';
import { getIconForType, getYoutubeVideoId, FallbackIcon } from '@/lib/resource-utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { DownloadButton } from '../ui/download-button';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import JSZip from 'jszip';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { getInitials } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { addXp, XP_CONFIG, checkFirstDownload } from '@/lib/gamification';
import mammoth from 'mammoth';
import { PdfViewer } from '@/components/pdf-viewer'; 

const DocxPreviewer = ({ url }: { url: string }) => {
    const [html, setHtml] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDocx = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('No se pudo cargar la previsualización del documento.');
                const arrayBuffer = await response.arrayBuffer();
                const { value: htmlContent } = await mammoth.convertToHtml({ arrayBuffer });
                setHtml(htmlContent);
            } catch (e) {
                console.error("Error procesando DOCX:", e);
                setError(e instanceof Error ? e.message : "No se pudo previsualizar este archivo Word.");
            } finally {
                setIsLoading(false);
            }
        };
        loadDocx();
    }, [url]);

    if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin"/></div>;
    if (error) return <div className="p-4 text-center text-destructive-foreground bg-destructive/80 text-sm"><AlertTriangle className="inline-block h-4 w-4 mr-1"/>{error}</div>;
    return <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-background h-full overflow-auto" dangerouslySetInnerHTML={{ __html: html || '' }} />;
};

const ZipPreviewer = ({ url }: { url: string }) => {
    const [files, setFiles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const loadZip = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('No se pudo cargar el archivo ZIP.');
                const blob = await response.blob();
                const zip = await JSZip.loadAsync(blob);
                const fileList = Object.keys(zip.files).filter(fileName => !zip.files[fileName].dir);
                setFiles(fileList);
            } catch(e) {
                setError("No se pudo leer el contenido del archivo ZIP.");
            } finally {
                setIsLoading(false);
            }
        };
        loadZip();
    }, [url]);

    if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin"/></div>;
    if (error) return <div className="p-4 text-center text-destructive-foreground bg-destructive/80 text-sm"><AlertTriangle className="inline-block h-4 w-4 mr-1"/>{error}</div>;
    
    return (
        <div className="flex flex-col h-full bg-muted/30">
            <div className="p-4 border-b bg-background/70">
                <h4 className="font-semibold flex items-center gap-2"><Archive className="h-5 w-5 text-primary"/>Contenido del Archivo ZIP</h4>
            </div>
            <ScrollArea className="flex-grow">
                <ul className="p-4 text-sm">
                    {files.map(file => (
                        <li key={file} className="flex items-center gap-2 py-1.5 border-b border-border/50">
                            <FileText className="h-4 w-4 text-muted-foreground"/>
                            {file}
                        </li>
                    ))}
                </ul>
            </ScrollArea>
        </div>
    );
};


const FallbackPreview = ({ resource }: { resource: AppResourceType }) => {
    const isExternalLink = resource.type === 'EXTERNAL_LINK';
    const { user } = useAuth();
    
    const onDownload = () => {
        if(user) {
            addXp(user.id, XP_CONFIG.DOWNLOAD_RESOURCE || 1);
            checkFirstDownload(user.id);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/50 p-8 text-center">
            <FallbackIcon resource={resource} />
            <h3 className="text-xl font-semibold text-foreground mt-4">{resource.title}</h3>
            <p className="text-sm mt-2 max-w-sm">
                {isExternalLink 
                    ? "Este es un enlace a un recurso externo. Haz clic en el botón para visitarlo."
                    : "No hay una vista previa disponible para este tipo de archivo, pero puedes descargarlo."
                }
            </p>
             <div className="mt-6">
                {isExternalLink ? (
                    <Button asChild>
                        <a href={resource.url!} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Visitar Enlace
                        </a>
                    </Button>
                ) : (
                     <DownloadButton 
                        url={resource.url!}
                        resourceId={resource.id}
                        hasPin={resource.hasPin}
                        onDownloadSuccess={onDownload}
                    />
                )}
            </div>
        </div>
    );
};

const ContentPreview = ({ resource, pinVerifiedUrl, onPinVerified }: { resource: AppResourceType; pinVerifiedUrl: string | null; onPinVerified: (url: string) => void; }) => {
    const { toast } = useToast();
    const [pin, setPin] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
   
    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setError(null);
        try {
            const response = await fetch(`/api/resources/${resource.id}/verify-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al verificar');
            toast({ title: "Acceso Concedido" });
            onPinVerified(data.url);

            if(user) {
                addXp(user.id, XP_CONFIG.DOWNLOAD_RESOURCE || 1);
                checkFirstDownload(user.id);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'PIN incorrecto.');
        } finally {
            setIsVerifying(false);
        }
    };
    
    useEffect(() => {
        setPin('');
        setError(null);
    }, [resource]);
    
    if (resource.hasPin && !pinVerifiedUrl) {
       return (
         <div className="flex flex-col items-center justify-center h-full p-4 bg-muted/30">
            <Lock className="h-16 w-16 text-amber-500 mb-4"/>
            <h4 className="font-semibold text-xl text-center">Recurso Protegido</h4>
            <p className="text-sm text-muted-foreground text-center mb-6">Ingresa el PIN de 4-8 dígitos para acceder.</p>
            <form onSubmit={handlePinSubmit} className="flex flex-col items-center gap-2 w-full max-w-xs">
                <Input 
                    type="password" 
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="****"
                    disabled={isVerifying}
                    className="text-center text-lg h-12"
                    maxLength={8}
                />
                <Button type="submit" disabled={isVerifying || !pin} className="w-full">
                    {isVerifying ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Desbloquear'}
                </Button>
            </form>
            {error && <p className="text-xs text-destructive mt-2">{error}</p>}
         </div>
       );
    }
    
    const displayUrl = pinVerifiedUrl || resource.url;
    
    if (displayUrl) {
        if (displayUrl.toLowerCase().endsWith('.pdf')) {
            return <PdfViewer url={displayUrl} />;
        }
        
        const youtubeId = getYoutubeVideoId(displayUrl);
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(displayUrl);
        const isVideoFile = /\.(mp4|webm|ogv)$/i.test(displayUrl);
        const isOfficeDoc = displayUrl.toLowerCase().endsWith('.docx');
        const isZipFile = displayUrl.toLowerCase().endsWith('.zip');

        if (youtubeId) return <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${youtubeId}`} title={`YouTube video: ${resource.title}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>;
        if (isVideoFile) return <video src={displayUrl} controls className="w-full h-full object-contain bg-black" />;
        if (isImage) return <div className="relative w-full h-full p-2"><Image src={displayUrl} alt={resource.title} fill className="object-contain" data-ai-hint="document image" /></div>;
        if (isOfficeDoc) return <DocxPreviewer url={displayUrl} />;
        if (isZipFile) return <ZipPreviewer url={displayUrl} />;
    }

    return <FallbackPreview resource={resource} />;
}


const ResourceDetailsContent = ({ resource }: { resource: AppResourceType }) => (
    <div className="space-y-6 text-sm">
        <div>
            <h4 className="font-medium text-muted-foreground mb-1">Título</h4>
            <p className="font-semibold text-base">{resource.title}</p>
        </div>
        {resource.description && (
             <div>
                <h4 className="font-medium text-muted-foreground mb-1">Descripción</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{resource.description}</p>
            </div>
        )}
         <div>
            <h4 className="font-medium text-muted-foreground mb-2">Información</h4>
            <div className="space-y-2">
                <div className="flex items-center gap-2"><User className="h-4 w-4 shrink-0"/><span>Subido por: <strong>{resource.uploaderName}</strong></span></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 shrink-0"/><span>Fecha: <strong>{new Date(resource.uploadDate).toLocaleDateString()}</strong></span></div>
                <div className="flex items-center gap-2"><Tag className="h-4 w-4 shrink-0"/><span>Categoría: <Badge variant="secondary">{resource.category}</Badge></span></div>
            </div>
         </div>
         <Separator/>
         <div>
            <h4 className="font-medium text-muted-foreground mb-2">Permisos</h4>
             <div className="flex items-center gap-2">
                {resource.ispublic ? <Globe className="h-4 w-4 text-green-500 shrink-0"/> : <Users className="h-4 w-4 text-blue-500 shrink-0"/>}
                <span>{resource.ispublic ? 'Acceso Público' : 'Compartido con usuarios específicos'}</span>
            </div>
            {!resource.ispublic && resource.sharedWith && resource.sharedWith.length > 0 && (
                <div className="mt-2 space-y-2 pl-6">
                    {resource.sharedWith.map(user => (
                        <div key={user.id} className="flex items-center gap-2">
                            <Avatar className="h-6 w-6"><AvatarImage src={user.avatar || undefined} /><AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback></Avatar>
                            <span>{user.name}</span>
                        </div>
                    ))}
                </div>
            )}
         </div>
    </div>
);


interface ResourcePreviewModalProps {
    resource: AppResourceType | null;
    onClose: () => void;
    onNavigate: (direction: 'next' | 'prev') => void;
}

export const ResourcePreviewModal: React.FC<ResourcePreviewModalProps> = ({ resource, onClose, onNavigate }) => {
    const [pinVerifiedUrl, setPinVerifiedUrl] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const isMobile = useIsMobile();
    const { user } = useAuth();

    useEffect(() => {
        setPinVerifiedUrl(null);
        setShowDetails(false); 
    }, [resource]);
    
    if (!resource) return null;
    
    const onDownload = () => {
        if(user) {
            addXp(user.id, XP_CONFIG.DOWNLOAD_RESOURCE || 1);
            checkFirstDownload(user.id);
        }
    }


    const DetailsComponent = () => (
        <div className="w-full sm:w-80 flex-shrink-0 border-l bg-background/50 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Detalles del Recurso</h3>
            </div>
            <ScrollArea className="flex-grow p-4">
                <ResourceDetailsContent resource={resource} />
            </ScrollArea>
        </div>
    );
    
    return (
      <Dialog open={!!resource} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="w-[95vw] h-[90vh] max-w-6xl p-0 flex flex-col bg-background/80 backdrop-blur-lg gap-0">
          <DialogHeader className="p-4 flex-shrink-0 h-16 px-4 flex flex-row justify-between items-center border-b z-10 bg-background/70">
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              {React.createElement(getIconForType(resource.type), { className: "h-5 w-5 shrink-0" })}
              <DialogTitle className="font-semibold truncate text-foreground">{resource.title}</DialogTitle>
            </div>
            <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="h-4 w-4"/>
                </Button>
            </DialogClose>
          </DialogHeader>
          <div className="flex-grow flex relative overflow-hidden">
            <div className="flex-grow flex-1 relative">
              <Button variant="ghost" size="icon" onClick={() => onNavigate('prev')} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 bg-background/50 hover:bg-background/80"><ChevronLeft/></Button>
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                  <ContentPreview resource={resource} pinVerifiedUrl={pinVerifiedUrl} onPinVerified={setPinVerifiedUrl} />
              </div>
              <Button variant="ghost" size="icon" onClick={() => onNavigate('next')} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 bg-background/50 hover:bg-background/80"><ChevronRight/></Button>
            </div>
            {!isMobile && showDetails && <DetailsComponent />}
          </div>
          <DialogFooter className="p-2 border-t flex-shrink-0 bg-background/70 justify-between">
            <div className="flex items-center gap-2">
              {isMobile ? (
                <Sheet open={showDetails} onOpenChange={setShowDetails}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm"><Info className="h-4 w-4" /></Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[60vh] flex flex-col p-0">
                      <SheetHeader className="p-4 border-b flex flex-row items-center justify-between">
                          <SheetTitle>Detalles del Recurso</SheetTitle>
                           <DialogClose asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><X className="h-4 w-4"/></Button>
                           </DialogClose>
                      </SheetHeader>
                      <ScrollArea className="flex-grow p-4">
                        <ResourceDetailsContent resource={resource} />
                      </ScrollArea>
                  </SheetContent>
                </Sheet>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
                  <Info className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">{showDetails ? 'Ocultar Detalles' : 'Ver Detalles'}</span>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
                <DownloadButton url={resource.url} resourceId={resource.id} hasPin={resource.hasPin} onDownloadSuccess={onDownload} variant="default" size="sm" />
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
};
