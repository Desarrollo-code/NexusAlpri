// src/components/resources/playlist-creator-modal.tsx
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ListVideo, PlusCircle, Trash2, Youtube, UploadCloud, Globe, Briefcase, Users } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UploadArea } from '@/components/ui/upload-area';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '@/components/ui/progress';
import type { AppResourceType, User as AppUser, Process, ResourceSharingMode } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { Separator } from '@/components/ui/separator';

interface PlaylistCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentId: string | null;
    onSave: () => void;
    playlistToEdit?: AppResourceType | null;
}

interface VideoItem {
    id: string;
    url: string;
    title: string;
    thumbnail: string;
    source: 'youtube' | 'upload';
}

const UserOrProcessList = ({ type, items, selectedIds, onSelectionChange, search, onSearchChange }: { 
    type: 'user' | 'process', 
    items: any[], 
    selectedIds: string[], 
    onSelectionChange: (ids: string[]) => void,
    search: string;
    onSearchChange: (value: string) => void;
}) => {
    const filteredItems = items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

    const handleSelection = (id: string, checked: boolean) => {
        onSelectionChange(checked ? [...selectedIds, id] : selectedIds.filter(i => i !== id));
    };

    return (
        <div className="mt-2 space-y-2">
            <Input placeholder={`Buscar ${type === 'user' ? 'usuario' : 'proceso'}...`} value={search} onChange={e => onSearchChange(e.target.value)} />
            <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-2">
                    {filteredItems.map(item => (
                        <div key={item.id} className="flex items-center space-x-3 p-1.5 rounded-md hover:bg-muted">
                            <Checkbox id={`${type}-${item.id}`} checked={selectedIds.includes(item.id)} onCheckedChange={(c) => handleSelection(item.id, !!c)}/>
                            <Label htmlFor={`${type}-${item.id}`} className="flex items-center gap-2 font-normal cursor-pointer text-sm">
                                {type === 'user' && <Avatar className="h-7 w-7"><AvatarImage src={item.avatar || undefined} /><AvatarFallback><Identicon userId={item.id}/></AvatarFallback></Avatar>}
                                {item.name}
                            </Label>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};


export function PlaylistCreatorModal({ isOpen, onClose, parentId, onSave, playlistToEdit }: PlaylistCreatorModalProps) {
    const { toast } = useToast();
    const { user, settings } = useAuth();
    const isEditing = !!playlistToEdit;
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [videos, setVideos] = useState<VideoItem[]>([]);
    
    // Permissions
    const [sharingMode, setSharingMode] = useState<ResourceSharingMode>('PUBLIC');
    const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([]);
    const [sharedWithProcessIds, setSharedWithProcessIds] = useState<string[]>([]);
    const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);

    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [allProcesses, setAllProcesses] = useState<Process[]>([]);

    // UI State
    const [videoSource, setVideoSource] = useState<'youtube' | 'upload'>('youtube');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [userSearch, setUserSearch] = useState('');


    useEffect(() => {
        if (isOpen) {
            if (isEditing && playlistToEdit) {
                setTitle(playlistToEdit.title);
                setDescription(playlistToEdit.description || '');
                setCategory(playlistToEdit.category || settings?.resourceCategories[0] || 'General');
                
                const existingVideos = (playlistToEdit as any).children?.map((v: any) => ({
                    id: v.id,
                    url: v.url,
                    title: v.title,
                    thumbnail: v.url && getYoutubeVideoId(v.url) ? `https://img.youtube.com/vi/${getYoutubeVideoId(v.url)}/mqdefault.jpg` : '',
                    source: v.url && getYoutubeVideoId(v.url) ? 'youtube' : 'upload',
                })) || [];
                setVideos(existingVideos);

                setSharingMode(playlistToEdit.sharingMode || 'PUBLIC');
                setSharedWithUserIds(playlistToEdit.sharedWith?.map(u => u.id) || []);
                setSharedWithProcessIds(playlistToEdit.sharedWithProcesses?.map(p => p.id) || []);
                setCollaboratorIds(playlistToEdit.collaborators?.map(c => c.id) || []);

            } else {
                setTitle('');
                setDescription('');
                setCategory(settings?.resourceCategories[0] || 'General');
                setVideos([]);
                setSharingMode('PUBLIC');
                setSharedWithUserIds([]);
                setSharedWithProcessIds([]);
                setCollaboratorIds([]);
            }
            setVideoUrl('');
            setVideoSource('youtube');

             if (user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR') {
                Promise.all([
                  fetch('/api/users/list').then(res => res.json()),
                  fetch('/api/processes?format=flat').then(res => res.json())
                ]).then(([usersData, processesData]) => {
                    setAllUsers(usersData.users || []);
                    setAllProcesses(processesData || []);
                }).catch(console.error);
            }
        }
    }, [isOpen, playlistToEdit, isEditing, settings, user]);


    const handleAddVideoFromUrl = () => {
        const youtubeId = getYoutubeVideoId(videoUrl);
        if (!youtubeId) {
            toast({ title: 'URL inválida', description: 'Por favor, ingresa una URL de YouTube válida.', variant: 'destructive'});
            return;
        }

        const videoTitle = `Video de YouTube ${videos.length + 1}`;

        setVideos(prev => [
            ...prev,
            {
                id: `video-${Date.now()}`,
                url: videoUrl,
                title: videoTitle,
                thumbnail: `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`,
                source: 'youtube'
            }
        ]);
        setVideoUrl('');
    };

    const handleVideoFileUpload = async (files: FileList | null) => {
      if (!files) return;
      
      setIsUploading(true);
      const newUploads: VideoItem[] = [];
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        const tempId = `upload-${file.name}-${Date.now()}`;
        const newUploadItem: VideoItem = {
            id: tempId,
            url: '',
            title: file.name,
            thumbnail: '',
            source: 'upload',
        };
        newUploads.push(newUploadItem);

        uploadWithProgress('/api/upload/resource-file', file, (progress) => {
            setUploadProgress(prev => ({ ...prev, [tempId]: progress }));
        })
        .then(result => {
             setVideos(prev => prev.map(v => v.id === tempId ? {...v, url: result.url} : v));
             setUploadProgress(prev => ({ ...prev, [tempId]: 100 }));
        })
        .catch(err => {
            toast({ title: `Error subiendo ${file.name}`, description: (err as Error).message, variant: 'destructive' });
            setVideos(prev => prev.filter(v => v.id !== tempId));
        });
      }
      setVideos(prev => [...prev, ...newUploads.map(u => ({...u, url: '#placeholder'}))]);
      setIsUploading(false);
    };
    
    const handleRemoveVideo = (id: string) => {
        setVideos(prev => prev.filter(v => v.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const finalVideos = videos.filter(v => v.url && v.url !== '#placeholder');
            if (finalVideos.length === 0) {
                throw new Error("Añade al menos un video válido a la lista.");
            }

            const endpoint = isEditing ? `/api/resources/${playlistToEdit?.id}` : '/api/resources';
            const method = isEditing ? 'PUT' : 'POST';

            const payload = {
                title, description, category, parentId, type: 'VIDEO_PLAYLIST',
                sharingMode,
                sharedWithUserIds: sharingMode === 'PRIVATE' ? sharedWithUserIds : [],
                sharedWithProcessIds: sharingMode === 'PROCESS' ? sharedWithProcessIds : [],
                collaboratorIds,
                videos: finalVideos.map(v => ({ url: v.url, title: v.title })),
            };

            const response = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error(`No se pudo ${isEditing ? 'actualizar' : 'crear'} la lista de reproducción.`);
            
            toast({ title: `Lista de Reproducción ${isEditing ? 'Actualizada' : 'Creada'}` });
            onSave();
            onClose();
        } catch (err) {
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };
    

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl">
                <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
                    <DialogTitle>{isEditing ? 'Editar Lista de Videos' : 'Crear Nueva Lista de Videos'}</DialogTitle>
                    <DialogDescription>Agrupa videos en una secuencia de aprendizaje.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 min-h-0">
                    <div className="px-6">
                        <form id="playlist-form" onSubmit={handleSubmit} className="space-y-4 py-4">
                            {/* --- BASIC INFO --- */}
                            <div className="space-y-1.5"><Label htmlFor="playlist-title">Título de la Lista</Label><Input id="playlist-title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                            <div className="space-y-1.5"><Label htmlFor="playlist-description">Descripción (Opcional)</Label><Input id="playlist-description" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                            
                            <Separator/>

                            {/* --- VIDEOS SECTION --- */}
                            <div className="space-y-1.5">
                                <Label>Añadir Videos</Label>
                                <RadioGroup value={videoSource} onValueChange={(v) => setVideoSource(v as 'youtube' | 'upload')} className="grid grid-cols-2 gap-2">
                                   <div><RadioGroupItem value="youtube" id="src-youtube" className="sr-only"/><Label htmlFor="src-youtube" className={`flex items-center justify-center gap-2 p-2 border-2 rounded-lg cursor-pointer ${videoSource === 'youtube' ? 'border-primary' : 'border-muted'}`}><Youtube className="h-5 w-5"/> YouTube</Label></div>
                                   <div><RadioGroupItem value="upload" id="src-upload" className="sr-only"/><Label htmlFor="src-upload" className={`flex items-center justify-center gap-2 p-2 border-2 rounded-lg cursor-pointer ${videoSource === 'upload' ? 'border-primary' : 'border-muted'}`}><UploadCloud className="h-5 w-5"/> Subir Video</Label></div>
                                </RadioGroup>
                                {videoSource === 'youtube' ? (
                                  <div className="flex gap-2"><Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Pega una URL de YouTube"/><Button type="button" onClick={handleAddVideoFromUrl} disabled={!videoUrl}><PlusCircle className="h-4 w-4"/></Button></div>
                                ) : (
                                  <div className="space-y-2"><UploadArea onFileSelect={handleVideoFileUpload} disabled={isUploading} inputId="video-upload-input" multiple={true} /></div>
                                )}
                                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-2">
                                    {videos.map(video => (
                                        <div key={video.id} className="flex items-center gap-2 p-2 border rounded-md">
                                            <div className="w-20 h-12 bg-black rounded flex-shrink-0 relative">
                                                {video.thumbnail ? (
                                                    <Image src={video.thumbnail} alt={video.title} fill className="object-cover"/>
                                                ) : (<div className="flex items-center justify-center h-full"><Youtube className="h-6 w-6 text-red-500"/></div>)}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                               <p className="text-sm font-medium truncate">{video.title}</p>
                                               {uploadProgress[video.id] < 100 && <Progress value={uploadProgress[video.id] || 0} className="h-1 mt-1"/>}
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveVideo(video.id)}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator/>
                            
                            {/* --- PERMISSIONS SECTION --- */}
                            <div className="space-y-4">
                               <div className="space-y-2">
                                    <Label>Visibilidad</Label>
                                    <RadioGroup value={sharingMode} onValueChange={(v) => setSharingMode(v as ResourceSharingMode)} className="grid grid-cols-3 gap-2">
                                        <Label htmlFor="share-public" className={`flex flex-col items-center justify-center p-2 text-xs border-2 rounded-lg cursor-pointer ${sharingMode === 'PUBLIC' ? 'border-primary' : 'border-muted'}`}><Globe className="mb-1 h-5 w-5"/>Público</Label>
                                        <RadioGroupItem value="PUBLIC" id="share-public" className="sr-only"/>
                                        <Label htmlFor="share-process" className={`flex flex-col items-center justify-center p-2 text-xs border-2 rounded-lg cursor-pointer ${sharingMode === 'PROCESS' ? 'border-primary' : 'border-muted'}`}><Briefcase className="mb-1 h-5 w-5"/>Por Proceso</Label>
                                        <RadioGroupItem value="PROCESS" id="share-process" className="sr-only"/>
                                        <Label htmlFor="share-private" className={`flex flex-col items-center justify-center p-2 text-xs border-2 rounded-lg cursor-pointer ${sharingMode === 'PRIVATE' ? 'border-primary' : 'border-muted'}`}><Users className="mb-1 h-5 w-5"/>Privado</Label>
                                        <RadioGroupItem value="PRIVATE" id="share-private" className="sr-only"/>
                                    </RadioGroup>
                                    {sharingMode === 'PROCESS' && <UserOrProcessList type="process" items={allProcesses} selectedIds={sharedWithProcessIds} onSelectionChange={setSharedWithProcessIds} search={userSearch} onSearchChange={setUserSearch} />}
                                    {sharingMode === 'PRIVATE' && <UserOrProcessList type="user" items={allUsers} selectedIds={sharedWithUserIds} onSelectionChange={setSharedWithUserIds} search={userSearch} onSearchChange={setUserSearch} />}
                               </div>
                                <div className="space-y-2">
                                    <Label>Colaboradores</Label>
                                    <p className="text-xs text-muted-foreground">Usuarios que pueden editar esta lista.</p>
                                    <UserOrProcessList type="user" items={allUsers} selectedIds={collaboratorIds} onSelectionChange={setCollaboratorIds} search={userSearch} onSearchChange={setUserSearch} />
                                </div>
                            </div>
                        </form>
                    </div>
                </ScrollArea>
                <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" form="playlist-form" disabled={isSaving || !title || videos.length === 0}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ListVideo className="mr-2 h-4 w-4"/>}
                        {isEditing ? 'Guardar Cambios' : 'Crear Lista'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
