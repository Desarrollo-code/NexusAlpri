// src/app/(app)/resources/page.tsx
'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { AppResourceType, ResourceStatus } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTitle } from '@/contexts/title-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, AlertTriangle, FolderPlus, UploadCloud, Grid, List, ChevronDown, Search, Folder as FolderIcon, Move, Trash2, FolderOpen, Filter } from 'lucide-react';
import { ResourceGridItem } from '@/components/resources/resource-grid-item';
import { ResourceListItem } from '@/components/resources/resource-list-item';
import { ResourcePreviewModal } from '@/components/resources/resource-preview-modal';
import { DndContext, type DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EmptyState } from '@/components/empty-state';
import { ResourceEditorModal } from '@/components/resources/resource-editor-modal';
import { FolderCreatorModal } from '@/components/resources/folder-creator-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import type { Prisma } from '@prisma/client';

const getFileTypeFilter = (fileType: string): Prisma.EnterpriseResourceWhereInput => {
    const mimeMap: Record<string, string[]> = {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        video: ['video/mp4', 'video/webm', 'video/ogg'],
        pdf: ['application/pdf'],
        doc: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        xls: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        ppt: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        zip: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    };
    const mimeTypes = mimeMap[fileType];
    if (mimeTypes) {
        return { fileType: { in: mimeTypes } };
    }
    if (fileType === 'other') {
        const allKnownMimes = Object.values(mimeMap).flat();
        return { fileType: { notIn: allKnownMimes } };
    }
    return {};
}

const FILE_TYPE_OPTIONS = [
  { value: "all", label: "Todos los tipos" },
  { value: "image", label: "Imágenes" },
  { value: "video", label: "Videos" },
  { value: "pdf", label: "PDFs" },
  { value: "doc", label: "Documentos de Word" },
  { value: "xls", label: "Hojas de cálculo" },
  { value: "ppt", label: "Presentaciones" },
  { value: "zip", label: "Archivos Comprimidos" },
  { value: "other", label: "Otros" },
];

