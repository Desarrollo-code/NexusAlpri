// src/app/(app)/resources/page.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { EnterpriseResource as AppResourceType, UserRole } from '@/types';
import { Search, ArchiveX, Loader2, AlertTriangle, Trash2, Edit, List, MoreVertical, Folder, FileText, Video, Info, Notebook, Shield, FileQuestion, LayoutGrid, Eye, Download, ChevronRight, Home, Filter, ArrowUp, ArrowDown, Lock, X, UploadCloud, Grid } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Resource as PrismaResource, ResourceType as PrismaResourceType } from '@prisma/client';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { UploadArea } from '@/components/ui/upload-area';
import { ResourceDetailsSidebar } from '@/components/resources/details-sidebar';
import { Progress } from '@/components/ui/progress';


// --- Types and Mappers ---
interface ApiResource extends Omit<PrismaResource, 'uploader' | 'tags' | 'type' | 'uploadDate' | 'pin'> {
  uploader: { id: string; name: string | null } | null;
  tags: string[];
  type: PrismaResourceType;
  uploadDate: string;
  hasPin: boolean;
  description: string | null;
}

function mapApiResourceToAppResource(apiResource: ApiResource): AppResourceType {
  return {
    id: apiResource.id,
    title: apiResource.title,
    description: apiResource.description || undefined,
    type: apiResource.type as AppResourceType['type'],
    category: apiResource.category || 'General',
    tags: apiResource.tags || [],
    url: apiResource.url || undefined,
    uploadDate: apiResource.uploadDate,
    uploaderId: apiResource.uploaderId || undefined,
    uploaderName: apiResource.uploader?.name || 'N/A',
    hasPin: apiResource.hasPin,
    parentId: apiResource.parentId,
  };
}

// --- Helper Functions ---
const getIconForType = (type: AppResourceType['type']) => {
    switch (type) {
      case 'FOLDER': return <Folder className="h-5 w-5 text-yellow-500" />;
      case 'DOCUMENT': return <FileText className="h-5 w-5 text-blue-500" />;
      case 'GUIDE': return <Info className="h-5 w-5 text-green-500" />;
      case 'MANUAL': return <Notebook className="h-5 w-5 text-indigo-500" />;
      case 'POLICY': return <Shield className="h-5 w-5 text-red-500" />;
      case 'VIDEO': return <Video className="h-5 w-5 text-purple-500" />;
      default: return <FileQuestion className="h-5 w-5 text-gray-500" />;
    }
};

const getYoutubeVideoId = (url: string | undefined): string | null => {
    if (!url) return null;
    let videoId = null;
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.substring(1);
      }
    } catch (e) {
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      return match ? match[1] : null;
    }
    return videoId;
};

