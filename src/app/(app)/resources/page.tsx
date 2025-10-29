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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
                    <CardTitle className="text-lg">Hola, {user?.name.split(' ')[0]}!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Bienvenido a tu nube personal.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Almacenamiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="w-full flex justify-center">
                        {/* A simple placeholder for a donut chart */}
                         <div className="relative h-32 w-32">
                           <svg viewBox="0 0 36 36" className="h-full w-full">
                             <path className="text-muted/30" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                             <path className="text-primary" stroke="currentColor" strokeWidth="3" strokeDasharray={`${storagePercentage}, 100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                           </svg>
                           <div className="absolute inset-0 flex flex-col items-center justify-center">
                               <span className="text-2xl font-bold">{Math.round(storagePercentage)}%</span>
                               <span className="text-xs text-muted-foreground">usado</span>
                           </div>
                         </div>
                     </div>
                     <p className="text-center text-sm text-muted-foreground">{totalStorageFormatted} de 5 GB</p>
                    <Separator/>
                    <div className="space-y-3">
                        {stats.map(stat => {
                            const Icon = getIconForType(stat.type);
                            return (
                                <div key={stat.type} className="flex items-center text-sm">
                                    <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span className="flex-grow">{stat.type}</span>
                                    <span className="font-semibold">{formatBytes(stat.size)}</span>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </aside>
    );
}

const SummaryCard = ({ title, count, icon: Icon, filterType, className }: { title: string, count: number, icon: React.ElementType, filterType: string, className?: string }) => {
    const animatedCount = useAnimatedCounter(count || 0);

    return (
        <Card 
            className={cn("p-4 flex items-center gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer", className)}
            onClick={() => { /* Lógica para filtrar */}}
        >
            <div className="p-3 rounded-lg bg-black/5 dark:bg-white/10">
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{animatedCount} archivos</p>
            </div>
        </Card>
    );
};


// --- Main Page Component ---
export default function ResourcesPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { setPageTitle } = useTitle();
  const { toast } = useToast();
  
  const [allApiResources, setAllApiResources = useState<AppResourceType[]>([]);
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <RadioGroup value={activeTab} onValueChange={(v) => setActiveTab(v as ResourceStatus)} className="flex items-center p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <Label htmlFor="status-active" className={cn("px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors", activeTab === 'ACTIVE' ? 'bg-white text-green-800 shadow-sm' : 'text-green-700/80')}>Activo</Label>
                    <RadioGroupItem value="ACTIVE" id="status-active" className="sr-only" />
                    <Label htmlFor="status-archived" className={cn("px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors", activeTab === 'ARCHIVED' ? 'bg-white text-green-800 shadow-sm' : 'text-green-700/80')}>Archivado</Label>
                    <RadioGroupItem value="ARCHIVED" id="status-archived" className="sr-only" />
                </RadioGroup>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="bg-slate-800 text-white hover:bg-slate-700">
                                <Plus className="mr-2 h-4 w-4"/> Nuevo <ChevronDown className="ml-2 h-4 w-4"/>
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
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"><ListFilter className="h-4 w-4"/></Button>
            </div>
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
               <SummaryCard title="Todas las Imágenes" count={stats.categoryCounts['Images'] || 0} icon={ImageIcon} filterType="Images" className="bg-indigo-100/60 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200" />
               <SummaryCard title="Todos los Documentos" count={stats.categoryCounts['Documents'] || 0} icon={FileText} filterType="Documents" className="bg-sky-100/60 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200" />
               <SummaryCard title="Todos los Videos" count={stats.categoryCounts['Videos'] || 0} icon={Video} filterType="Videos" className="bg-rose-100/60 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200" />
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
        <Sidebar stats={stats.storageStats} totalSize={totalStorage} totalFiles={totalFiles} user={user}/>
    </div>
    </DndContext>
  );
}
    
    