// --- MAIN PAGE COMPONENT ---
export default function ResourcesPage() {
  const { user, isLoading: isAuthLoading, settings } = useAuth();
  const { setPageTitle } = useTitle();
  const { toast } = useToast();
  
  const [allApiResources, setAllApiResources] = useState<AppResourceType[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- State for searching and filtering ---
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [activeTab, setActiveTab] = useState<ResourceStatus>('ACTIVE');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // --- New Advanced Filters State ---
  const [filters, setFilters] = useState({
      dateRange: { from: undefined, to: undefined },
      fileType: 'all',
      hasPin: false,
      hasExpiry: false,
  });

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; title: string }[]>([{ id: null, title: 'Principal' }]);
  const [selectedResource, setSelectedResource] = useState<AppResourceType | null>(null);
  const [resourceToEdit, setResourceToEdit] = useState<AppResourceType | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<AppResourceType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFolderCreatorOpen, setIsFolderCreatorOpen] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  const { setNodeRef: setRootDroppableRef, isOver: isOverRoot } = useDroppable({ id: 'root' });

  useEffect(() => {
    setPageTitle('Biblioteca de Recursos');
  }, [setPageTitle]);

  const fetchResources = useCallback(async () => {
    if (isAuthLoading) return;
    setIsLoadingData(true);
    setError(null);
    
    const params = new URLSearchParams({ status: activeTab });
    if (currentFolderId) params.append('parentId', currentFolderId);
    if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
    
    // Append advanced filters to the request
    if (filters.dateRange.from) params.append('startDate', filters.dateRange.from.toISOString());
    if (filters.dateRange.to) params.append('endDate', filters.dateRange.to.toISOString());
    if (filters.fileType !== 'all') params.append('fileType', filters.fileType);
    if (filters.hasPin) params.append('hasPin', 'true');
    if (filters.hasExpiry) params.append('hasExpiry', 'true');
    
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
  }, [isAuthLoading, activeTab, currentFolderId, debouncedSearchTerm, filters]);

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
       <p className="text-muted-foreground">Gestiona y comparte documentos importantes, guías y materiales de formación para toda la organización.</p>
       <Card className="p-4 bg-card shadow-sm">
             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="relative w-full flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Buscar en la carpeta actual..." className="pl-10 h-10 text-base rounded-md" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                 <div className="flex items-center gap-2 w-full md:w-auto">
                    <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="outline" className="h-10 flex-grow md:flex-none">
                             <Filter className="mr-2 h-4 w-4"/>
                             Filtros
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-screen max-w-sm p-4" align="end">
                           <div className="space-y-4">
                              <h4 className="font-medium text-center">Filtros Avanzados</h4>
                              <div className="space-y-2"><Label>Fecha de Subida</Label><DateRangePicker date={filters.dateRange} onDateChange={(range) => setFilters(f => ({...f, dateRange: range || {from: undefined, to: undefined}}))} /></div>
                              <div className="space-y-2"><Label>Tipo de Archivo</Label><Select value={filters.fileType} onValueChange={(v) => setFilters(f => ({...f, fileType: v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{FILE_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select></div>
                              <Separator/>
                              <div className="flex items-center justify-between"><Label htmlFor="has-pin">Protegido con PIN</Label><Switch id="has-pin" checked={filters.hasPin} onCheckedChange={(c) => setFilters(f => ({...f, hasPin: c}))} /></div>
                              <div className="flex items-center justify-between"><Label htmlFor="has-expiry">Tiene Vencimiento</Label><Switch id="has-expiry" checked={filters.hasExpiry} onCheckedChange={(c) => setFilters(f => ({...f, hasExpiry: c}))}/></div>
                           </div>
                        </PopoverContent>
                    </Popover>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button className="h-10 flex-grow md:flex-none">
                                + Nuevo <ChevronDown className="ml-2 h-4 w-4"/>
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
            <ol ref={setRootDroppableRef} className={cn("flex items-center gap-1.5 text-sm font-medium text-muted-foreground p-2 rounded-lg", isOverRoot && "bg-primary/20")}>
                {breadcrumbs.map((crumb, index) => (
                    <li key={crumb.id || 'root'} className="flex items-center gap-1.5">
                        <button onClick={() => handleBreadcrumbClick(crumb.id, index)} disabled={index === breadcrumbs.length - 1} className={cn("hover:text-primary disabled:hover:text-muted-foreground disabled:cursor-default", index === breadcrumbs.length - 1 && "text-foreground font-semibold")}>{crumb.title}</button>
                        {index < breadcrumbs.length - 1 && <ChevronDown className="h-4 w-4 -rotate-90" />}
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
                                <div className="space-y-1">
                                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 border-b text-xs font-medium text-muted-foreground">
                                        <div className="col-span-5 flex items-center gap-2">Nombre</div>
                                        <div className="col-span-2 flex items-center gap-2">Propietario</div>
                                        <div className="col-span-2 flex items-center gap-2">Categoría</div>
                                        <div className="col-span-2 flex items-center gap-2">Fecha</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                    {files.map(res => <ResourceListItem key={res.id} resource={res} onSelect={() => setSelectedResource(res)} onEdit={setResourceToEdit} onDelete={setResourceToDelete} onRestore={handleRestore} />)}
                                </div>
                            )}
                        </section>
                    )}
                    {folders.length === 0 && files.length === 0 && (
                         <EmptyState 
                            icon={FolderOpen} 
                            title={debouncedSearchTerm || filters.fileType !== 'all' || filters.hasPin || filters.hasExpiry ? "No se encontraron resultados" : "Esta carpeta está vacía"}
                            description={debouncedSearchTerm || filters.fileType !== 'all' || filters.hasPin || filters.hasExpiry ? "Intenta con otros filtros de búsqueda." : "Sube un archivo o crea una nueva carpeta para empezar."}
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
