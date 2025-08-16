// src/components/resources/resource-preview-modal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { EnterpriseResource as AppResourceType } from '@/types';
import { Button } from '@/components/ui/button';
import { Download, Share2, ChevronLeft, ChevronRight, X, Lock, Loader2, AlertTriangle, Info } from 'lucide-react';
import { getIconForType, getYoutubeVideoId, FallbackIcon } from '@/lib/resource-utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { DownloadButton } from '../ui/download-button';


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
                if (!response.ok) throw new Error('No se pudo cargar el archivo para la previsualización.');
                const arrayBuffer = await response.arrayBuffer();

                // This logic requires mammoth and xlsx, ensure they are in package.json if used
                if (url.endsWith('.docx')) {
                    // mammoth would be needed here
                } else if (url.endsWith('.xlsx')) {
                    // xlsx would be needed here
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
    return <div className="p-4 text-center text-muted-foreground bg-muted/30 text-sm">La previsualización para este tipo de archivo no está disponible.</div>;
};


const FallbackPreview = ({ resource }: { resource: AppResourceType }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/50 p-8">
            <FallbackIcon resource={resource} />
            <h3 className="text-xl font-semibold text-foreground mt-4">{resource.title}</h3>
            <p className="text-sm mt-2">No hay una vista previa disponible para este tipo de archivo.</p>
            <DownloadButton 
                url={resource.url!}
                resourceId={resource.id}
                hasPin={resource.hasPin}
                className="mt-6"
            />
        </div>
    );
};

const ContentPreview = ({ resource, pinVerifiedUrl, onPinVerified }: { resource: AppResourceType; pinVerifiedUrl: string | null; onPinVerified: (url: string) => void; }) => {
    const { toast } = useToast();
    const [pin, setPin] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'PIN incorrecto.');
        } finally {
            setIsVerifying(false);
        }
    };
    
    useEffect(() => {
        // Reset PIN state when resource changes
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
    const isImage = displayUrl && /\.(jpe?g|png|gif|webp)$/i.test(displayUrl);
    const isPdf = displayUrl && displayUrl.toLowerCase().endsWith('.pdf');
    const isDocx = displayUrl && displayUrl.toLowerCase().endsWith('.docx');
    const isXlsx = displayUrl && displayUrl.toLowerCase().endsWith('.xlsx');
    const isVideoFile = displayUrl && /\.(mp4|webm|ogv)$/i.test(displayUrl);
    const youtubeId = resource.type === 'VIDEO' ? getYoutubeVideoId(displayUrl) : null;
    
    if (youtubeId) {
        return <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${youtubeId}`} title={`YouTube video: ${resource.title}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
    }
    if (isVideoFile && displayUrl) {
        return <video src={displayUrl} controls className="w-full h-full object-contain bg-black" />
    }
    if (isImage && displayUrl) {
        return <Image src={displayUrl} alt={resource.title} fill className="object-contain" data-ai-hint="document image" />;
    }
    if (isPdf && displayUrl) {
         return <iframe src={displayUrl} className="w-full h-full" title={`PDF Preview: ${resource.title}`}/>;
    }
    if ((isDocx || isXlsx) && displayUrl) {
        return <OfficePreviewer url={displayUrl} />;
    }

    return <FallbackPreview resource={resource} />;
}

interface ResourcePreviewModalProps {
    resource: AppResourceType | null;
    onClose: () => void;
    onNavigate: (direction: 'next' | 'prev') => void;
}

export const ResourcePreviewModal: React.FC<ResourcePreviewModalProps> = ({ resource, onClose, onNavigate }) => {
    const [pinVerifiedUrl, setPinVerifiedUrl] = useState<string | null>(null);

    useEffect(() => {
        // Reset PIN verification when resource changes
        setPinVerifiedUrl(null);
    }, [resource]);
    
    if (!resource) return null;
    
    return (
        <Dialog open={!!resource} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="w-[95vw] h-[90vh] max-w-6xl p-0 flex flex-col bg-background/80 backdrop-blur-lg">
                 <header className="flex-shrink-0 h-16 px-4 flex justify-between items-center border-b z-10 bg-background/70">
                    <div className="flex items-center gap-3 overflow-hidden">
                        {React.createElement(getIconForType(resource.type), { className: "h-5 w-5 shrink-0" })}
                        {/* El DialogTitle se mantiene por accesibilidad pero se oculta visualmente */}
                        <DialogHeader>
                            <DialogTitle className="sr-only">{resource.title}</DialogTitle>
                        </DialogHeader>
                        <p className="font-semibold truncate text-foreground">{resource.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                         {resource.url && (
                          <DownloadButton url={pinVerifiedUrl || resource.url} resourceId={resource.id} hasPin={resource.hasPin} />
                        )}
                        <Button variant="outline" size="sm" disabled>
                            <Info className="h-4 w-4 mr-2" />
                            Detalles
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
                    </div>
                </header>
                <div className="flex-grow relative">
                    <Button variant="ghost" size="icon" onClick={() => onNavigate('prev')} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 bg-background/50 hover:bg-background/80"><ChevronLeft/></Button>
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                        <ContentPreview resource={resource} pinVerifiedUrl={pinVerifiedUrl} onPinVerified={setPinVerifiedUrl} />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onNavigate('next')} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 bg-background/50 hover:bg-background/80"><ChevronRight/></Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
