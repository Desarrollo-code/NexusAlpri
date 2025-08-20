// src/app/(app)/resources/page.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { EnterpriseResource as AppResourceType, User as AppUser, UserRole } from '@/types';
import { Search, ArchiveX, Loader2, AlertTriangle, FolderPlus, UploadCloud, Grid, List, ChevronRight, Users, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
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
import { UploadArea } from '@/components/ui/upload-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useTitle } from '@/contexts/title-context';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/security-log-utils';
import { Textarea } from '@/components/ui/textarea';
import { ResourceGridItem } from '@/components/resources/resource-grid-item';
import { ResourcePreviewModal } from '@/components/resources/resource-preview-modal';
import { useIsMobile } from '@/hooks/use-mobile';
import { uploadWithProgress } from '@/lib/upload-with-progress';


// --- Main Page Component ---
export default function ResourcesPage() {
  const { user, settings } = useAuth();
  const { toast } = useToast();
  const { setPageTitle } = useTitle();
  const isMobile = useIsMobile();

  const [allApiResources, setAllApiResources] = useState<AppResourceType[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; title: string }[]>([{ id: null, title: 'Biblioteca' }]);

  const [showCreateUpdateModal, setShowCreateUpdateModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [editingResource, setEditingResource] = useState<AppResourceType | null>(null);
  
  const [isSubmittingResource, setIsSubmittingResource] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceType, setNewResourceType] = useState<AppResourceType['type']>('DOCUMENT');
  const [newResourceCategory, setNewResourceCategory] = useState('');
  const [newResourceFile, setNewResourceFile] = useState<File | null>(null);
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newResourceDescription, setNewResourceDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [newResourcePin, setNewResourcePin] = useState('');
  const [removePin, setRemovePin] = useState(false);

  const [resourceToDelete, setResourceToDelete] = useState<AppResourceType | null>(null);
  const [isDeletingResource, setIsDeletingResource] = useState(false);
  
  const [selectedResource, setSelectedResource] = useState<AppResourceType | null>(null);

  useEffect(() => {
    setPageTitle('Biblioteca de Recursos');
  }, [setPageTitle]);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (currentFolderId) params.append('parentId', currentFolderId);
    
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
  }, [toast, currentFolderId]);

  const fetchAllUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users/list'); // Use the new endpoint
      if (!response.ok) return;
      const data = await response.json();
      setAllUsers(data.users.filter((u: AppUser) => u.id !== user?.id)); // Exclude self
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  }, [user?.id]);


  useEffect(() => {
    fetchResources();
    if (user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR') {
      fetchAllUsers();
    }
  }, [fetchResources, fetchAllUsers, user?.role]);

    const folders = useMemo(() => {
        return allApiResources
            .filter(r => r.type === 'FOLDER')
            .filter(r => {
                if (!searchTerm) return true;
                return r.title.toLowerCase().includes(searchTerm.toLowerCase());
            });
    }, [allApiResources, searchTerm]);

    const files = useMemo(() => {
        return allApiResources
            .filter(r => r.type !== 'FOLDER')
            .filter(r => {
                const matchesSearch = searchTerm ?
                    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.description?.toLowerCase().includes(searchTerm.toLowerCase())
                    : true;
                const matchesCategory = activeCategory === 'all' ? true : r.category === activeCategory;
                return matchesSearch && matchesCategory;
            });
    }, [allApiResources, searchTerm, activeCategory]);

  const resetForm = () => {
    setNewResourceTitle('');
    setNewResourceType('DOCUMENT');
    setNewResourceCategory('');
    setNewResourceFile(null);
    setNewResourceUrl('');
    setUploadProgress(0);
    setNewFolderName('');
    setNewResourceDescription('');
    setIsPublic(true);
    setSharedWithUserIds([]);
    setNewResourcePin('');
    setRemovePin(false);
    setEditingResource(null);
  };

  const handleOpenEditModal = (resource: AppResourceType) => {
    setEditingResource(resource);
    setNewResourceTitle(resource.title);
    setNewResourceType(resource.type);
    setNewResourceCategory(resource.category || '');
    setNewResourceUrl(resource.url || '');
    setNewResourceDescription(resource.description || '');
    setIsPublic(resource.ispublic);
    setSharedWithUserIds(resource.sharedWith?.map(u => u.id) || []);
    if (resource.type === 'FOLDER') {
        setShowCreateFolderModal(true);
    } else {
        setShowCreateUpdateModal(true);
    }
  };
  
  const handleOpenCreateFolderModal = () => {
    resetForm();
    setShowCreateFolderModal(true);
  };

  const handleOpenCreateFileModal = () => {
    resetForm();
    setShowCreateUpdateModal(true);
  };

  const handleCreateOrUpdateFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = editingResource ? newResourceTitle : newFolderName;
    if (!title.trim()) {
        toast({ title: "Error", description: "El nombre de la carpeta es obligatorio.", variant: "destructive" });
        return;
    }
    
    setIsSubmittingResource(true);
    const endpoint = editingResource ? `/api/resources/${editingResource.id}` : '/api/resources';
    const method = editingResource ? 'PUT' : 'POST';
    try {
        const payload = { 
            title, 
            type: 'FOLDER', 
            category: 'General',
            uploaderId: user?.id, 
            parentId: currentFolderId,
            description: newResourceDescription,
            isPublic,
            sharedWithUserIds: isPublic ? [] : sharedWithUserIds,
        };
        const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error((await response.json()).message || 'Failed to save folder');
        toast({ title: `Carpeta ${editingResource ? 'Actualizada' : 'Creada'}`, description: `La carpeta "${title}" ha sido guardada.` });
        setShowCreateFolderModal(false);
        resetForm();
        fetchResources();
    } catch (err) {
        toast({ title: "Error al guardar carpeta", description: (err as Error).message, variant: "destructive" });
    } finally {
        setIsSubmittingResource(false);
    }
  };


  const handleCreateOrUpdateFile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id || !newResourceTitle || !newResourceCategory || !newResourceType) {
        toast({ title: "Error", description: "Título, tipo y categoría son obligatorios.", variant: "destructive" });
        return;
    }

    let finalResourceUrl = editingResource?.url || newResourceUrl;

    if (newResourceType !== 'EXTERNAL_LINK' && newResourceType !== 'FOLDER' && newResourceFile) {
        setIsUploadingFile(true);
        setUploadProgress(0);
        setIsSubmittingResource(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', newResourceFile);
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
    } else if (newResourceType === 'EXTERNAL_LINK' && !finalResourceUrl) {
         toast({ title: "Error", description: "Por favor, introduce una URL para el enlace externo.", variant: "destructive" });
         return;
    }
    
    setIsSubmittingResource(true);
    const endpoint = editingResource ? `/api/resources/${editingResource.id}` : '/api/resources';
    const method = editingResource ? 'PUT' : 'POST';

    try {
      const payload = { 
          title: newResourceTitle, 
          type: newResourceType, 
          category: newResourceCategory, 
          url: finalResourceUrl, 
          uploaderId: user.id, 
          parentId: currentFolderId,
          description: newResourceDescription,
          isPublic,
          sharedWithUserIds: isPublic ? [] : sharedWithUserIds,
      };
      const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to save resource');
      
      const savedResource = await response.json();

      // Handle PIN management
      if (editingResource) {
          if (removePin) {
              await fetch(`/api/resources/${editingResource.id}/pin`, { method: 'DELETE' });
          } else if (newResourcePin) {
              await fetch(`/api/resources/${editingResource.id}/pin`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ pin: newResourcePin }),
              });
          }
      }
      
      toast({ title: `Recurso ${editingResource ? 'Actualizado' : 'Creado'}`, description: `El recurso "${newResourceTitle}" ha sido guardado.` });
      setShowCreateUpdateModal(false);
      resetForm();
      fetchResources();
    } catch (err) {
      toast({ title: `Error al ${editingResource ? 'actualizar' : 'crear'} recurso`, description: (err as Error).message, variant: "destructive" });
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
  
  const handleCategoryChange = (categoryName: string) => {
    setActiveCategory(categoryName);
  }

  const handleUserShareToggle = (userId: string, checked: boolean) => {
      setSharedWithUserIds(prev => checked ? [...prev, userId] : prev.filter(id => id !== userId));
  }

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));
  }, [allUsers, userSearch]);

  const allCategories = useMemo(() => ['all', ...(settings?.resourceCategories || [])], [settings]);
  
  const handleNavigateItem = (direction: 'next' | 'prev') => {
      const currentIndex = files.findIndex(f => f.id === selectedResource?.id);
      if (currentIndex === -1) return;

      const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      
      if (nextIndex >= 0 && nextIndex < files.length) {
          setSelectedResource(files[nextIndex]);
      }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-grow space-y-1">
           <div className="flex items-center text-sm text-muted-foreground flex-wrap">
            {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id || 'root'}>
                {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                <button 
                  onClick={() => handleBreadcrumbClick(crumb.id, index)} 
                  className={cn(
                      "hover:text-primary",
                      index === breadcrumbs.length - 1 ? "font-semibold text-foreground" : ""
                  )}
                >
                    {crumb.title}
                </button>
            </React.Fragment>
            ))}
          </div>
        </div>
        {(user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR') && (
        <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleOpenCreateFolderModal} className="w-full sm:w-auto">
                <FolderPlus className="mr-2 h-4 w-4"/> Crear Carpeta
            </Button>
            <Button onClick={handleOpenCreateFileModal} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
              <UploadCloud className="mr-2 h-4 w-4"/> Subir Recurso
            </Button>
        </div>
        )}
    </header>

      <div className="space-y-4">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Buscar en la carpeta actual..." 
                className="pl-10 h-11 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {files.length > 0 && (
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select value={activeCategory} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Categorías" />
                      </SelectTrigger>
                      <SelectContent>
                          {allCategories.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'Todas las Categorías' : c}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <div className="flex bg-muted rounded-md p-1">
                <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')} aria-label="Vista de cuadrícula"><Grid size={18} /></Button>
                <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')} aria-label="Vista de lista"><List size={18} /></Button>
              </div>
          </div>
        )}
      </div>
      
      <div className="flex-grow overflow-auto -mx-4 px-4 mt-4 thin-scrollbar">
          {isLoading ? (
              <div className="flex justify-center items-center h-full py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-destructive"><AlertTriangle className="h-8 w-8 mb-2" /><p className="font-semibold">{error}</p></div>
          ) : folders.length === 0 && files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
                  <ArchiveX className="h-16 w-16 mb-4 text-primary"/>
                  <h3 className="text-xl font-semibold text-foreground">{searchTerm ? 'No hay coincidencias' : 'Carpeta Vacía'}</h3>
                  <p>{searchTerm ? 'Prueba con otro término.' : 'Sube un archivo o crea una carpeta para empezar.'}</p>
              </div>
          ) : (
              <div className="space-y-8">
                  {folders.length > 0 && (
                      <section>
                          <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Carpetas</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                              {folders.map(item => <ResourceGridItem key={item.id} resource={item} onSelect={() => setSelectedResource(item)} onEdit={handleOpenEditModal} onDelete={() => setResourceToDelete(item)} onNavigate={handleNavigateFolder} />)}
                          </div>
                      </section>
                  )}
                  
                  {files.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Archivos</h2>
                        {viewMode === 'grid' ? (
                           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                              {files.map(item => <ResourceGridItem key={item.id} resource={item} onSelect={() => setSelectedResource(item)} onEdit={handleOpenEditModal} onDelete={() => setResourceToDelete(item)} onNavigate={handleNavigateFolder} />)}
                          </div>
                        ) : (
                          // Placeholder for future list view
                          <p>List view coming soon!</p>
                        )}
                    </section>
                  )}
              </div>
          )}
      </div>

      <ResourcePreviewModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
          onNavigate={handleNavigateItem}
      />
      
      <AlertDialog open={!!resourceToDelete} onOpenChange={(open) => !open && setResourceToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                <AlertDialogDescription>El recurso "<strong>{resourceToDelete?.title}</strong>" será eliminado permanentemente. {resourceToDelete?.type === 'FOLDER' && 'Todos los archivos dentro también serán eliminados.'}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteResource} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
       <Dialog open={showCreateUpdateModal} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setShowCreateUpdateModal(isOpen); }}>
          <DialogContent className="w-[95vw] max-w-lg rounded-lg max-h-[90vh] flex flex-col">
              <DialogHeader className="p-6 pb-0">
                  <DialogTitle>{editingResource ? 'Editar Recurso' : 'Subir Nuevo Recurso'}</DialogTitle>
                  <DialogDescription>Completa los detalles para {editingResource ? 'actualizar este recurso' : 'añadir un nuevo recurso a la biblioteca'}.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOrUpdateFile} id="create-update-form" className="flex-1 overflow-y-auto px-6 py-4 thin-scrollbar">
                  <div className="space-y-4">
                    <div className="space-y-1"><Label htmlFor="title">Título <span className="text-destructive">*</span></Label><Input id="title" name="title" value={newResourceTitle} onChange={(e) => setNewResourceTitle(e.target.value)} required disabled={isSubmittingResource} /></div>
                    <div className="space-y-1"><Label htmlFor="description">Descripción</Label><Textarea id="description" name="description" value={newResourceDescription} onChange={(e) => setNewResourceDescription(e.target.value)} disabled={isSubmittingResource} rows={3} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><Label htmlFor="type">Tipo <span className="text-destructive">*</span></Label><Select name="type" required value={newResourceType} onValueChange={(v) => setNewResourceType(v as any)} disabled={isSubmittingResource || !!editingResource}><SelectTrigger id="new-resource-type"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger><SelectContent><SelectItem value="DOCUMENT">Documento</SelectItem><SelectItem value="GUIDE">Guía</SelectItem><SelectItem value="VIDEO">Video</SelectItem><SelectItem value="EXTERNAL_LINK">Enlace Externo</SelectItem></SelectContent></Select></div>
                        <div className="space-y-1"><Label htmlFor="category">Categoría <span className="text-destructive">*</span></Label><Select name="category" required value={newResourceCategory} onValueChange={setNewResourceCategory} disabled={isSubmittingResource}><SelectTrigger id="new-resource-category"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger><SelectContent>{(settings?.resourceCategories || []).sort().map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    
                    {newResourceType === 'EXTERNAL_LINK' ? (
                       <div className="space-y-1">
                          <Label htmlFor="url">URL del Enlace Externo<span className="text-destructive">*</span></Label>
                          <Input id="url" name="url" type="url" placeholder="https://ejemplo.com" value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)} required disabled={isSubmittingResource} />
                        </div>
                    ) : newResourceType !== 'FOLDER' && !editingResource ? (
                      <div className="space-y-1">
                          <UploadArea onFileSelect={(file) => setNewResourceFile(file)} disabled={isSubmittingResource} />
                          {isUploadingFile && <Progress value={uploadProgress} className="mt-2" />}
                          {newResourceFile && <p className="text-xs text-center text-muted-foreground mt-1">Archivo seleccionado: {newResourceFile.name}</p>}
                      </div>
                    ) : null}
                     
                     <Separator />
                     <h3 className="text-base font-semibold">Control de Acceso</h3>
                     <div className="space-y-3 p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="is-public" className="flex items-center gap-2 cursor-pointer">{isPublic ? <Globe className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-destructive" />} {isPublic ? 'Público' : 'Privado'}</Label>
                            <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
                        </div>
                        {!isPublic && (
                            <div className="bg-background p-3 border rounded-lg">
                                <Input placeholder="Buscar usuarios para compartir..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="mb-2"/>
                                <ScrollArea className="h-32">
                                    <div className="space-y-2">
                                    {filteredUsers.map(u => (
                                        <div key={u.id} className="flex items-center space-x-3 p-1.5 rounded-md hover:bg-muted">
                                            <Checkbox id={`share-${u.id}`} checked={sharedWithUserIds.includes(u.id)} onCheckedChange={c => handleUserShareToggle(u.id, !!c)} />
                                            <Label htmlFor={`share-${u.id}`} className="flex items-center gap-2 font-normal cursor-pointer">
                                                <Avatar className="h-7 w-7"><AvatarImage src={u.avatar || undefined} /><AvatarFallback>{getInitials(u.name)}</AvatarFallback></Avatar>
                                                {u.name}
                                            </Label>
                                        </div>
                                    ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                    
                    {editingResource && (
                        <div className="space-y-3 p-3 border rounded-lg">
                            <Label htmlFor="pin" className="font-medium">PIN de Seguridad (Opcional)</Label>
                            <p className="text-xs text-muted-foreground">Establece un PIN de 4-8 dígitos para una capa extra de seguridad. Deja en blanco para no usar PIN.</p>
                            <Input id="pin" name="pin" type="text" maxLength={8} value={newResourcePin} onChange={e => setNewResourcePin(e.target.value.replace(/\D/g, ''))} disabled={isSubmittingResource || removePin} />
                            {editingResource.hasPin && (
                               <div className="flex items-center space-x-2">
                                    <Checkbox id="remove-pin" checked={removePin} onCheckedChange={(c) => setRemovePin(!!c)} />
                                    <Label htmlFor="remove-pin" className="text-sm font-normal text-destructive">Quitar PIN existente</Label>
                               </div>
                            )}
                        </div>
                    )}

                  </div>
              </form>
               <DialogFooter className="p-6 pt-2 flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"><Button type="button" variant="outline" onClick={() => setShowCreateUpdateModal(false)} disabled={isSubmittingResource}>Cancelar</Button><Button form="create-update-form" type="submit" disabled={isSubmittingResource}>{isSubmittingResource ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{editingResource ? 'Guardar Cambios' : 'Crear Recurso'}</Button></DialogFooter>
          </DialogContent>
       </Dialog>

      <Dialog open={showCreateFolderModal} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setShowCreateFolderModal(isOpen); }}>
          <DialogContent className="w-[95vw] max-w-md rounded-lg max-h-[90vh] flex flex-col">
              <DialogHeader className="p-6 pb-0">
                  <DialogTitle>{editingResource ? 'Editar Carpeta' : 'Crear Nueva Carpeta'}</DialogTitle>
                  <DialogDescription>Configura los detalles de la carpeta.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOrUpdateFolder} id="create-folder-form" className="flex-1 overflow-y-auto px-6 py-4 thin-scrollbar">
                  <div className="space-y-4">
                      <div className="space-y-1">
                          <Label htmlFor="folder-name">Nombre de la Carpeta <span className="text-destructive">*</span></Label>
                          <Input 
                              id="folder-name" 
                              name="folder-name" 
                              value={editingResource ? newResourceTitle : newFolderName} 
                              onChange={(e) => editingResource ? setNewResourceTitle(e.target.value) : setNewFolderName(e.target.value)} 
                              required 
                              disabled={isSubmittingResource}
                              placeholder="Ej: Documentos de Marketing"
                          />
                      </div>
                      <div className="space-y-1">
                          <Label htmlFor="folder-description">Descripción</Label>
                          <Textarea id="folder-description" name="folder-description" value={newResourceDescription} onChange={(e) => setNewResourceDescription(e.target.value)} disabled={isSubmittingResource} rows={3} />
                      </div>
                      <Separator/>
                      <h3 className="text-base font-semibold">Control de Acceso</h3>
                       <div className="space-y-3 p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                              <Label htmlFor="is-public-folder" className="flex items-center gap-2 cursor-pointer">{isPublic ? <Globe className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-destructive" />} {isPublic ? 'Público' : 'Privado'}</Label>
                              <Switch id="is-public-folder" checked={isPublic} onCheckedChange={setIsPublic} />
                          </div>
                          {!isPublic && (
                              <div className="bg-background p-3 border rounded-lg">
                                  <Input placeholder="Buscar usuarios para compartir..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="mb-2"/>
                                  <ScrollArea className="h-32">
                                      <div className="space-y-2">
                                      {filteredUsers.map(u => (
                                          <div key={u.id} className="flex items-center space-x-3 p-1.5 rounded-md hover:bg-muted">
                                              <Checkbox id={`share-folder-${u.id}`} checked={sharedWithUserIds.includes(u.id)} onCheckedChange={c => handleUserShareToggle(u.id, !!c)} />
                                              <Label htmlFor={`share-folder-${u.id}`} className="flex items-center gap-2 font-normal cursor-pointer">
                                                  <Avatar className="h-7 w-7"><AvatarImage src={u.avatar || undefined} /><AvatarFallback>{getInitials(u.name)}</AvatarFallback></Avatar>
                                                  {u.name}
                                              </Label>
                                          </div>
                                      ))}
                                      </div>
                                  </ScrollArea>
                              </div>
                          )}
                      </div>
                  </div>
              </form>
               <DialogFooter className="p-6 pt-2 flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateFolderModal(false)} disabled={isSubmittingResource}>Cancelar</Button>
                  <Button type="submit" form="create-folder-form" disabled={isSubmittingResource || !(editingResource ? newResourceTitle : newFolderName).trim()}>
                      {isSubmittingResource ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-2 h-4 w-4" />}
                      {editingResource ? 'Guardar Cambios' : 'Crear Carpeta'}
                  </Button>
              </DialogFooter>
          </DialogContent>
       </Dialog>
    </div>
  );
}
