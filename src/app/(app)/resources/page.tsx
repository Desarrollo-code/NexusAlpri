'use client';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { AppResourceType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTitle } from '@/contexts/title-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2, AlertTriangle, FolderPlus, UploadCloud, Grid, List,
  ChevronDown, Search, Folder as FolderIcon, Trash2, FolderOpen,
  Filter, ChevronRight, Pin, ListVideo, FileText, Image as ImageIcon,
  Video as VideoIcon, FileQuestion, PlusCircle,
  Edit, ArrowUpDown, FolderInput, Clock, PanelLeftClose, PanelLeftOpen,
  Star, Eye, Download, MoreVertical,
  Table, X, RefreshCw,
  BarChart3, HardDrive, Zap, ChevronLeft
} from 'lucide-react';
import { ResourceGridItem } from '@/components/resources/resource-grid-item';
import { ResourceListItem } from '@/components/resources/resource-list-item';
import { DndContext, type DragEndEvent, MouseSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ResourceEditorModal } from '@/components/resources/resource-editor-modal';
import { FolderEditorModal } from '@/components/resources/folder-editor-modal';
import { PlaylistCreatorModal } from '@/components/resources/playlist-creator-modal';
import { FolderTree } from '@/components/resources/folder-tree';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuGroup, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { VideoPlaylistView } from '@/components/resources/video-playlist-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { AnimatePresence, motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { type DateRange } from 'react-day-picker';
import { useDroppable } from '@dnd-kit/core';
import { ResourcePreviewModal } from '@/components/resources/resource-preview-modal';
import { MoveResourceModal } from '@/components/resources/move-resource-modal';
import { useRecentResources } from '@/hooks/use-recent-resources';
import { QuickActionsFAB } from '@/components/resources/quick-actions-fab';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';

// Custom hook simplificado para gestión de recursos
function useResourceManager() {
  const [resources, setResources] = useState<AppResourceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchResources = useCallback(async (params?: {
    parentId?: string | null;
    search?: string;
    filters?: any;
  }) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        status: 'ACTIVE',
        includeChildren: 'true',
        ...(params?.parentId && { parentId: params.parentId }),
        ...(params?.search && { search: params.search }),
        ...params?.filters
      });

      const response = await fetch(`/api/resources?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Error al cargar recursos');
      
      const data = await response.json();
      setResources(data.resources || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast({ title: 'Error de carga', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  return { resources, loading, error, fetchResources, setResources };
}

// Componente de estadísticas optimizado
function ResourceStats({ resources }: { resources: AppResourceType[] }) {
  const stats = useMemo(() => {
    const totalSize = resources.reduce((sum, r) => sum + (r.size || 0), 0);
    const byType = resources.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: resources.length,
      totalSize: formatFileSize(totalSize),
      favorites: resources.filter(r => r.isPinned).length,
      recent: resources.filter(r => new Date(r.uploadDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
    };
  }, [resources]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <StatCard 
        label="Total" 
        value={stats.total} 
        color="blue" 
        icon={HardDrive}
      />
      <StatCard 
        label="Tamaño" 
        value={stats.totalSize} 
        color="green" 
        icon={BarChart3}
      />
      <StatCard 
        label="Favoritos" 
        value={stats.favorites} 
        color="amber" 
        icon={Star}
      />
      <StatCard 
        label="Recientes" 
        value={stats.recent} 
        color="purple" 
        icon={Zap}
      />
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon }: {
  label: string;
  value: string | number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <Card className={`p-3 bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900/20 dark:to-${color}-800/20`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium text-${color}-700 dark:text-${color}-300`}>{label}</p>
          <p className={`text-2xl font-bold text-${color}-900 dark:text-${color}-100`}>{value}</p>
        </div>
        <Icon className={`h-8 w-8 text-${color}-600 dark:text-${color}-400 opacity-70`} />
      </div>
    </Card>
  );
}

// Componente de breadcrumbs optimizado
function EnhancedBreadcrumbs({
  breadcrumbs,
  onBreadcrumbClick
}: {
  breadcrumbs: { id: string | null; title: string }[];
  onBreadcrumbClick: (folderId: string | null, index: number) => void;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <div className="flex items-center gap-2 text-sm flex-wrap">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id || 'root'}>
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
            <button
              onClick={() => onBreadcrumbClick(crumb.id, index)}
              className={cn(
                "hover:text-primary transition-colors text-left flex items-center gap-1 disabled:cursor-default",
                index === breadcrumbs.length - 1 ? "text-foreground font-semibold" : "text-muted-foreground"
              )}
              disabled={index === breadcrumbs.length - 1}
            >
              {index === 0 ? <FolderOpen className="h-4 w-4 text-primary" /> : <FolderIcon className="h-4 w-4" />}
              <span className="truncate max-w-[150px]">{crumb.title}</span>
            </button>
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}