// --- Sub-components for Page ---
const ResourceGridItem = React.memo(({ resource, onSelect, onEdit, onDelete, onNavigate, isSelected }: { resource: AppResourceType, onSelect: () => void, onEdit: (r: AppResourceType) => void, onDelete: (id: string) => void, onNavigate: (r: AppResourceType) => void, isSelected: boolean }) => {
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
        
        if (isImage) {
           return <Image src={resource.url!} alt={resource.title} fill className="object-cover" data-ai-hint="resource document"/>
        }
        if (youtubeId) {
            return <Image src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`} alt={resource.title} fill className="object-cover" data-ai-hint="video thumbnail"/>
        }
        return (
            <div className="flex items-center justify-center w-full h-full bg-muted">
                {getIconForType(resource.type)}
            </div>
        );
    };

    return (
        <Card 
            className={cn("group w-full h-full overflow-hidden transition-all duration-200 cursor-pointer", isSelected ? "ring-2 ring-primary shadow-lg" : "shadow-sm hover:shadow-md")}
            onClick={handleClick}
        >
            <div className="aspect-video w-full flex items-center justify-center overflow-hidden relative">
                <Thumbnail />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                {resource.hasPin && !isFolder && (
                    <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm p-1 rounded-full">
                        <Lock className="h-3 w-3 text-amber-400" />
                    </div>
                )}
            </div>
            <div className="p-3">
                <div className="flex justify-between items-start gap-2">
                    <p className="font-semibold text-sm leading-tight line-clamp-2">{resource.title}</p>
                    {canModify && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-2"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                {!isFolder && <DropdownMenuItem onClick={() => onEdit(resource)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>}
                                <DropdownMenuItem onClick={() => onDelete(resource.id)} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{isFolder ? 'Carpeta' : resource.category}</p>
            </div>
        </Card>
    );
});
ResourceGridItem.displayName = 'ResourceGridItem';

// --- Main Page Component ---
export default function ResourcesPage() {
  const { user, settings } = useAuth();
  const { toast } = useToast();

  const [allApiResources, setAllApiResources] = useState<AppResourceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Folder navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; title: string }[]>([]);

  // Modals state
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  
  const [isSubmittingResource, setIsSubmittingResource] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newResourceFile, setNewResourceFile] = useState<File | null>(null);

  const [resourceToDelete, setResourceToDelete] = useState<AppResourceType | null>(null);
  const [isDeletingResource, setIsDeletingResource] = useState(false);
  
  const [selectedResource, setSelectedResource] = useState<AppResourceType | null>(null);

  // --- Data Fetching and Memoization ---
  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (currentFolderId) params.append('parentId', currentFolderId);
    if (searchTerm) params.append('search', searchTerm);
    if (activeCategory !== 'all') params.append('category', activeCategory);

    try {
      const response = await fetch(`/api/resources?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch resources');
      const data: { resources: AppResourceType[], totalResources: number } = await response.json();
      setAllApiResources(data.resources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
      toast({ title: "Error al cargar recursos", description: err instanceof Error ? err.message : 'No se pudo cargar la biblioteca.', variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [toast, currentFolderId, searchTerm, activeCategory]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);
  
  useEffect(() => {
    const newBreadcrumbs = currentFolderId === null ? [] : breadcrumbs;
    setBreadcrumbs(newBreadcrumbs);
  }, [currentFolderId]);


  // --- Event Handlers ---
  const resetCreateForm = () => {
    setNewResourceFile(null);
    setUploadProgress(0);
  };

  const handleCreateFile = async (formData: FormData) => {
    if (!user?.id) return;
    const file = newResourceFile;
    const title = formData.get('title') as string;
    const category = formData.get('category') as string;
    const type = formData.get('type') as string;
    
    if (!file || !title || !category || !type) {
        toast({ title: "Error", description: "Todos los campos son obligatorios.", variant: "destructive" });
        return;
    }

    setIsSubmittingResource(true);
    let finalResourceUrl = '';

    setIsUploadingFile(true);
    setUploadProgress(0);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    try {
        const result: { url: string } = await uploadWithProgress('/api/upload/resource-file', uploadFormData, setUploadProgress);
        finalResourceUrl = result.url;
    } catch (err) {
        toast({ title: "Error de Subida", description: (err as Error).message, variant: "destructive" });
        setIsUploadingFile(false);
        setIsSubmittingResource(false);
        return;
    }
    setIsUploadingFile(false);
    
    try {
      const payload = { title, type, category, url: finalResourceUrl, uploaderId: user.id, parentId: currentFolderId };
      const response = await fetch('/api/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to create resource');
      toast({ title: "Recurso Creado", description: `El recurso "${title}" ha sido añadido.` });
      setShowCreateFileModal(false);
      resetCreateForm();
      fetchResources();
    } catch (err) {
      toast({ title: "Error al crear recurso", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingResource(false);
    }
  };
  
  const handleDeleteResource = async () => {
    if (!resourceToDelete) return;
    setIsDeletingResource(true);
    try {
      const response = await fetch(`/api/resources/${resourceToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to delete resource');
      toast({ title: 'Recurso Eliminado', description: `El recurso "${resourceToDelete.title}" ha sido eliminado.` });
      if (selectedResource?.id === resourceToDelete.id) {
          setSelectedResource(null);
      }
      fetchResources();
    } catch (err) {
      toast({ title: 'Error al eliminar', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsDeletingResource(false);
      setResourceToDelete(null);
    }
  };

  const handleNavigateFolder = (resource: AppResourceType) => {
    if (resource.type === 'FOLDER') {
        setCurrentFolderId(resource.id);
        setBreadcrumbs(prev => [...prev, { id: resource.id, title: resource.title }]);
        setSelectedResource(null);
    }
  };

  const handleBreadcrumbClick = (folderId: string | null, index: number) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    setSelectedResource(null);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResources();
  };
  
  const handleCategoryChange = (categoryName: string) => {
    setActiveCategory(categoryName);
  }

  const allCategories = useMemo(() => ['all', ...(settings?.resourceCategories || [])], [settings]);

  return (
    <div className="flex h-full">
      <main className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
        <header className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
           <div className="flex-grow">
               <p className="text-muted-foreground">Explora, busca y gestiona todos los archivos de la organización.</p>
           </div>
           {(user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR') && (
              <Button onClick={() => setShowCreateFileModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                  <UploadCloud className="mr-2 h-4 w-4"/> Subir Nuevo Recurso
              </Button>
           )}
        </header>

        <Card className="flex-shrink-0 p-4 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <form onSubmit={handleSearchSubmit} className="relative w-full flex-grow">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                   <Input type="search" placeholder="Buscar documentos, guías o materiales..." className="pl-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                </form>
                <div className="flex items-center gap-2">
                    <Select>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Todos los Tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los Tipos</SelectItem>
                        <SelectItem value="DOCUMENT">Documento</SelectItem>
                        <SelectItem value="VIDEO">Video</SelectItem>
                        <SelectItem value="GUIDE">Guía</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex bg-muted rounded-md p-1">
                      <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}><Grid size={18} /></Button>
                      <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}><List size={18} /></Button>
                    </div>
                </div>
            </div>
             <Separator className="my-4"/>
             <div className="flex flex-wrap gap-2">
                 {allCategories.map(category => (
                    <Button 
                        key={category} 
                        variant={activeCategory === category ? 'default' : 'outline'}
                        onClick={() => handleCategoryChange(category)}
                        className="rounded-full px-3 py-1 h-auto text-xs"
                    >
                        {category === 'all' ? 'Toda la Biblioteca' : category}
                    </Button>
                 ))}
             </div>
        </Card>

        <div className="flex items-center text-sm text-muted-foreground mb-4">
            <button onClick={() => handleBreadcrumbClick(null, -1)} className="hover:text-primary flex items-center gap-1 shrink-0"><Home className="h-4 w-4"/> Biblioteca</button>
            {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id || 'root'}>
                <ChevronRight className="h-4 w-4 mx-1 shrink-0" />
                <button onClick={() => handleBreadcrumbClick(crumb.id, index)} className="hover:text-primary shrink-0 truncate">{crumb.title}</button>
            </React.Fragment>
            ))}
        </div>
        
        <div className="flex-grow overflow-auto -mx-4 px-4 thin-scrollbar">
            {isLoading ? (
                <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-destructive"><AlertTriangle className="h-8 w-8 mb-2" /><p className="font-semibold">{error}</p></div>
            ) : allApiResources.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ArchiveX className="h-16 w-16 mb-4 text-primary"/>
                    <h3 className="text-xl font-semibold text-foreground">{searchTerm ? 'No hay coincidencias' : 'Carpeta Vacía'}</h3>
                    <p>{searchTerm ? 'Prueba con otro término.' : 'Sube un archivo para empezar.'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mt-4">
                    {allApiResources.map(item => <ResourceGridItem key={item.id} resource={item} onSelect={() => setSelectedResource(item)} onEdit={() => {}} onDelete={() => setResourceToDelete(item)} onNavigate={handleNavigateFolder} isSelected={selectedResource?.id === item.id}/>)}
                </div>
            )}
        </div>
      </main>

      <div className={cn("transition-all duration-300 ease-in-out", selectedResource ? 'w-80 flex-shrink-0 border-l' : 'w-0')}>
         <ResourceDetailsSidebar
              resource={selectedResource}
              onClose={() => setSelectedResource(null)}
              onDelete={(id) => { setResourceToDelete(allApiResources.find(r => r.id === id) || null); }}
              onEdit={() => {}}
         />
      </div>
      
      <AlertDialog open={!!resourceToDelete} onOpenChange={(open) => !open && setResourceToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription>El recurso "<strong>{resourceToDelete?.title}</strong>" será eliminado permanentemente. {resourceToDelete?.type === 'FOLDER' && 'Todos los archivos dentro también serán eliminados.'}</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteResource} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
       <Dialog open={showCreateFileModal} onOpenChange={(isOpen) => { if (!isOpen) resetCreateForm(); setShowCreateFileModal(isOpen); }}>
          <DialogContent className="w-[95vw] max-w-lg rounded-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Subir Nuevo Recurso</DialogTitle><DialogDescription>Completa los detalles para añadir un nuevo recurso a la biblioteca.</DialogDescription></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateFile(new FormData(e.currentTarget)); }} className="grid gap-4 py-4">
                  <div className="space-y-1"><Label htmlFor="title">Título <span className="text-destructive">*</span></Label><Input id="title" name="title" required disabled={isSubmittingResource} /></div>
                  <div className="space-y-1"><Label htmlFor="type">Tipo <span className="text-destructive">*</span></Label><Select name="type" required disabled={isSubmittingResource}><SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger><SelectContent><SelectItem value="DOCUMENT">Documento</SelectItem><SelectItem value="GUIDE">Guía</SelectItem></SelectContent></Select></div>
                  <div className="space-y-1"><Label htmlFor="category">Categoría <span className="text-destructive">*</span></Label><Select name="category" required disabled={isSubmittingResource}><SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger><SelectContent>{(settings?.resourceCategories || []).sort().map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <Separator />
                  <div className="space-y-1">
                      <UploadArea onFileSelect={(file) => setNewResourceFile(file)} disabled={isSubmittingResource} />
                      {isUploadingFile && <Progress value={uploadProgress} className="mt-2" />}
                      {newResourceFile && <p className="text-xs text-center text-muted-foreground mt-1">Archivo seleccionado: {newResourceFile.name}</p>}
                  </div>
                  <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4"><Button type="button" variant="outline" onClick={() => setShowCreateFileModal(false)} disabled={isSubmittingResource}>Cancelar</Button><Button type="submit" disabled={isSubmittingResource}>{isSubmittingResource ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Guardar</Button></DialogFooter>
              </form>
          </DialogContent>
       </Dialog>
    </div>
  );
}
