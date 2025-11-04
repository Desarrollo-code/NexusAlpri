// src/app/(app)/resources/page.tsx
'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { AppResourceType, ResourceStatus } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTitle } from '@/contexts/title-context';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, AlertTriangle, FolderPlus, UploadCloud, Grid, List, ChevronRight, Search, Folder as FolderIcon, Move, Trash2, FolderOpen } from 'lucide-react';
import { ResourceGridItem } from '@/components/resources/resource-grid-item';
import { ResourceListItem } from '@/components/resources/resource-list-item';
import { ResourcePreviewModal } from '@/components/resources/resource-preview-modal';
import { DndContext, type DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/empty-state';
import { ResourceEditorModal } from '@/components/resources/resource-editor-modal';
import { FolderCreatorModal } from '@/components/resources/folder-creator-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// --- MAIN PAGE COMPONENT ---
export default function ResourcesPage() {
  const { user, isLoading: isAuthLoading, settings } = useAuth();
  const { setPageTitle } = useTitle();
  const { toast } = useToast();
  
  const [allApiResources, setAllApiResources] = useState<AppResourceType[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [activeTab, setActiveTab] = useState<ResourceStatus>('ACTIVE');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; title: string }[]>([{ id: null, title: 'Mi Nube' }]);
  const [selectedResource, setSelectedResource] = useState<AppResourceType | null>(null);
  const [resourceToEdit, setResourceToEdit] = useState<AppResourceType | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<AppResourceType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFolderCreatorOpen, setIsFolderCreatorOpen] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);


  useEffect(() => {
    setPageTitle('Mi Nube');
  }, [setPageTitle]);

  const fetchResources = useCallback(async () => {
    if (isAuthLoading) return;
    setIsLoadingData(true);
    setError(null);
    
    const params = new URLSearchParams({ status: activeTab });
    if (currentFolderId) params.append('parentId', currentFolderId);
    if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
    
    try {
      const response = await fetch(`/api/resources?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch resources');
      const data = await response.json();
      setAllApiResources(data.resources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthLoading, activeTab, currentFolderId, debouncedSearchTerm]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const folders = useMemo(() => allApiResources.filter(r => r.type === 'FOLDER'), [allApiResources]);
  const files = useMemo(() => allApiResources.filter(r => r.type !== 'FOLDER'), [allApiResources]);

  const handleNavigateFolder = (resource: AppResourceType) => {
    if (resource.type === 'FOLDER') {
        setCurrentFolderId(resource.id);
        setBreadcrumbs(prev => [...prev, { id: resource.id, title: resource.title }]);
    }
  };

  const handleBreadcrumbClick = (folderId: string | null, index: number) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !active) return;
    const resourceToMove = active.data.current?.resource;
    const targetFolderId = over.id as string;
    
    if (resourceToMove && targetFolderId !== resourceToMove.id && targetFolderId !== resourceToMove.parentId) {
      try {
        await fetch(`/api/resources/${resourceToMove.id}/move`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parentId: targetFolderId === 'root' ? null : targetFolderId })
        });
        toast({ title: 'Recurso Movido', description: `Se movió "${resourceToMove.title}" correctamente.`});
        fetchResources();
      } catch(e) {
          toast({ title: 'Error', description: 'No se pudo mover el recurso.', variant: 'destructive'});
      }
    }
  };

  const handleResourceSave = () => {
    setResourceToEdit(null);
    setIsFolderCreatorOpen(false);
    setIsUploaderOpen(false);
    fetchResources();
  };

  const confirmDelete = async () => {
    if (!resourceToDelete) return;
    setIsDeleting(true);
    try {
        const res = await fetch(`/api/resources/${resourceToDelete.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error((await res.json()).message || 'No se pudo eliminar el recurso.');
        toast({ title: "Recurso eliminado" });
        fetchResources();
    } catch(err) {
        toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
        setResourceToDelete(null);
        setIsDeleting(false);
    }
  };

  const handleRestore = async (resource: AppResourceType) => {
    try {
        const res = await fetch(`/api/resources/${resource.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ACTIVE' })
        });
        if(!res.ok) throw new Error("No se pudo restaurar el recurso.");
        toast({ title: "Recurso Restaurado" });
        fetchResources();
    } catch(err) {
        toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  }
    
  if (isAuthLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }
  
  return (
    <DndContext onDragEnd={handleDragEnd} sensors={useSensors(useSensor(MouseSensor), useSensor(TouchSensor))}>
    <div className="space-y-6">
        <Card className="p-4 bg-card shadow-sm">
             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="relative w-full flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Buscar en la carpeta actual..." className="pl-10 h-10 text-base rounded-md" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                 <div className="flex items-center gap-2 w-full md:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button className="h-10 flex-grow md:flex-none">
                                + Nuevo <ChevronRight className="ml-2 h-4 w-4 -rotate-90"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setIsFolderCreatorOpen(true)}><FolderIcon className="mr-2 h-4 w-4"/>Nueva Carpeta</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setIsUploaderOpen(true)}><UploadCloud className="mr-2 h-4 w-4"/>Subir Archivo</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                     <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                         <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
                        <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}><Grid className="h-4 w-4"/></Button>
                    </div>
                </div>
            </div>
        </Card>

        <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                {breadcrumbs.map((crumb, index) => (
                    <li key={crumb.id || 'root'} className="flex items-center gap-1.5">
                        <button onClick={() => handleBreadcrumbClick(crumb.id, index)} disabled={index === breadcrumbs.length - 1} className={cn("hover:text-primary disabled:hover:text-muted-foreground disabled:cursor-default", index === breadcrumbs.length - 1 && "text-foreground font-semibold")}>{crumb.title}</button>
                        {index < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4" />}
                    </li>
                ))}
            </ol>
        </nav>
        
        <div>
            {isLoadingData ? (
                <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : error ? (
                <div className="text-center py-10"><AlertTriangle className="mx-auto h-8 w-8 text-destructive" /><p className="mt-2 font-semibold text-destructive">{error}</p></div>
            ) : (
                <div className="space-y-8">
                    {folders.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold mb-3">Carpetas</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {folders.map(res => <ResourceGridItem key={res.id} resource={res} isFolder={true} onNavigate={handleNavigateFolder} onEdit={setResourceToEdit} onDelete={setResourceToDelete} onRestore={handleRestore} onSelect={() => {}}/>)}
                            </div>
                        </section>
                    )}
                    {files.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold mb-3">Archivos</h3>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {files.map(res => <ResourceGridItem key={res.id} resource={res} isFolder={false} onSelect={() => setSelectedResource(res)} onEdit={setResourceToEdit} onDelete={setResourceToDelete} onRestore={handleRestore} onNavigate={() => {}} />)}
                                </div>
                            ) : (
                                <Card>
                                   <div className="divide-y">
                                    {files.map(res => <ResourceListItem key={res.id} resource={res} onSelect={() => setSelectedResource(res)} onEdit={setResourceToEdit} onDelete={setResourceToDelete} onRestore={handleRestore} />)}
                                   </div>
                                </Card>
                            )}
                        </section>
                    )}
                    {folders.length === 0 && files.length === 0 && (
                         <EmptyState 
                            icon={FolderOpen} 
                            title={searchTerm ? "No se encontraron resultados" : "Esta carpeta está vacía"}
                            description={searchTerm ? "Intenta con otro término de búsqueda." : "Sube un archivo o crea una nueva carpeta para empezar."}
                            imageUrl={settings?.emptyStateResourcesUrl}
                         />
                    )}
                </div>
            )}
        </div>

         <ResourcePreviewModal
            resource={selectedResource}
            onClose={() => setSelectedResource(null)}
            onNavigate={(dir) => {}}
        />
        
        <ResourceEditorModal
            isOpen={isUploaderOpen || !!resourceToEdit}
            onClose={() => { setResourceToEdit(null); setIsUploaderOpen(false); }}
            resource={resourceToEdit}
            parentId={currentFolderId}
            onSave={handleResourceSave}
        />

        <FolderCreatorModal
             isOpen={isFolderCreatorOpen}
             onClose={() => setIsFolderCreatorOpen(false)}
             parentId={currentFolderId}
             onSave={handleResourceSave}
        />

         <AlertDialog open={!!resourceToDelete} onOpenChange={(open) => !open && setResourceToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                    <AlertDialogDescription>
                        El recurso "<strong>{resourceToDelete?.title}</strong>" será eliminado permanentemente. Si es una carpeta, debe estar vacía. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className={cn(buttonVariants({ variant: "destructive" }))}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        <Trash2 className="mr-2 h-4 w-4"/>Sí, eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
    </DndContext>
  );
}