// Componente Sidebar optimizado
function SidebarNavigation({
  isVisible,
  onToggle,
  currentFolderId,
  onNavigate,
  showThumbnails,
  onToggleThumbnails
}: {
  isVisible: boolean;
  onToggle: () => void;
  currentFolderId: string | null;
  onNavigate: (resource: AppResourceType) => void;
  showThumbnails: boolean;
  onToggleThumbnails: (checked: boolean) => void;
}) {
  if (!isVisible) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="hidden lg:block sticky top-6 h-[calc(100vh-3rem)] overflow-y-auto pb-6"
    >
      <div className="space-y-6 p-4">
        <div className="pb-4 border-b flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Explorador</h2>
            <p className="text-sm text-muted-foreground">Navega por tu biblioteca</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="folders">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="folders">Carpetas</TabsTrigger>
            <TabsTrigger value="tags">Etiquetas</TabsTrigger>
          </TabsList>
          <TabsContent value="folders" className="mt-4">
            <FolderTree currentFolderId={currentFolderId} onNavigate={onNavigate} compact />
          </TabsContent>
          <TabsContent value="tags" className="mt-4">
            <div className="space-y-2">
              <Input placeholder="Buscar etiquetas..." />
              <div className="flex flex-wrap gap-2 pt-2">
                {['urgente', 'revisión', 'importante', 'archivo'].map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Card className="p-4">
          <div className="space-y-4">
            <h4 className="font-semibold">Personalizar Vista</h4>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Mostrar miniaturas</Label>
              <Switch checked={showThumbnails} onCheckedChange={onToggleThumbnails} />
            </div>
          </div>
        </Card>
      </div>
    </motion.aside>
  );
}

