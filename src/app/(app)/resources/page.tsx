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
import { Loader2, AlertTriangle, FolderPlus, UploadCloud, Grid, List, ChevronDown, Search, Folder as FolderIcon, Move, Trash2, FolderOpen, Filter, ChevronRight, Pin, ListVideo, FileText, Image as ImageIcon, Video as VideoIcon, FileQuestion, Archive as ZipIcon, PlusCircle, Edit, ArrowUpDown, FolderInput, Clock } from 'lucide-react';
import { ResourceGridItem } from '@/components/resources/resource-grid-item';
import { ResourceListItem } from '@/components/resources/resource-list-item';
import { DndContext, type DragEndEvent, MouseSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EmptyState } from '@/components/empty-state';
import { ResourceEditorModal } from '@/components/resources/resource-editor-modal';
import { FolderEditorModal } from '@/components/resources/folder-editor-modal';
import { PlaylistCreatorModal } from '@/components/resources/playlist-creator-modal';
import { FolderTree } from '@/components/resources/folder-tree';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import { VideoPlaylistView } from '@/components/resources/video-playlist-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { AnimatePresence, motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { startOfDay, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useDroppable } from '@dnd-kit/core';
import { Separator } from '@/components/ui/separator';
import { ResourcePreviewModal } from '@/components/resources/resource-preview-modal';
import { MoveResourceModal } from '@/components/resources/move-resource-modal';
import { useRecentResources } from '@/hooks/use-recent-resources';
import { ResourceEmptyState } from '@/components/resources/resource-empty-state';
import { QuickActionsFAB } from '@/components/resources/quick-actions-fab';


