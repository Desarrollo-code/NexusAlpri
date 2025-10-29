// src/app/(app)/resources/page.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { AppResourceType, ResourceStatus } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTitle } from '@/contexts/title-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, FolderPlus, UploadCloud, Grid, List, ChevronRight, ChevronDown, Search, Folder as FolderIcon, Image as ImageIcon, Video, Archive, Plus, ListFilter } from 'lucide-react';
import { DecorativeFolder } from '@/components/resources/decorative-folder';
import { ResourceGridItem } from '@/components/resources/resource-grid-item';
import { ResourceListItem } from '@/components/resources/resource-list-item';
import { ResourcePreviewModal } from '@/components/resources/resource-preview-modal';
import { useIsMobile } from '@/hooks/use-mobile';
import { DndContext, type DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDebounce } from '@/hooks/use-debounce';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const Sidebar = ({ stats, totalSize, totalFiles, user }: { stats: any[], totalSize: number, totalFiles: number, user: any }) => {
    // This component remains unchanged from the previous implementation
    return null; // Placeholder as it's not the focus of the change
}

// --- Main Page Component ---
export default function ResourcesPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
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
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; title: string }[]>([{ id: null, title: 'Biblioteca' }]);
  const [selectedResource, setSelectedResource] = useState<AppResourceType | null>(null);
  const [resourceToEdit, setResourceToEdit] = useState<AppResourceType | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<AppResourceType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFolderCreatorOpen, setIsFolderCreatorOpen] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);


  useEffect(() => {
    setPageTitle('Mi Nube');
  }, [setPageTitle]);

  const fetchResourcesAndStats = useCallback(async () => {
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
    fetchResourcesAndStats();
  }, [fetchResourcesAndStats]);

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
        fetchResourcesAndStats();
      } catch(e) {
          toast({ title: 'Error', description: 'No se pudo mover el recurso.', variant: 'destructive'});
      }
    }
  };
    
  if (isAuthLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  const { isOver: isRootOver, setNodeRef: rootDroppableRef } = useDroppable({
        id: 'root',
        disabled: !!currentFolderId,
    });

  return (
    <DndContext onDragEnd={handleDragEnd} sensors={useSensors(useSensor(MouseSensor), useSensor(TouchSensor))}>
    <div className="space-y-6">
       <div className="flex items-center justify-between flex-wrap gap-4">
            <RadioGroup 
                value={activeTab} 
                onValueChange={(v) => setActiveTab(v as ResourceStatus)} 
                className="flex items-center p-1 bg-green-100 dark:bg-green-900/30 rounded-full"
            >
                <RadioGroupItem value="ACTIVE" id="status-active" className="sr-only" />
                <Label 
                    htmlFor="status-active" 
                    className={cn(
                        "px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors",
                        activeTab === 'ACTIVE' ? 'bg-white text-green-800 shadow-sm' : 'text-green-700/80'
                    )}
                >
                   Activo
                </Label>
                <RadioGroupItem value="ARCHIVED" id="status-archived" className="sr-only" />
                <Label 
                    htmlFor="status-archived" 
                    className={cn(
                        "px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors",
                        activeTab === 'ARCHIVED' ? 'bg-white text-green-800 shadow-sm' : 'text-green-700/80'
                    )}
                >
                    Archivado
                </Label>
            </RadioGroup>

            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="bg-slate-800 text-white hover:bg-slate-700">
                            <Plus className="mr-2 h-4 w-4"/>
                            Nuevo
                            <ChevronDown className="ml-2 h-4 w-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <DropdownMenuItem onSelect={() => setIsFolderCreatorOpen(true)}><FolderIcon className="mr-2 h-4 w-4"/>Nueva Carpeta</DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => setIsUploaderOpen(true)}><UploadCloud className="mr-2 h-4 w-4"/>Subir Archivo</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Separator orientation="vertical" className="h-6 mx-1" />

                <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}><Grid className="h-4 w-4"/></Button>
                </div>
            </div>
        </div>
        
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Buscar en mi nube..." className="pl-10 h-11 text-base rounded-full shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full">
                <ListFilter className="h-4 w-4"/>
            </Button>
        </div>
        
         <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                {breadcrumbs.map((crumb, index) => (
                    <li key={crumb.id || 'root'} className="flex items-center gap-1.5">
                        <button
                            onClick={() => handleBreadcrumbClick(crumb.id, index)}
                            disabled={index === breadcrumbs.length - 1}
                            className={cn(
                                "hover:text-primary disabled:hover:text-muted-foreground disabled:cursor-default",
                                index === breadcrumbs.length - 1 && "text-foreground font-semibold"
                            )}
                        >
                            {crumb.title}
                        </button>
                        {index < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4" />}
                    </li>
                ))}
            </ol>
        </nav>
        
        <div ref={rootDroppableRef}>
             {isLoadingData ? (
                <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : error ? (
                <div className="text-center py-10"><AlertTriangle className="mx-auto h-8 w-8 text-destructive" /><p className="mt-2 font-semibold text-destructive">{error}</p></div>
            ) : (
                <div className="space-y-8">
                     {folders.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold mb-3">Carpetas</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {folders.map(res => <ResourceGridItem key={res.id} resource={res} isFolder={true} onNavigate={handleNavigateFolder} onEdit={setResourceToEdit} onDelete={setResourceToDelete} onRestore={() => {}} onSelect={() => {}}/>)}
                            </div>
                        </section>
                     )}
                     {files.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold mb-3">Archivos</h3>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {files.map(res => <ResourceGridItem key={res.id} resource={res} isFolder={false} onSelect={() => setSelectedResource(res)} onEdit={setResourceToEdit} onDelete={setResourceToDelete} onRestore={() => {}} onNavigate={() => {}} />)}
                                </div>
                            ) : (
                                <div className="border rounded-lg bg-card">
                                    {files.map(res => <ResourceListItem key={res.id} resource={res} onSelect={() => setSelectedResource(res)} onEdit={setResourceToEdit} onDelete={setResourceToDelete} onRestore={() => {}} />)}
                                </div>
                            )}
                        </section>
                     )}
                     {folders.length === 0 && files.length === 0 && (
                         <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                            <p>Esta carpeta está vacía.</p>
                         </div>
                     )}
                </div>
            )}
        </div>

        <ResourcePreviewModal
              resource={selectedResource}
              onClose={() => setSelectedResource(null)}
              onNavigate={(dir) => { /* Logic to navigate between files */ }}
          />
    </div>
    </DndContext>
  );
}
    
