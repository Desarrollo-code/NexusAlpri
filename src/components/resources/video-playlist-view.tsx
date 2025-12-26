// src/components/resources/video-playlist-view.tsx
'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { AppResourceType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { PlayCircle, Folder, Video, Edit, ListVideo, BrainCircuit, Trash2, Loader2, CheckCircle2, ChevronRight, Share2, Info } from 'lucide-react';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { FileIcon } from '@/components/ui/file-icon';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/auth-context';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizViewer } from '../quiz-viewer';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';


interface PlaylistItemProps {
    resource: AppResourceType;
    onSelect: () => void;
    isActive: boolean;
    onTitleChange: (id: string, newTitle: string) => void;
    onDelete: (resource: AppResourceType) => void;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({ resource, onSelect, isActive, onTitleChange, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(resource.title);
    const { toast } = useToast();
    const { user } = useAuth();

    const canModify = user?.role === 'ADMINISTRATOR' || user?.id === resource.uploaderId;

    const youtubeId = getYoutubeVideoId(resource.url);
    const fileExtension = youtubeId ? 'youtube' : (resource.filetype?.split('/')[1] || resource.url?.split('.').pop() || 'file');

    const handleTitleSave = async () => {
        if (title.trim() === resource.title) {
            setIsEditing(false);
            return;
        }
        try {
            const response = await fetch(`/api/resources/${resource.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: title.trim() }),
            });
            if (!response.ok) throw new Error('No se pudo guardar el título.');
            onTitleChange(resource.id, title.trim());
            toast({ description: "Título actualizado." });
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
            setTitle(resource.title); // Revertir en caso de error
        } finally {
            setIsEditing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleTitleSave();
        } else if (e.key === 'Escape') {
            setTitle(resource.title);
            setIsEditing(false);
        }
    }

    return (
        <motion.div
            layout
            onClick={onSelect}
            whileHover={{ x: 4 }}
            className={cn(
                "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 group relative overflow-hidden",
                isActive
                    ? "bg-primary/20 border-l-4 border-l-primary shadow-md"
                    : "hover:bg-muted/50 border-l-4 border-l-transparent"
            )}
        >
            <div className="w-24 h-16 bg-black rounded-lg overflow-hidden flex-shrink-0 relative shadow-inner ring-1 ring-white/10">
                <FileIcon
                    displayMode="list"
                    type={fileExtension}
                    thumbnailUrl={resource.url}
                    className="w-full h-full object-cover"
                />
                <AnimatePresence>
                    {isActive && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-primary/40 backdrop-blur-[1px] flex items-center justify-center"
                        >
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <PlayCircle className="h-5 w-5 text-primary fill-current" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="flex-grow min-w-0">
                {isEditing ? (
                    <Input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={handleKeyDown}
                        className="h-8 text-sm bg-background/50 border-primary/30"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <p
                        className={cn(
                            "font-bold text-sm leading-tight line-clamp-2 transition-colors",
                            isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                        )}
                        title={resource.title}
                    >
                        {resource.title}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-muted/30 border-none text-muted-foreground uppercase">{fileExtension}</Badge>
                </div>
            </div>
            {canModify && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); onDelete(resource); }}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </motion.div>
    );
};


interface VideoPlayerProps {
    resource: AppResourceType | null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ resource }) => {
    if (!resource || !resource.url) {
        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center text-muted-foreground">
                <PlayCircle className="h-16 w-16 mb-4" />
                <p>Selecciona un video para reproducir</p>
            </div>
        );
    }

    const youtubeId = getYoutubeVideoId(resource.url);

    if (youtubeId) {
        return (
            <iframe
                key={resource.id}
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={resource.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe >
        );
    }

    return (
        <video
            key={resource.id}
            src={resource.url}
            controls
            autoPlay
            className="w-full h-full object-contain bg-black"
        >
            Tu navegador no soporta la etiqueta de video.
        </video>
    );
};


export const VideoPlaylistView: React.FC<{ resources: AppResourceType[], folder: AppResourceType }> = ({ resources: initialResources, folder }) => {
    const isMobile = useIsMobile();
    const { toast } = useToast();
    const [playlistResources, setPlaylistResources] = useState(initialResources);
    const [selectedVideo, setSelectedVideo] = useState<AppResourceType | null>(playlistResources[0] || null);
    const [videoToDelete, setVideoToDelete] = useState<AppResourceType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showQuiz, setShowQuiz] = useState(false);
    const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());

    // Derived state for current video index
    const currentVideoIndex = useMemo(() => {
        if (!selectedVideo) return null;
        const index = playlistResources.findIndex(r => r.id === selectedVideo.id);
        return index !== -1 ? index : null;
    }, [selectedVideo, playlistResources]);

    // Mark current video as completed when it changes (or when ended, but we'll simplify)
    useEffect(() => {
        if (!showQuiz && currentVideoIndex !== null) {
            const currentVid = playlistResources[currentVideoIndex];
            if (currentVid) {
                setCompletedVideos(prev => new Set(prev).add(currentVid.id));
            }
        }
    }, [currentVideoIndex, showQuiz, playlistResources]);

    const progressValue = useMemo(() => {
        if (playlistResources.length === 0) return 0;
        const totalItems = playlistResources.length + (folder.quiz ? 1 : 0);
        const completedCount = completedVideos.size + (showQuiz ? 0.5 : 0); // Placeholder logic
        return Math.round((completedCount / totalItems) * 100);
    }, [completedVideos, playlistResources, folder.quiz, showQuiz]);

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            toast({ title: "Enlace Copiado", description: "El enlace de la playlist ha sido copiado al portapapeles." });
        });
    };

    const handleInfo = () => {
        toast({ title: folder.title, description: folder.description || "Esta playlist no tiene una descripción detallada." });
    };

    useEffect(() => {
        setPlaylistResources(initialResources);
        if (!selectedVideo && initialResources.length > 0) {
            setSelectedVideo(initialResources[0]);
        }
    }, [initialResources, selectedVideo]);


    const playlistHeight = isMobile ? 'h-64' : 'h-[calc(100vh-22rem)]';

    const handleTitleChange = (id: string, newTitle: string) => {
        setPlaylistResources(prev => prev.map(r => r.id === id ? { ...r, title: newTitle } : r));
        if (selectedVideo?.id === id) {
            setSelectedVideo(prev => prev ? { ...prev, title: newTitle } : null);
        }
    }

    const handleDeleteVideo = async () => {
        if (!videoToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/resources/${videoToDelete.id}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo eliminar el video.');
            }
            toast({ description: "El video ha sido eliminado de la lista." });

            // Update state locally
            const newPlaylist = playlistResources.filter(r => r.id !== videoToDelete.id);
            setPlaylistResources(newPlaylist);

            // If the deleted video was the selected one, select the next one or null
            if (selectedVideo?.id === videoToDelete.id) {
                const deletedIndex = playlistResources.findIndex(r => r.id === videoToDelete.id);
                setSelectedVideo(newPlaylist[deletedIndex] || newPlaylist[0] || null);
            }
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsDeleting(false);
            setVideoToDelete(null);
        }
    };


    return (
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-background via-background/95 to-primary/5 border border-primary/10">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[center_top_-1px] pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 relative z-10">
                {/* Primary Content Area */}
                <div className="lg:col-span-8 flex flex-col min-h-[500px]">
                    <div className="relative flex-grow bg-black shadow-inner">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={showQuiz ? 'quiz' : selectedVideo?.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="w-full h-full aspect-video"
                            >
                                {showQuiz && folder.quiz ? (
                                    <div className="p-4 md:p-8 h-full bg-muted/20 backdrop-blur-md overflow-y-auto">
                                        <QuizViewer
                                            quiz={folder.quiz}
                                            lessonId={folder.id}
                                            isCreatorPreview={false}
                                            isEnrolled={true}
                                        />
                                    </div>
                                ) : (
                                    <VideoPlayer resource={selectedVideo} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Video Info Bottom Bar */}
                    <div className="p-6 bg-background/40 backdrop-blur-xl border-t border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-primary/10 text-primary border-primary/20">{showQuiz ? 'Evaluación' : 'Reproduciendo'}</Badge>
                                {!showQuiz && <span className="text-xs text-muted-foreground">• {selectedVideo?.uploaderName}</span>}
                            </div>
                            <h3 className="text-2xl font-black font-headline tracking-tight truncate text-foreground">
                                {showQuiz ? `Evaluación: ${folder.quiz?.title}` : (selectedVideo?.title || "Selecciona un recurso")}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={handleShare}><Share2 className="h-5 w-5" /></Button>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={handleInfo}><Info className="h-5 w-5" /></Button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Playlist */}
                <div className="lg:col-span-4 border-l border-white/5 bg-background/60 backdrop-blur-2xl h-full flex flex-col">
                    <div className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 flex items-center justify-center bg-primary/10 text-primary rounded-2xl shadow-inner border border-primary/20">
                                    <ListVideo className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-lg tracking-tight leading-none text-foreground">{folder.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-1 font-medium">{playlistResources.length} lecciones en total</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                <span>Progreso de la lista</span>
                                <span>{Math.round((playlistResources.length > 0 ? 1 / playlistResources.length : 0) * 100)}%</span>
                            </div>
                            <Progress value={Math.round((playlistResources.length > 0 ? 1 / playlistResources.length : 0) * 100)} className="h-1.5 bg-primary/10" />
                        </div>
                    </div>

                    <div className="flex-grow overflow-hidden px-3">
                        <ScrollArea className="h-full max-h-[calc(100vh-25rem)] pr-2 thin-scrollbar">
                            <div className="space-y-2 pb-6">
                                {playlistResources.length > 0 ? (
                                    <>
                                        <div className="px-3 py-2">
                                            <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">Contenido Multimedia</h5>
                                            <div className="space-y-1">
                                                {playlistResources.map((resource) => (
                                                    <PlaylistItem
                                                        key={resource.id}
                                                        resource={resource}
                                                        onSelect={() => { setSelectedVideo(resource); setShowQuiz(false); }}
                                                        isActive={!showQuiz && selectedVideo?.id === resource.id}
                                                        onTitleChange={handleTitleChange}
                                                        onDelete={setVideoToDelete}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {folder.quiz && (
                                            <div className="px-3 pt-4 border-t border-white/5">
                                                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">Evaluación Final</h5>
                                                <motion.div
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setShowQuiz(true)}
                                                    className={cn(
                                                        "cursor-pointer p-4 rounded-2xl flex items-center gap-4 transition-all border-2",
                                                        showQuiz
                                                            ? "bg-primary border-primary shadow-lg shadow-primary/20 text-primary-foreground"
                                                            : "bg-primary/5 border-primary/20 hover:border-primary/40 text-foreground"
                                                    )}
                                                >
                                                    <div className={cn("p-2 rounded-xl", showQuiz ? "bg-white/20" : "bg-primary/10")}>
                                                        <BrainCircuit className={cn("h-6 w-6", showQuiz ? "text-white" : "text-primary")} />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <p className="font-black text-sm tracking-tight">{folder.quiz.title}</p>
                                                        <p className={cn("text-[10px] font-bold uppercase tracking-wider", showQuiz ? "text-white/80" : "text-muted-foreground")}>Examen de conocimientos</p>
                                                    </div>
                                                    <ChevronRight className={cn("h-5 w-5", showQuiz ? "text-white" : "text-muted-foreground")} />
                                                </motion.div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center p-12 space-y-4">
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-50">
                                            <Video className="h-8 w-8" />
                                        </div>
                                        <p className="text-muted-foreground text-sm font-medium">Lista de reproducción vacía</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>

            <AlertDialog open={!!videoToDelete} onOpenChange={(open) => !open && setVideoToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este video?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará "<strong>{videoToDelete?.title}</strong>" de esta lista de reproducción. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteVideo} disabled={isDeleting} className={cn(buttonVariants({ variant: 'destructive' }))}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