// --- MAIN PAGE COMPONENT ---
export default function ResourcesPage() {
    const { user, settings } = useAuth();
    const { setPageTitle } = useTitle();
    const { toast } = useToast();
    const { recentIds, addRecentResource } = useRecentResources();

    const [allApiResources, setAllApiResources] = useState<AppResourceType[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [resourceView, setResourceView] = useState<'all' | 'favorites' | 'recent'>('all');

    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [currentFolder, setCurrentFolder] = useState<AppResourceType | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; title: string }[]>([{ id: null, title: 'Principal' }]);

    const [isPlaylistView, setIsPlaylistView] = useState(false);

    const [resourceToEdit, setResourceToEdit] = useState<AppResourceType | null>(null);
    const [resourceToDelete, setResourceToDelete] = useState<AppResourceType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // New Folder Editor State
    const [folderToEdit, setFolderToEdit] = useState<AppResourceType | null>(null);
    const [isFolderEditorOpen, setIsFolderEditorOpen] = useState(false);

    const [isPlaylistCreatorOpen, setIsPlaylistCreatorOpen] = useState(false);
    const [playlistToEdit, setPlaylistToEdit] = useState<AppResourceType | null>(null);
    const [isUploaderOpen, setIsUploaderOpen] = useState(false);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [fileType, setFileType] = useState('all');
    const [hasPin, setHasPin] = useState(false);
    const [hasExpiry, setHasExpiry] = useState(false);
    const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

    const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const [previewingResource, setPreviewingResource] = useState<AppResourceType | null>(null);

    const { setNodeRef: setRootDroppableRef, isOver: isOverRoot } = useDroppable({ id: 'root' });

    useEffect(() => {
        setPageTitle('Biblioteca de Recursos');
    }, [setPageTitle]);

    const canManage = useMemo(() => user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR', [user]);
    const [tagsFilter, setTagsFilter] = useState('');
    const activeFilterCount = [dateRange, fileType !== 'all', hasPin, hasExpiry, tagsFilter].filter(Boolean).length;

    const fetchResources = useCallback(async () => {
        if (!user) return;
        setIsLoadingData(true);
        setError(null);
        setIsPlaylistView(false);

        const params = new URLSearchParams({ status: 'ACTIVE' });
        if (currentFolderId) params.append('parentId', currentFolderId);
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
        if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());
        if (fileType !== 'all') params.append('fileType', fileType);
        if (hasPin) params.append('hasPin', 'true');
        if (hasExpiry) params.append('hasExpiry', 'true');
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);

        try {
            const response = await fetch(`/api/resources?${params.toString()}`, { cache: 'no-store' });
            if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch resources');
            const data = await response.json();
            const fetchedResources: AppResourceType[] = data.resources || [];
            setAllApiResources(fetchedResources);

            if (currentFolderId) {
                const folderDataRes = await fetch(`/api/resources/${currentFolderId}`);
                if (!folderDataRes.ok) throw new Error('No se pudo cargar la carpeta actual.');
                const folderData = await folderDataRes.json();
                setCurrentFolder(folderData);
                if (folderData.type === 'VIDEO_PLAYLIST') {
                    setIsPlaylistView(true);
                }
            } else {
                setCurrentFolder(null);
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido';
            setError(errorMessage);
            console.error("[ResourcesPage:fetchResources] Error cargando recursos:", err);
        } finally {
            setIsLoadingData(false);
        }
    }, [user, currentFolderId, debouncedSearchTerm, dateRange, fileType, hasPin, hasExpiry, sortBy, sortOrder]);

    useEffect(() => {
        fetchResources();
        setSelectedIds(new Set());
    }, [fetchResources]);

    // Filter resources based on active view
    const filteredResources = useMemo(() => {
        if (resourceView === 'favorites') {
            return allApiResources.filter(r => r.isPinned);
        } else if (resourceView === 'recent') {
            // Filter to only show resources in recentIds, maintaining order
            const recentSet = new Set(recentIds);
            return allApiResources
                .filter(r => recentSet.has(r.id))
                .sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));
        }
        return allApiResources;
    }, [allApiResources, resourceView, recentIds]);

    const groupedResources = useMemo(() => {
        return filteredResources.reduce((acc, resource) => {
            const category = resource.category || 'General';
            if (!acc[category]) {
                acc[category] = { folders: [], playlists: [], files: [] };
            }
            if (resource.type === 'FOLDER') {
                acc[category].folders.push(resource);
            } else if (resource.type === 'VIDEO_PLAYLIST') {
                acc[category].playlists.push(resource);
            } else {
                acc[category].files.push(resource);
            }
            return acc;
        }, {} as Record<string, { folders: AppResourceType[], playlists: AppResourceType[], files: AppResourceType[] }>);
    }, [filteredResources]);

    const handleNavigateFolder = (resource: AppResourceType) => {
        setCurrentFolderId(resource.id);
        setBreadcrumbs(prev => [...prev, { id: resource.id, title: resource.title }]);
        setSearchTerm('');
    };

    const handleBreadcrumbClick = (folderId: string | null, index: number) => {
        setCurrentFolderId(folderId);
        setBreadcrumbs(prev => prev.slice(0, index + 1));
        setSearchTerm('');
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
                toast({ title: 'Recurso Movido', description: `Se movió "${resourceToMove.title}" correctamente.` });
                fetchResources();
            } catch (e) {
                toast({ title: 'Error', description: 'No se pudo mover el recurso.', variant: 'destructive' });
            }
        }
    };

    const handleOpenPlaylistEditor = async (resource: AppResourceType) => {
        try {
            const response = await fetch(`/api/resources?parentId=${resource.id}`);
            if (!response.ok) throw new Error('No se pudieron cargar los videos de la lista.');
            const data = await response.json();
            const playlistWithChildren = { ...resource, children: data.resources || [] };
            setPlaylistToEdit(playlistWithChildren);
            setIsPlaylistCreatorOpen(true);
        } catch (err) {
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        }
    };

    const handlePreviewResource = (resource: AppResourceType) => {
        setPreviewingResource(resource);
    };

    const handleNavigatePreview = (direction: 'next' | 'prev') => {
        const fileResources = allApiResources.filter(r => r.type !== 'FOLDER' && r.type !== 'VIDEO_PLAYLIST');
        if (fileResources.length <= 1) return;
        const currentIndex = fileResources.findIndex(r => r.id === previewingResource?.id);
        if (currentIndex === -1) return;

        let nextIndex;
        if (direction === 'next') {
            nextIndex = (currentIndex + 1) % fileResources.length;
        } else {
            nextIndex = (currentIndex - 1 + fileResources.length) % fileResources.length;
        }
        setPreviewingResource(fileResources[nextIndex]);
        addRecentResource(fileResources[nextIndex].id);
    }


    const handleSaveSuccess = () => {
        setResourceToEdit(null);
        setIsFolderEditorOpen(false);
        setFolderToEdit(null);
        setIsPlaylistCreatorOpen(false);
        setPlaylistToEdit(null);
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
        } catch (err) {
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        } finally {
            setResourceToDelete(null);
            setIsDeleting(false);
        }
    };

    const handleTogglePin = async (resource: AppResourceType) => {
        try {
            await fetch(`/api/resources/${resource.id}/pin`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPinned: !resource.isPinned }),
            });
            toast({ description: `Recurso ${resource.isPinned ? 'desfijado' : 'fijado'}.` });
            fetchResources();
        } catch (err) {
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        }
    };

    const handleRestore = async (resource: AppResourceType) => {
        try {
            const res = await fetch(`/api/resources/${resource.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ACTIVE' })
            });
            if (!res.ok) throw new Error("No se pudo restaurar el recurso.");
            toast({ title: "Recurso Restaurado" });
            fetchResources();
        } catch (err) {
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        }
    }

    const handleBulkDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch('/api/resources/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) }),
            });
            if (!res.ok) throw new Error((await res.json()).message || "Error al eliminar.");
            toast({ description: `${selectedIds.size} elemento(s) eliminados.` });
            fetchResources();
        } catch (err) {
            toast({ title: "Error", description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsDeleting(false);
            setResourceToDelete(null);
            setSelectedIds(new Set());
        }
    }

    const handleSelectionChange = useCallback((id: string, checked: boolean) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (id === 'all') {
                if (checked) {
                    allApiResources.forEach(r => newSet.add(r.id));
                } else {
                    allApiResources.forEach(r => newSet.delete(r.id));
                }
            } else {
                if (checked) newSet.add(id);
                else newSet.delete(id);
            }
            return newSet;
        });
    }, [allApiResources]);

    if (!user) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

    return (
        <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start">
                {/* Sidebar Navigation */}
                <div className="hidden md:block sticky top-6">
                    <div className="pb-4 mb-4 border-b">
                        <h2 className="font-semibold text-lg px-2">Carpetas</h2>
                        <p className="text-sm text-muted-foreground px-2">Navega por tu biblioteca</p>
                    </div>
                    <FolderTree
                        currentFolderId={currentFolderId}
                        onNavigate={(folder) => handleNavigateFolder(folder)}
                    />
                </div>

                {/* Main Content Area */}
                <div className="space-y-6 min-w-0">
                    <p className="text-muted-foreground">Gestiona y comparte documentos importantes, guías y materiales de formación para toda la organización.</p>

                    {/* View Selector */}
                    {!isPlaylistView && (
                        <div className="flex items-center gap-2 border-b">
                            <Button
                                variant={resourceView === 'all' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setResourceView('all')}
                                className="rounded-b-none"
                            >
                                Todos
                            </Button>
                            <Button
                                variant={resourceView === 'favorites' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setResourceView('favorites')}
                                className="rounded-b-none"
                            >
                                <Pin className="mr-2 h-4 w-4" />
                                Favoritos
                            </Button>
                            <Button
                                variant={resourceView === 'recent' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setResourceView('recent')}
                                className="rounded-b-none"
                            >
                                <Clock className="mr-2 h-4 w-4" />
                                Recientes
                            </Button>
                        </div>
                    )}

                    {!isPlaylistView && (
                        <Card className="p-4 bg-card shadow-sm">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="relative w-full flex-grow">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input placeholder="Buscar en la carpeta actual..." className="pl-10 h-10 text-base rounded-md" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="h-10 flex-grow md:flex-none">
                                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                                {sortBy === 'name' ? 'Nombre' : sortBy === 'size' ? 'Tamaño' : 'Fecha'}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => { setSortBy('name'); setSortOrder('asc'); }}>Nombre (A-Z)</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => { setSortBy('name'); setSortOrder('desc'); }}>Nombre (Z-A)</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => { setSortBy('date'); setSortOrder('desc'); }}>Más recientes</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => { setSortBy('date'); setSortOrder('asc'); }}>Más antiguos</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => { setSortBy('size'); setSortOrder('desc'); }}>Tamaño (Mayor-Menor)</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => { setSortBy('size'); setSortOrder('asc'); }}>Tamaño (Menor-Mayor)</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="h-10 flex-grow md:flex-none">
                                                <Filter className="mr-2 h-4 w-4" /> Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80" align="end">
                                            <div className="grid gap-4">
                                                <div className="space-y-2"><h4 className="font-medium leading-none">Filtros Avanzados</h4><p className="text-sm text-muted-foreground">Refina tu búsqueda de recursos.</p></div>
                                                <div className="space-y-2"><Label>Fecha de subida</Label><DateRangePicker date={dateRange} onDateChange={setDateRange} /></div>
                                                <div className="space-y-2"><Label>Tipo de Archivo</Label>
                                                    <Select value={fileType} onValueChange={setFileType}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">Todos</SelectItem><SelectItem value="image">Imagen</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="pdf">PDF</SelectItem><SelectItem value="doc">Documento</SelectItem><SelectItem value="xls">Hoja de cálculo</SelectItem><SelectItem value="ppt">Presentación</SelectItem><SelectItem value="zip">ZIP</SelectItem><SelectItem value="other">Otro</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex items-center space-x-2"><Checkbox id="hasPin" checked={hasPin} onCheckedChange={(c) => setHasPin(!!c)} /><Label htmlFor="hasPin">Con PIN</Label></div>
                                                <div className="flex items-center space-x-2"><Checkbox id="hasExpiry" checked={hasExpiry} onCheckedChange={(c) => setHasExpiry(!!c)} /><Label htmlFor="hasExpiry">Con Vencimiento</Label></div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="tags-filter">Etiquetas (separadas por coma)</Label>
                                                    <Input id="tags-filter" placeholder="ej. urgente, revisión" value={tagsFilter} onChange={e => setTagsFilter(e.target.value)} />
                                                </div>
                                                <Button onClick={() => setIsFilterPopoverOpen(false)}>Aplicar Filtros</Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    {canManage && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button className="h-10 flex-grow md:flex-none">
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Nuevo
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => { setFolderToEdit(null); setIsFolderEditorOpen(true); }}><FolderIcon className="mr-2 h-4 w-4" />Nueva Carpeta</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => { setPlaylistToEdit(null); setIsPlaylistCreatorOpen(true); }}><ListVideo className="mr-2 h-4 w-4" />Nueva Lista de Videos</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => setIsUploaderOpen(true)}><UploadCloud className="mr-2 h-4 w-4" />Subir Archivo/Enlace</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    <nav aria-label="Breadcrumb" className="mb-4">
                        <ol ref={setRootDroppableRef} className={cn("flex items-center gap-2 text-sm p-3 rounded-lg transition-colors", isOverRoot && "bg-primary/10 ring-2 ring-primary/30")}>
                            {breadcrumbs.map((crumb, index) => (
                                <li key={crumb.id || 'root'} className="flex items-center gap-2">
                                    {/* Icon */}
                                    {index === 0 ? (
                                        <FolderOpen className="h-4 w-4 text-primary" />
                                    ) : (
                                        <FolderIcon className="h-4 w-4 text-muted-foreground" />
                                    )}

                                    {/* Crumb Button */}
                                    <button
                                        onClick={() => handleBreadcrumbClick(crumb.id, index)}
                                        disabled={index === breadcrumbs.length - 1}
                                        className={cn(
                                            "hover:text-primary hover:underline transition-colors font-medium",
                                            "disabled:hover:no-underline disabled:cursor-default",
                                            index === breadcrumbs.length - 1
                                                ? "text-foreground font-semibold"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        {crumb.title}
                                    </button>

                                    {/* Separator */}
                                    {index < breadcrumbs.length - 1 && (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>

                    <div>
                        {isLoadingData ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="aspect-[3/2] w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="text-center py-10"><AlertTriangle className="mx-auto h-8 w-8 text-destructive" /><p className="mt-2 font-semibold text-destructive">{error}</p></div>
                        ) : isPlaylistView && currentFolder ? (
                            <VideoPlaylistView resources={allApiResources} folder={currentFolder} />
                        ) : (
                            <div className="space-y-8">
                                {Object.keys(groupedResources).length === 0 ? (
                                    <ResourceEmptyState
                                        view={resourceView}
                                        canManage={canManage}
                                        onCreateFolder={() => setIsFolderEditorOpen(true)}
                                        onUploadFile={() => setIsUploaderOpen(true)}
                                    />
                                ) : (
                                    Object.entries(groupedResources).map(([category, { folders, playlists, files }]) => (
                                        <section key={category}>
                                            <h3 className="text-xl font-semibold mb-4 border-b pb-2">{category}</h3>

                                            {/* Folders Section */}
                                            {folders.length > 0 && (
                                                <div className="mb-8">
                                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                                                        <FolderIcon className="h-4 w-4" />
                                                        Carpetas ({folders.length})
                                                    </h4>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                                        {folders.map(res => <ResourceGridItem key={res.id} resource={res} onSelect={() => handlePreviewResource(res)} onEdit={() => {
                                                            setFolderToEdit(res); setIsFolderEditorOpen(true);
                                                        }} onDelete={setResourceToDelete} onNavigate={handleNavigateFolder} onRestore={handleRestore} onTogglePin={handleTogglePin} isSelected={selectedIds.has(res.id)} onSelectionChange={handleSelectionChange} />)}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Playlists Section */}
                                            {playlists.length > 0 && (
                                                <div className="mb-8">
                                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                                                        <ListVideo className="h-4 w-4" />
                                                        Listas de Reproducción ({playlists.length})
                                                    </h4>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                                        {playlists.map(res => <ResourceGridItem key={res.id} resource={res} onSelect={() => handlePreviewResource(res)} onEdit={() => {
                                                            handleOpenPlaylistEditor(res);
                                                        }} onDelete={setResourceToDelete} onNavigate={handleNavigateFolder} onRestore={handleRestore} onTogglePin={handleTogglePin} isSelected={selectedIds.has(res.id)} onSelectionChange={handleSelectionChange} />)}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Files Section */}
                                            {files.length > 0 && (
                                                <>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                                            <FileText className="h-4 w-4" />
                                                            Recursos ({files.length})
                                                        </h4>
                                                        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                                                            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
                                                            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}><Grid className="h-4 w-4" /></Button>
                                                        </div>
                                                    </div>
                                                    {viewMode === 'grid' ? (
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                                            {files.map(res => <ResourceGridItem key={res.id} resource={res} onSelect={() => handlePreviewResource(res)} onEdit={setResourceToEdit} onDelete={setResourceToDelete} onNavigate={handleNavigateFolder} onRestore={handleRestore} onTogglePin={handleTogglePin} isSelected={selectedIds.has(res.id)} onSelectionChange={handleSelectionChange} />)}
                                                        </div>
                                                    ) : (
                                                        <ResourceListItem resources={files} onSelect={handlePreviewResource} onEdit={setResourceToEdit} onDelete={setResourceToDelete} onRestore={handleRestore} onTogglePin={handleTogglePin} selectedIds={selectedIds} onSelectionChange={handleSelectionChange} />
                                                    )}
                                                </>
                                            )}
                                        </section>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {selectedIds.size > 0 && canManage && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
                        >
                            <div className="flex items-center justify-between gap-4 p-2 bg-card border rounded-lg shadow-lg">
                                <p className="px-2 text-sm font-semibold">{selectedIds.size} seleccionado(s)</p>
                                <Button variant="outline" size="sm" onClick={() => setIsMoveModalOpen(true)}><FolderInput className="mr-2 h-4 w-4" />Mover</Button>
                                <Button variant="destructive" size="sm" onClick={() => setResourceToDelete({ id: 'bulk' } as any)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Limpiar</Button>
                            </div>
                        </motion.div>

                    )}
                </AnimatePresence>

                <MoveResourceModal
                    isOpen={isMoveModalOpen}
                    onClose={() => setIsMoveModalOpen(false)}
                    resourceIds={Array.from(selectedIds)}
                    onMoveSuccess={() => { setSelectedIds(new Set()); fetchResources(); }}
                />

                <ResourcePreviewModal
                    resource={previewingResource}
                    onClose={() => setPreviewingResource(null)}
                    onNavigate={handleNavigatePreview}
                />

                <ResourceEditorModal
                    isOpen={isUploaderOpen || !!resourceToEdit}
                    onClose={() => { setResourceToEdit(null); setIsUploaderOpen(false); }}
                    resource={resourceToEdit}
                    parentId={currentFolderId}
                    onSave={handleSaveSuccess}
                />

                <FolderEditorModal
                    isOpen={isFolderEditorOpen}
                    onClose={() => { setIsFolderEditorOpen(false); setFolderToEdit(null); }}
                    onSave={handleSaveSuccess}
                    parentId={currentFolderId}
                    folderToEdit={folderToEdit}
                />

                <PlaylistCreatorModal
                    isOpen={isPlaylistCreatorOpen}
                    onClose={() => { setIsPlaylistCreatorOpen(false); setPlaylistToEdit(null); }}
                    onSave={handleSaveSuccess}
                    parentId={currentFolderId}
                    playlistToEdit={playlistToEdit}
                />

                <AlertDialog open={!!resourceToDelete} onOpenChange={(open) => !open && setResourceToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                            <AlertDialogDescription>
                                {resourceToDelete?.id === 'bulk'
                                    ? `Se eliminarán permanentemente los ${selectedIds.size} elementos seleccionados. Esta acción no se puede deshacer.`
                                    : `El recurso "${resourceToDelete?.title}" será eliminado permanentemente. Si es una carpeta, debe estar vacía. Esta acción no se puede deshacer.`
                                }
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => resourceToDelete?.id === 'bulk' ? handleBulkDelete() : confirmDelete()} disabled={isDeleting} className={cn(buttonVariants({ variant: "destructive" }))}>
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Trash2 className="mr-2 h-4 w-4" />Sí, eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Quick Actions FAB */}
                <QuickActionsFAB
                    canManage={canManage}
                    onCreateFolder={() => setIsFolderEditorOpen(true)}
                    onUploadFile={() => setIsUploaderOpen(true)}
                    onCreatePlaylist={() => setIsPlaylistCreatorOpen(true)}
                />
            </div>
        </DndContext >
    );
}

