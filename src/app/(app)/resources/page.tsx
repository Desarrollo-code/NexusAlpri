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
import { Loader2, AlertTriangle, FolderPlus, UploadCloud, Grid, List, ChevronRight, ChevronDown, Search, Folder as FolderIcon, Image as ImageIcon, Video, Archive, Plus, ListFilter, FileText } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from '@/components/ui/separator';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';

// --- Sub-components for Page ---

const Sidebar = ({ stats, totalSize, totalFiles, user }: { stats: any[], totalSize: number, totalFiles: number, user: any }) => {
    const animatedTotalFiles = useAnimatedCounter(totalFiles, 0, 1500);

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    const totalStorageFormatted = formatBytes(totalSize);
    const storagePercentage = totalSize > 0 ? (totalSize / (5 * 1024 * 1024 * 1024)) * 100 : 0; // Assuming 5GB limit

    const getIconForType = (type: string) => {
        const map: Record<string, React.ElementType> = {
            'Images': ImageIcon,
            'Videos': Video,
            'Documents': FileText,
            'Archives': Archive,
            'Other': FileText,
        };
        return map[type] || FileText;
    };

    return (
        <aside className="hidden lg:block lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Archivos Recientes</CardTitle>
                </CardHeader>
                 <CardContent>
                    {stats.length > 0 ? (
                        <div className="space-y-3">
                            {stats.map((file, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                        {React.createElement(getIconForType(file.type), { className: "h-5 w-5 text-muted-foreground" })}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="text-sm font-medium truncate">{file.title}</p>
                                        <p className="text-xs text-muted-foreground">Subido por {file.uploaderName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center">No hay archivos recientes.</p>
                    )}
                 </CardContent>
            </Card>
        </aside>
    );
}


// --- Main Page Component ---
export default function ResourcesPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { setPageTitle } = useTitle();
  const { toast } = useToast();
  
  const [allApiResources, setAllApiResources] = useState<AppResourceType[]>([]);
  const [stats, setStats] = useState<{ storageStats: any[], categoryCounts: any, recentFiles: any[]}>({ storageStats: [], categoryCounts: {}, recentFiles: [] });
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
    
    const params = new URLSearchParams({ status: activeTab, stats: 'true' });
    if (currentFolderId) params.append('parentId', currentFolderId);
    if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
    
    try {
      const response = await fetch(`/api/resources?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch resources');
      const data = await response.json();
      setAllApiResources(data.resources || []);
      setStats({
          storageStats: data.storageStats || [],
          categoryCounts: data.categoryCounts || {},
          recentFiles: data.recentFiles || [],
      });
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
    
  const totalStorage = stats.storageStats.reduce((acc, curr) => acc + curr.size, 0);
  const totalFiles = stats.storageStats.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <DndContext onDragEnd={handleDragEnd} sensors={useSensors(useSensor(MouseSensor), useSensor(TouchSensor))}>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
            <div className="space-y-4">
                <div className="relative">
                     <div className="flex items-center justify-between gap-4 p-2 rounded-lg bg-card border">
                         <div className="relative flex-grow">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                             <Input placeholder="Buscar en mi nube..." className="pl-10 h-10 text-base rounded-md border-0 focus-visible:ring-0 focus-visible:ring-offset-0" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                         </div>
                         <div className="flex items-center gap-2">
                             <RadioGroup value={activeTab} onValueChange={(v) => setActiveTab(v as ResourceStatus)} className="flex items-center gap-1 p-1 rounded-lg bg-green-100 dark:bg-green-900/20">
                                 <RadioGroupItem value="ACTIVE" id="status-active" className="sr-only"/>
                                 <Label htmlFor="status-active" className={cn("px-3 py-1.5 text-sm font-medium cursor-pointer rounded-md", activeTab === 'ACTIVE' && "bg-white shadow")}>Activo</Label>
                                 <RadioGroupItem value="ARCHIVED" id="status-archived" className="sr-only"/>
                                 <Label htmlFor="status-archived" className={cn("px-3 py-1.5 text-sm font-medium cursor-pointer rounded-md", activeTab === 'ARCHIVED' && "bg-white shadow")}>Archivado</Label>
                             </RadioGroup>
                             <Separator orientation="vertical" className="h-6 mx-1"/>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                   <Button className="bg-slate-800 text-white hover:bg-slate-700 h-9">
                                        <PlusCircle className="mr-2 h-4 w-4"/> Nuevo <ChevronDown className="ml-2 h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => setIsFolderCreatorOpen(true)}><FolderIcon className="mr-2 h-4 w-4"/>Nueva Carpeta</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setIsUploaderOpen(true)}><UploadCloud className="mr-2 h-4 w-4"/>Subir Archivo</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-200 dark:bg-gray-800">
                                <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
                                <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('grid')}><Grid className="h-4 w-4"/></Button>
                            </div>
                         </div>
                     </div>
                </div>
            </div>

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
        <Sidebar stats={stats.recentFiles} totalSize={totalStorage} totalFiles={totalFiles} user={user}/>
    </div>
    </DndContext>
  );
}
    
    