// Componente principal optimizado
export default function ResourcesPage() {
  const { user } = useAuth();
  const { setPageTitle } = useTitle();
  const { toast } = useToast();
  const { recentIds, addRecentResource } = useRecentResources();

  const { resources: allApiResources, loading: isLoadingData, error, fetchResources } = useResourceManager();

  // Estados consolidados
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [resourceView, setResourceView] = useState<'all' | 'favorites' | 'recent' | 'unread'>('all');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<AppResourceType | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, title: 'Biblioteca Principal' }]);
  
  // Estados de UI
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  // Estados de modales
  const [resourceToEdit, setResourceToEdit] = useState<AppResourceType | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<AppResourceType | null>(null);
  const [folderToEdit, setFolderToEdit] = useState<AppResourceType | null>(null);
  const [playlistToEdit, setPlaylistToEdit] = useState<AppResourceType | null>(null);
  const [previewingResource, setPreviewingResource] = useState<AppResourceType | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  // Estados de modales booleanos
  const [isFolderEditorOpen, setIsFolderEditorOpen] = useState(false);
  const [isPlaylistCreatorOpen, setIsPlaylistCreatorOpen] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  // Filtros
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [fileType, setFileType] = useState('all');
  const [hasPin, setHasPin] = useState(false);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [tagsFilter, setTagsFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { setNodeRef: setRootDroppableRef } = useDroppable({ id: 'root' });
  const containerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(new Set(allApiResources.map(r => r.id)));
      }
      if (e.key === 'Escape') setSelectedIds(new Set());
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allApiResources]);

  useEffect(() => {
    setPageTitle('Biblioteca de Recursos - Gestor Inteligente');
  }, [setPageTitle]);

  const canManage = user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR';

  // Carga de datos optimizada
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchResources({
          parentId: currentFolderId,
          search: debouncedSearchTerm,
          filters: { fileType: fileType !== 'all' ? fileType : undefined, hasPin, hasExpiry, sortBy, sortOrder }
        });

        if (currentFolderId) {
          const folderRes = await fetch(`/api/resources/${currentFolderId}`);
          if (folderRes.ok) setCurrentFolder(await folderRes.json());
        } else {
          setCurrentFolder(null);
        }
      } catch (err) {
        console.error('Error loading resources:', err);
      }
    };
    loadData();
  }, [currentFolderId, debouncedSearchTerm, fileType, hasPin, hasExpiry, sortBy, sortOrder, fetchResources]);

  // Filtrado y agrupación optimizados
  const { filteredResources, groupedResources } = useMemo(() => {
    let filtered = allApiResources;

    // Filtros básicos
    if (resourceView === 'favorites') filtered = filtered.filter(r => r.isPinned);
    if (resourceView === 'recent') filtered = filtered.filter(r => recentIds.includes(r.id));
    if (resourceView === 'unread') filtered = filtered.filter(r => !r.isViewed);
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        r.description?.toLowerCase().includes(searchLower) ||
        r.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    if (fileType !== 'all') filtered = filtered.filter(r => r.filetype === fileType);
    if (hasPin) filtered = filtered.filter(r => r.isPinned);
    if (hasExpiry) filtered = filtered.filter(r => r.expiresAt);

    // Ordenación
    filtered = [...filtered].sort((a, b) => {
      const order = sortOrder === 'desc' ? -1 : 1;
      switch (sortBy) {
        case 'name': return order * a.title.localeCompare(b.title);
        case 'size': return order * ((a.size || 0) - (b.size || 0));
        case 'type': return order * a.type.localeCompare(b.type);
        default: return order * (new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime());
      }
    });

    // Agrupación
    const groups: Record<string, AppResourceType[]> = {
      'Carpetas': filtered.filter(r => r.type === 'FOLDER'),
      'Listas de Videos': filtered.filter(r => r.type === 'VIDEO_PLAYLIST'),
      'Documentos': filtered.filter(r => ['pdf', 'doc', 'xls', 'ppt'].includes(r.filetype || '')),
      'Multimedia': filtered.filter(r => ['image', 'video', 'audio'].includes(r.filetype || '')),
      'Archivos': filtered.filter(r => !['FOLDER', 'VIDEO_PLAYLIST'].includes(r.type))
    };

    // Limpiar grupos vacíos
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });

    return { filteredResources: filtered, groupedResources: groups };
  }, [allApiResources, resourceView, recentIds, debouncedSearchTerm, fileType, hasPin, hasExpiry, sortBy, sortOrder]);

  // Handlers optimizados
  const handleNavigateFolder = useCallback((resource: AppResourceType) => {
    setCurrentFolderId(resource.id);
    setBreadcrumbs(prev => [...prev, { id: resource.id, title: resource.title }]);
    setSearchTerm('');
    setSelectedIds(new Set());
  }, []);

  const handleBreadcrumbClick = useCallback((folderId: string | null, index: number) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    setSearchTerm('');
    setSelectedIds(new Set());
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !active) return;

    const resourceToMove = active.data.current?.resource as AppResourceType;
    const targetFolderId = over.id as string;

    if (resourceToMove && targetFolderId !== resourceToMove.id && targetFolderId !== resourceToMove.parentId) {
      try {
        await fetch(`/api/resources/${resourceToMove.id}/move`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentId: targetFolderId === 'root' ? null : targetFolderId })
        });

        toast({ title: 'Recurso Movido', description: `"${resourceToMove.title}" se movió correctamente.` });
        fetchResources({ parentId: currentFolderId, search: debouncedSearchTerm });
      } catch {
        toast({ title: 'Error', description: 'No se pudo mover el recurso.', variant: 'destructive' });
      }
    }
  }, [currentFolderId, debouncedSearchTerm, fetchResources, toast]);

  const handleBulkAction = useCallback(async (action: 'download' | 'delete') => {
    if (selectedIds.size === 0) return;

    try {
      const endpoint = action === 'download' ? '/api/resources/bulk-download' : '/api/resources/bulk-delete';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });

      if (!response.ok) throw new Error();

      if (action === 'download') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recursos-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast({ title: 'Acción completada', description: `${selectedIds.size} recursos procesados` });
      fetchResources({ parentId: currentFolderId, search: debouncedSearchTerm });
      setSelectedIds(new Set());
    } catch {
      toast({ title: 'Error', description: 'No se pudo completar la acción', variant: 'destructive' });
    }
  }, [selectedIds, toast, fetchResources, currentFolderId, debouncedSearchTerm]);

  const handleTogglePin = useCallback(async (resource: AppResourceType) => {
    try {
      await fetch(`/api/resources/${resource.id}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !resource.isPinned }),
      });

      toast({ description: `Recurso ${resource.isPinned ? 'desfijado' : 'fijado'}.` });
      fetchResources({ parentId: currentFolderId, search: debouncedSearchTerm });
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  }, [currentFolderId, debouncedSearchTerm, fetchResources, toast]);

  const handleSaveSuccess = useCallback(() => {
    setResourceToEdit(null);
    setIsFolderEditorOpen(false);
    setFolderToEdit(null);
    setIsPlaylistCreatorOpen(false);
    setPlaylistToEdit(null);
    setIsUploaderOpen(false);
    fetchResources({ parentId: currentFolderId, search: debouncedSearchTerm });
  }, [currentFolderId, debouncedSearchTerm, fetchResources]);

  const confirmDelete = useCallback(async () => {
    if (!resourceToDelete) return;

    try {
      await fetch(`/api/resources/${resourceToDelete.id}`, { method: 'DELETE' });
      toast({ title: "Recurso eliminado", description: `"${resourceToDelete.title}" ha sido eliminado.` });
      fetchResources({ parentId: currentFolderId, search: debouncedSearchTerm });
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setResourceToDelete(null);
    }
  }, [resourceToDelete, currentFolderId, debouncedSearchTerm, fetchResources, toast]);

  const handleSelectionChange = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (id === 'all') {
        filteredResources.forEach(r => checked ? newSet.add(r.id) : newSet.delete(r.id));
      } else {
        checked ? newSet.add(id) : newSet.delete(id);
      }
      return newSet;
    });
  }, [filteredResources]);

  const handlePreviewResource = useCallback((resource: AppResourceType) => {
    setPreviewingResource(resource);
    addRecentResource(resource.id);
  }, [addRecentResource]);

  // Renderizado condicional optimizado
  const renderContent = () => {
    if (isLoadingData) return <LoadingState />;
    if (error) return <ErrorState error={error} onRetry={() => fetchResources({ parentId: currentFolderId, search: debouncedSearchTerm })} />;
    if (currentFolder?.type === 'VIDEO_PLAYLIST') return <VideoPlaylistView resources={allApiResources} folder={currentFolder} />;
    if (filteredResources.length === 0) return <EmptyState canManage={canManage} searchTerm={searchTerm} />;
    
    return (
      <div className="space-y-8">
        <ResourceStats resources={filteredResources} />
        {Object.entries(groupedResources).map(([category, resources]) => (
          <ResourceSection
            key={category}
            category={category}
            resources={resources}
            viewMode={viewMode}
            selectedIds={selectedIds}
            onViewModeChange={setViewMode}
            onSelectionChange={handleSelectionChange}
            onPreview={handlePreviewResource}
            onEdit={setResourceToEdit}
            onDelete={setResourceToDelete}
            onNavigate={handleNavigateFolder}
            onTogglePin={handleTogglePin}
          />
        ))}
      </div>
    );
  };

  if (!user) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <DndContext onDragStart={(e) => setActiveId(e.active.id)} onDragEnd={handleDragEnd} sensors={sensors}>
      <div className={cn("grid transition-all duration-300 min-h-screen", isSidebarVisible ? "lg:grid-cols-[280px_1fr] gap-6" : "grid-cols-1")}>
        
        <SidebarNavigation
          isVisible={isSidebarVisible}
          onToggle={() => setIsSidebarVisible(!isSidebarVisible)}
          currentFolderId={currentFolderId}
          onNavigate={handleNavigateFolder}
          showThumbnails={showThumbnails}
          onToggleThumbnails={setShowThumbnails}
        />

        <div className="space-y-6 p-4 md:p-6">
          {!isSidebarVisible && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSidebarVisible(true)}
              className="hidden lg:block absolute -left-8 top-4 h-8 w-8 rounded-full shadow-md bg-background"
            >
              <PanelLeftOpen className="h-4 w-4 text-primary" />
            </Button>
          )}

          <Header
            canManage={canManage}
            isSidebarVisible={isSidebarVisible}
            onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
            onCreateFolder={() => setIsFolderEditorOpen(true)}
            onCreatePlaylist={() => setIsPlaylistCreatorOpen(true)}
            onUpload={() => setIsUploaderOpen(true)}
            resourceView={resourceView}
            onViewChange={setResourceView}
          />

          {currentFolder?.type !== 'VIDEO_PLAYLIST' && (
            <SearchAndFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(by, order) => { setSortBy(by); setSortOrder(order); }}
              dateRange={dateRange}
              onDateChange={setDateRange}
              fileType={fileType}
              onFileTypeChange={setFileType}
              hasPin={hasPin}
              onHasPinChange={setHasPin}
              hasExpiry={hasExpiry}
              onHasExpiryChange={setHasExpiry}
              tagsFilter={tagsFilter}
              onTagsFilterChange={setTagsFilter}
              isFilterOpen={isFilterPopoverOpen}
              onFilterOpenChange={setIsFilterPopoverOpen}
            />
          )}

          <EnhancedBreadcrumbs breadcrumbs={breadcrumbs} onBreadcrumbClick={handleBreadcrumbClick} />
          <div ref={containerRef}>{renderContent()}</div>
        </div>
      </div>

      <SelectionActionBar
        selectedIds={selectedIds}
        onMove={() => setIsMoveModalOpen(true)}
        onDownload={() => handleBulkAction('download')}
        onDelete={() => setResourceToDelete({ id: 'bulk' } as any)}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <Modals
        isMoveModalOpen={isMoveModalOpen}
        onCloseMoveModal={() => setIsMoveModalOpen(false)}
        selectedIds={selectedIds}
        currentFolderId={currentFolderId}
        searchTerm={debouncedSearchTerm}
        onMoveSuccess={fetchResources}
        previewingResource={previewingResource}
        onClosePreview={() => setPreviewingResource(null)}
        allApiResources={allApiResources}
        onNavigatePreview={(dir) => {
          if (!previewingResource) return;
          const files = allApiResources.filter(r => !['FOLDER', 'VIDEO_PLAYLIST'].includes(r.type));
          const currentIndex = files.findIndex(r => r.id === previewingResource.id);
          if (currentIndex === -1) return;
          const nextIndex = dir === 'next' ? (currentIndex + 1) % files.length : (currentIndex - 1 + files.length) % files.length;
          setPreviewingResource(files[nextIndex]);
          addRecentResource(files[nextIndex].id);
        }}
        isUploaderOpen={isUploaderOpen}
        resourceToEdit={resourceToEdit}
        onCloseUploader={() => { setResourceToEdit(null); setIsUploaderOpen(false); }}
        currentFolderId={currentFolderId}
        onSaveSuccess={handleSaveSuccess}
        isFolderEditorOpen={isFolderEditorOpen}
        onCloseFolderEditor={() => { setIsFolderEditorOpen(false); setFolderToEdit(null); }}
        folderToEdit={folderToEdit}
        onSaveFolderSuccess={handleSaveSuccess}
        isPlaylistCreatorOpen={isPlaylistCreatorOpen}
        onClosePlaylistCreator={() => { setIsPlaylistCreatorOpen(false); setPlaylistToEdit(null); }}
        playlistToEdit={playlistToEdit}
        resourceToDelete={resourceToDelete}
        onCloseDelete={() => setResourceToDelete(null)}
        onConfirmDelete={confirmDelete}
        selectedIdsCount={selectedIds.size}
        onBulkDelete={() => handleBulkAction('delete')}
        activeId={activeId}
        allApiResources={allApiResources}
        selectedIds={selectedIds}
        canManage={canManage}
        onCreateFolder={() => setIsFolderEditorOpen(true)}
        onUploadFile={() => setIsUploaderOpen(true)}
        onCreatePlaylist={() => setIsPlaylistCreatorOpen(true)}
      />
    </DndContext>
  );
}

// Componentes auxiliares
function LoadingState() {
  return (
    <div className="space-y-6">
      <ResourceStats resources={[]} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
            <Card className="overflow-hidden"><Skeleton className="aspect-square w-full" /><div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 space-y-4">
      <AlertTriangle className="mx-auto h-16 w-16 text-destructive/60" />
      <div><h3 className="text-lg font-semibold text-destructive">{error}</h3><p className="text-muted-foreground mt-2">No se pudieron cargar los recursos</p></div>
      <Button onClick={onRetry}><RefreshCw className="mr-2 h-4 w-4" />Reintentar</Button>
    </motion.div>
  );
}

function EmptyState({ canManage, searchTerm }: { canManage: boolean; searchTerm: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center space-y-6">
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center">
        <FolderOpen className="h-12 w-12 text-primary" />
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-2">{searchTerm ? 'No se encontraron resultados' : 'Biblioteca vacía'}</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {searchTerm ? 'No hay recursos que coincidan con tu búsqueda.' : 'Comienza agregando recursos a tu biblioteca.'}
        </p>
      </div>
      {canManage && (
        <div className="flex gap-3 justify-center">
          <Button onClick={() => setIsFolderEditorOpen(true)}><FolderPlus className="mr-2 h-4 w-4" />Nueva Carpeta</Button>
          <Button onClick={() => setIsUploaderOpen(true)} variant="secondary"><UploadCloud className="mr-2 h-4 w-4" />Subir Archivos</Button>
        </div>
      )}
    </motion.div>
  );
}

function ResourceSection({
  category,
  resources,
  viewMode,
  selectedIds,
  onViewModeChange,
  onSelectionChange,
  onPreview,
  onEdit,
  onDelete,
  onNavigate,
  onTogglePin
}: {
  category: string;
  resources: AppResourceType[];
  viewMode: 'grid' | 'list' | 'table';
  selectedIds: Set<string>;
  onViewModeChange: (mode: 'grid' | 'list' | 'table') => void;
  onSelectionChange: (id: string, checked: boolean) => void;
  onPreview: (resource: AppResourceType) => void;
  onEdit: (resource: AppResourceType) => void;
  onDelete: (resource: AppResourceType) => void;
  onNavigate: (resource: AppResourceType) => void;
  onTogglePin: (resource: AppResourceType) => void;
}) {
  const icons = {
    'Carpetas': FolderIcon,
    'Listas de Videos': ListVideo,
    'Documentos': FileText,
    'Multimedia': VideoIcon,
    'Archivos': FileQuestion
  };
  const Icon = icons[category as keyof typeof icons] || FileQuestion;

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Icon className="h-5 w-5" />{category}<Badge variant="outline" className="ml-2">{resources.length}</Badge></h3>
        {category === 'Archivos' && resources.length > 0 && (
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
            {(['list', 'grid', 'table'] as const).map(mode => (
              <TooltipProvider key={mode}><Tooltip><TooltipTrigger asChild>
                <Button variant={viewMode === mode ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => onViewModeChange(mode)}>
                  {mode === 'list' ? <List className="h-4 w-4" /> : mode === 'grid' ? <Grid className="h-4 w-4" /> : <Table className="h-4 w-4" />}
                </Button>
              </TooltipTrigger><TooltipContent>{`Vista de ${mode === 'list' ? 'lista' : mode === 'grid' ? 'cuadrícula' : 'tabla'}`}</TooltipContent></Tooltip></TooltipProvider>
            ))}
          </div>
        )}
      </div>

      {viewMode === 'grid' || category !== 'Archivos' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {resources.map(resource => (
            <ResourceGridItem
              key={resource.id}
              resource={resource}
              onSelect={() => onPreview(resource)}
              onEdit={onEdit}
              onDelete={onDelete}
              onNavigate={onNavigate}
              onTogglePin={onTogglePin}
              isSelected={selectedIds.has(resource.id)}
              onSelectionChange={onSelectionChange}
            />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <ResourceListItem
          resources={resources}
          onSelect={onPreview}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePin={onTogglePin}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-4"><Checkbox checked={selectedIds.size === resources.length && resources.length > 0} onCheckedChange={(c) => onSelectionChange('all', !!c)} /></th>
                <th className="text-left p-4 font-semibold">Nombre</th><th className="text-left p-4 font-semibold">Tipo</th>
                <th className="text-left p-4 font-semibold">Tamaño</th><th className="text-left p-4 font-semibold">Fecha</th><th className="text-left p-4 font-semibold">Acciones</th>
              </tr></thead>
              <tbody>
                {resources.map(resource => (
                  <tr key={resource.id} className="border-b hover:bg-muted/50">
                    <td className="p-4"><Checkbox checked={selectedIds.has(resource.id)} onCheckedChange={(c) => onSelectionChange(resource.id, !!c)} /></td>
                    <td className="p-4 font-medium">{resource.title}</td>
                    <td className="p-4"><Badge variant="outline">{resource.filetype || resource.type}</Badge></td>
                    <td className="p-4">{formatFileSize(resource.size || 0)}</td>
                    <td className="p-4">{new Date(resource.uploadDate).toLocaleDateString()}</td>
                    <td className="p-4"><div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPreview(resource)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(resource)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(resource)}><Trash2 className="h-4 w-4" /></Button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </motion.section>
  );
}

function Header({
  canManage,
  isSidebarVisible,
  onToggleSidebar,
  onCreateFolder,
  onCreatePlaylist,
  onUpload,
  resourceView,
  onViewChange
}: {
  canManage: boolean;
  isSidebarVisible: boolean;
  onToggleSidebar: () => void;
  onCreateFolder: () => void;
  onCreatePlaylist: () => void;
  onUpload: () => void;
  resourceView: 'all' | 'favorites' | 'recent' | 'unread';
  onViewChange: (view: 'all' | 'favorites' | 'recent' | 'unread') => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Biblioteca de Recursos</h1>
          <p className="text-muted-foreground">Gestiona y comparte documentos importantes, guías y materiales de formación</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onToggleSidebar} className="lg:hidden">
            {isSidebarVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Nuevo</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onCreateFolder}><FolderIcon className="mr-2 h-4 w-4" />Nueva Carpeta</DropdownMenuItem>
                <DropdownMenuItem onClick={onCreatePlaylist}><ListVideo className="mr-2 h-4 w-4" />Nueva Lista de Videos</DropdownMenuItem>
                <DropdownMenuItem onClick={onUpload}><UploadCloud className="mr-2 h-4 w-4" />Subir Archivo/Enlace</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b overflow-x-auto">
        {(['all', 'favorites', 'recent', 'unread'] as const).map(view => (
          <Button
            key={view}
            variant={resourceView === view ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange(view)}
            className="rounded-b-none"
          >
            {view === 'all' && 'Todos'}
            {view === 'favorites' && <><Star className="mr-2 h-4 w-4" />Favoritos</>}
            {view === 'recent' && <><Clock className="mr-2 h-4 w-4" />Recientes</>}
            {view === 'unread' && <><Eye className="mr-2 h-4 w-4" />No vistos</>}
          </Button>
        ))}
      </div>
    </motion.div>
  );
}

function SearchAndFilters({
  searchTerm,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortChange,
  dateRange,
  onDateChange,
  fileType,
  onFileTypeChange,
  hasPin,
  onHasPinChange,
  hasExpiry,
  onHasExpiryChange,
  tagsFilter,
  onTagsFilterChange,
  isFilterOpen,
  onFilterOpenChange
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: 'date' | 'name' | 'size' | 'type';
  sortOrder: 'asc' | 'desc';
  onSortChange: (by: 'date' | 'name' | 'size' | 'type', order: 'asc' | 'desc') => void;
  dateRange: DateRange | undefined;
  onDateChange: (range: DateRange | undefined) => void;
  fileType: string;
  onFileTypeChange: (type: string) => void;
  hasPin: boolean;
  onHasPinChange: (checked: boolean) => void;
  hasExpiry: boolean;
  onHasExpiryChange: (checked: boolean) => void;
  tagsFilter: string;
  onTagsFilterChange: (value: string) => void;
  isFilterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
}) {
  const activeFilterCount = [
    dateRange?.from || dateRange?.to ? 1 : 0,
    fileType !== 'all' ? 1 : 0,
    hasPin ? 1 : 0,
    hasExpiry ? 1 : 0,
    tagsFilter ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <Card className="p-4 bg-card shadow-sm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar en la carpeta actual..." className="pl-10 h-10 text-base rounded-md" value={searchTerm} onChange={e => onSearchChange(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" className="h-10 flex-grow md:flex-none"><ArrowUpDown className="mr-2 h-4 w-4" />{sortBy === 'name' ? 'Nombre' : sortBy === 'size' ? 'Tamaño' : 'Fecha'}</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSortChange('name', 'asc')}>Nombre (A-Z)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('name', 'desc')}>Nombre (Z-A)</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSortChange('date', 'desc')}>Más recientes</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('date', 'asc')}>Más antiguos</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSortChange('size', 'desc')}>Tamaño (Mayor-Menor)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('size', 'asc')}>Tamaño (Menor-Mayor)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover open={isFilterOpen} onOpenChange={onFilterOpenChange}>
            <PopoverTrigger asChild><Button variant="outline" className="h-10 flex-grow md:flex-none"><Filter className="mr-2 h-4 w-4" />Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}</Button></PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="grid gap-4">
                <div className="space-y-2"><h4 className="font-medium leading-none">Filtros Avanzados</h4><p className="text-sm text-muted-foreground">Refina tu búsqueda de recursos.</p></div>
                <div className="space-y-2"><Label>Fecha de subida</Label><DateRangePicker date={dateRange} onDateChange={onDateChange} /></div>
                <div className="space-y-2"><Label>Tipo de Archivo</Label>
                  <Select value={fileType} onValueChange={onFileTypeChange}><SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="image">Imagen</SelectItem><SelectItem value="video">Video</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem><SelectItem value="doc">Documento</SelectItem><SelectItem value="other">Otro</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2"><Checkbox id="hasPin" checked={hasPin} onCheckedChange={(c) => onHasPinChange(!!c)} /><Label htmlFor="hasPin">Con PIN</Label></div>
                <div className="flex items-center space-x-2"><Checkbox id="hasExpiry" checked={hasExpiry} onCheckedChange={(c) => onHasExpiryChange(!!c)} /><Label htmlFor="hasExpiry">Con Vencimiento</Label></div>
                <div className="space-y-2"><Label htmlFor="tags-filter">Etiquetas (separadas por coma)</Label><Input id="tags-filter" placeholder="ej. urgente, revisión" value={tagsFilter} onChange={e => onTagsFilterChange(e.target.value)} /></div>
                <Button onClick={() => onFilterOpenChange(false)}>Aplicar Filtros</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </Card>
  );
}

function SelectionActionBar({
  selectedIds,
  onMove,
  onDownload,
  onDelete,
  onClearSelection
}: {
  selectedIds: Set<string>;
  onMove: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}) {
  if (selectedIds.size === 0) return null;

  return (
    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <Card className="px-4 py-3 shadow-xl border-2">
        <div className="flex items-center justify-between gap-4">
          <p className="px-2 text-sm font-semibold">{selectedIds.size} seleccionado{selectedIds.size > 1 ? 's' : ''}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onMove}><FolderInput className="mr-2 h-4 w-4" />Mover</Button>
            <Button variant="outline" size="sm" onClick={onDownload}><Download className="mr-2 h-4 w-4" />Descargar</Button>
            <Button variant="destructive" size="sm" onClick={onDelete}><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
            <Button variant="ghost" size="sm" onClick={onClearSelection}><X className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function Modals({
  isMoveModalOpen,
  onCloseMoveModal,
  selectedIds,
  currentFolderId,
  searchTerm,
  onMoveSuccess,
  previewingResource,
  onClosePreview,
  allApiResources,
  onNavigatePreview,
  isUploaderOpen,
  resourceToEdit,
  onCloseUploader,
  currentFolderId: parentId,
  onSaveSuccess,
  isFolderEditorOpen,
  onCloseFolderEditor,
  folderToEdit,
  onSaveFolderSuccess,
  isPlaylistCreatorOpen,
  onClosePlaylistCreator,
  playlistToEdit,
  resourceToDelete,
  onCloseDelete,
  onConfirmDelete,
  selectedIdsCount,
  onBulkDelete,
  activeId,
  allApiResources: resources,
  selectedIds: selected,
  canManage,
  onCreateFolder,
  onUploadFile,
  onCreatePlaylist
}: any) {
  return (
    <>
      <MoveResourceModal isOpen={isMoveModalOpen} onClose={onCloseMoveModal} resourceIds={Array.from(selectedIds)} onMoveSuccess={onMoveSuccess} />
      <ResourcePreviewModal resource={previewingResource} onClose={onClosePreview} onNavigate={onNavigatePreview} />
      <ResourceEditorModal isOpen={isUploaderOpen || !!resourceToEdit} onClose={onCloseUploader} resource={resourceToEdit} parentId={parentId} onSave={onSaveSuccess} />
      <FolderEditorModal isOpen={isFolderEditorOpen} onClose={onCloseFolderEditor} onSave={onSaveFolderSuccess} parentId={parentId} folderToEdit={folderToEdit} />
      <PlaylistCreatorModal isOpen={isPlaylistCreatorOpen} onClose={onClosePlaylistCreator} onSave={onSaveSuccess} parentId={parentId} playlistToEdit={playlistToEdit} />
      
      <AlertDialog open={!!resourceToDelete} onOpenChange={(open) => !open && onCloseDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              {resourceToDelete?.id === 'bulk'
                ? `Se eliminarán permanentemente los ${selectedIdsCount} elementos seleccionados. Esta acción no se puede deshacer.`
                : `El recurso "${resourceToDelete?.title}" será eliminado permanentemente. Si es una carpeta, debe estar vacía. Esta acción no se puede deshacer.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={resourceToDelete?.id === 'bulk' ? onBulkDelete : onConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="mr-2 h-4 w-4" />Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QuickActionsFAB canManage={canManage} onCreateFolder={onCreateFolder} onUploadFile={onUploadFile} onCreatePlaylist={onCreatePlaylist} />
      
      <DragOverlay>
        {activeId && (
          <div className="opacity-80 scale-95 pointer-events-none">
            <ResourceGridItem
              resource={resources.find((r: AppResourceType) => r.id === activeId)!}
              onSelect={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              onNavigate={() => {}}
              onTogglePin={() => {}}
              isSelected={selected.has(activeId)}
              onSelectionChange={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}