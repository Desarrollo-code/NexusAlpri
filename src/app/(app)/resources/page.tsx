'use client';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { AppResourceType, ResourceStatus } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTitle } from '@/contexts/title-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { 
  Loader2, AlertTriangle, FolderPlus, UploadCloud, Grid, List, 
  ChevronDown, Search, Folder as FolderIcon, Move, Trash2, FolderOpen, 
  Filter, ChevronRight, Pin, ListVideo, FileText, Image as ImageIcon, 
  Video as VideoIcon, FileQuestion, Archive as ZipIcon, PlusCircle, 
  Edit, ArrowUpDown, FolderInput, Clock, PanelLeftClose, PanelLeftOpen,
  Star, StarOff, Eye, EyeOff, Download, Share2, Copy, MoreVertical,
  Grid3x3, LayoutGrid, Table, Columns, X, Check, RefreshCw,
  BarChart3, HardDrive, Calendar, Tag, Users, Zap
} from 'lucide-react';
import { ResourceGridItem } from '@/components/resources/resource-grid-item';
import { ResourceListItem } from '@/components/resources/resource-list-item';
import { DndContext, type DragEndEvent, MouseSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ResourceEditorModal } from '@/components/resources/resource-editor-modal';
import { FolderEditorModal } from '@/components/resources/folder-editor-modal';
import { PlaylistCreatorModal } from '@/components/resources/playlist-creator-modal';
import { FolderTree } from '@/components/resources/folder-tree';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { VideoPlaylistView } from '@/components/resources/video-playlist-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { type DateRange } from 'react-day-picker';
import { useDroppable } from '@dnd-kit/core';
import { Separator } from '@/components/ui/separator';
import { ResourcePreviewModal } from '@/components/resources/resource-preview-modal';
import { MoveResourceModal } from '@/components/resources/move-resource-modal';
import { useRecentResources } from '@/hooks/use-recent-resources';
import { QuickActionsFAB } from '@/components/resources/quick-actions-fab';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';

// Custom hook para gestor de recursos
function useResourceManager() {
  const [allApiResources, setAllApiResources] = useState<AppResourceType[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchResources = useCallback(async (params?: {
    parentId?: string | null;
    search?: string;
    filters?: any;
  }) => {
    if (!user) return;
    
    setIsLoadingData(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        status: 'ACTIVE',
        ...(params?.parentId && { parentId: params.parentId }),
        ...(params?.search && { search: params.search }),
        ...params?.filters
      });

      const response = await fetch(`/api/resources?${queryParams.toString()}`, {
        next: { revalidate: 0 }
      });
      
      if (!response.ok) throw new Error('Error al cargar recursos');
      
      const data = await response.json();
      setAllApiResources(data.resources || []);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast({
        title: 'Error de carga',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoadingData(false);
    }
  }, [user, toast]);

  return {
    allApiResources,
    isLoadingData,
    error,
    fetchResources,
    setAllApiResources
  };
}

// Componente de estadísticas
function ResourceStats({ resources }: { resources: AppResourceType[] }) {
  const stats = useMemo(() => {
    const totalSize = resources.reduce((sum, r) => sum + (r.fileSize || 0), 0);
    const byType = resources.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: resources.length,
      totalSize: formatFileSize(totalSize),
      byType,
      favorites: resources.filter(r => r.isPinned).length,
      recent: resources.filter(r => new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
    };
  }, [resources]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
          </div>
          <HardDrive className="h-8 w-8 text-blue-600 dark:text-blue-400 opacity-70" />
        </div>
      </Card>
      
      <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-700 dark:text-green-300">Tamaño</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.totalSize}</p>
          </div>
          <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400 opacity-70" />
        </div>
      </Card>
      
      <Card className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Favoritos</p>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{stats.favorites}</p>
          </div>
          <Star className="h-8 w-8 text-amber-600 dark:text-amber-400 opacity-70" />
        </div>
      </Card>
      
      <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Recientes</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.recent}</p>
          </div>
          <Zap className="h-8 w-8 text-purple-600 dark:text-purple-400 opacity-70" />
        </div>
      </Card>
    </div>
  );
}

// Componente de búsqueda avanzada
function AdvancedSearch({
  searchTerm,
  onSearchChange,
  onQuickFilter
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onQuickFilter: (filter: string) => void;
}) {
  const quickFilters = [
    { label: 'Imágenes', value: 'type:image', icon: ImageIcon },
    { label: 'Videos', value: 'type:video', icon: VideoIcon },
    { label: 'PDFs', value: 'type:pdf', icon: FileText },
    { label: 'Esta semana', value: 'date:week', icon: Calendar },
    { label: 'Sin etiquetas', value: 'tags:none', icon: Tag },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar recursos, etiquetas, contenido..."
          className="pl-10 pr-10 h-12 text-base rounded-xl border-2 focus:border-primary transition-all"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <Badge
            key={filter.value}
            variant="secondary"
            className="cursor-pointer gap-1 hover:bg-primary/10 transition-colors"
            onClick={() => onQuickFilter(filter.value)}
          >
            <filter.icon className="h-3 w-3" />
            {filter.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// Componente de vista personalizable
function ViewCustomizer({
  viewMode,
  onViewModeChange,
  gridSize,
  onGridSizeChange,
  showThumbnails,
  onShowThumbnailsChange
}: {
  viewMode: 'grid' | 'list' | 'table';
  onViewModeChange: (mode: 'grid' | 'list' | 'table') => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  showThumbnails: boolean;
  onShowThumbnailsChange: (show: boolean) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold">Personalizar Vista</h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Eye className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Ajusta cómo ves tus recursos</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm">Tipo de Vista</Label>
          <div className="flex gap-2">
            {[
              { mode: 'grid' as const, icon: Grid3x3, label: 'Cuadrícula' },
              { mode: 'list' as const, icon: List, label: 'Lista' },
              { mode: 'table' as const, icon: Table, label: 'Tabla' }
            ].map((item) => (
              <Button
                key={item.mode}
                variant={viewMode === item.mode ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => onViewModeChange(item.mode)}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
        
        {viewMode === 'grid' && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Tamaño de cuadrícula</Label>
                <span className="text-sm text-muted-foreground">{gridSize}px</span>
              </div>
              <Slider
                value={[gridSize]}
                onValueChange={([value]) => onGridSizeChange(value)}
                min={120}
                max={300}
                step={20}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="text-sm">Mostrar miniaturas</Label>
              <Switch
                checked={showThumbnails}
                onCheckedChange={onShowThumbnailsChange}
              />
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

// Componente principal mejorado
export default function ResourcesPage() {
  const { user, settings } = useAuth();
  const { setPageTitle } = useTitle();
  const { toast } = useToast();
  const { recentIds, addRecentResource } = useRecentResources();
  
  const resourceManager = useResourceManager();
  const { allApiResources, isLoadingData, error, fetchResources } = resourceManager;

  // Estados principales
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [resourceView, setResourceView] = useState<'all' | 'favorites' | 'recent' | 'unread'>('all');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<AppResourceType | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; title: string }[]>([
    { id: null, title: 'Biblioteca Principal' }
  ]);

  // Estados de UI
  const [isPlaylistView, setIsPlaylistView] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState<AppResourceType | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<AppResourceType | null>(null);
  const [folderToEdit, setFolderToEdit] = useState<AppResourceType | null>(null);
  const [playlistToEdit, setPlaylistToEdit] = useState<AppResourceType | null>(null);
  const [previewingResource, setPreviewingResource] = useState<AppResourceType | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  // Estados de modales
  const [isFolderEditorOpen, setIsFolderEditorOpen] = useState(false);
  const [isPlaylistCreatorOpen, setIsPlaylistCreatorOpen] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  
  // Estados de selección
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  
  // Estados de filtros avanzados
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [fileType, setFileType] = useState('all');
  const [hasPin, setHasPin] = useState(false);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [tagsFilter, setTagsFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Estados de personalización
  const [gridSize, setGridSize] = useState(160);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { setNodeRef: setRootDroppableRef, isOver: isOverRoot } = useDroppable({ id: 'root' });
  const containerRef = useRef<HTMLDivElement>(null);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + A para seleccionar todo
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        if (allApiResources.length > 0) {
          setSelectedIds(new Set(allApiResources.map(r => r.id)));
          setIsSelecting(true);
        }
      }
      
      // Escape para deseleccionar
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setIsSelecting(false);
      }
      
      // Ctrl/Cmd + F para buscar
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allApiResources]);

  useEffect(() => {
    setPageTitle('Biblioteca de Recursos - Gestor Inteligente');
  }, [setPageTitle]);

  const canManage = useMemo(() => 
    user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR', 
  [user]);

  // Filtrado y ordenación optimizados
  const filteredResources = useMemo(() => {
    let resources = allApiResources;
    
    // Filtro por vista
    if (resourceView === 'favorites') {
      resources = resources.filter(r => r.isPinned);
    } else if (resourceView === 'recent') {
      const recentSet = new Set(recentIds);
      resources = resources
        .filter(r => recentSet.has(r.id))
        .sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));
    } else if (resourceView === 'unread') {
      resources = resources.filter(r => !r.isViewed);
    }

    // Filtro por búsqueda
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      resources = resources.filter(r =>
        r.title.toLowerCase().includes(searchLower) ||
        r.description?.toLowerCase().includes(searchLower) ||
        r.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filtros adicionales
    if (fileType !== 'all') {
      resources = resources.filter(r => r.fileType === fileType);
    }
    if (hasPin) {
      resources = resources.filter(r => r.isPinned);
    }
    if (hasExpiry) {
      resources = resources.filter(r => r.expiresAt);
    }
    if (tagsFilter) {
      const tags = tagsFilter.split(',').map(t => t.trim().toLowerCase());
      resources = resources.filter(r => 
        r.tags?.some(tag => tags.includes(tag.toLowerCase()))
      );
    }

    // Ordenación
    return resources.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'size':
          comparison = (a.fileSize || 0) - (b.fileSize || 0);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'date':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [allApiResources, resourceView, recentIds, debouncedSearchTerm, fileType, hasPin, hasExpiry, tagsFilter, sortBy, sortOrder]);

  // Agrupación inteligente
  const groupedResources = useMemo(() => {
    const groups: Record<string, AppResourceType[]> = {
      'Carpetas': [],
      'Listas de Videos': [],
      'Documentos': [],
      'Multimedia': [],
      'Archivos': [],
    };

    filteredResources.forEach(resource => {
      if (resource.type === 'FOLDER') {
        groups['Carpetas'].push(resource);
      } else if (resource.type === 'VIDEO_PLAYLIST') {
        groups['Listas de Videos'].push(resource);
      } else if (['pdf', 'doc', 'xls', 'ppt'].includes(resource.fileType || '')) {
        groups['Documentos'].push(resource);
      } else if (['image', 'video', 'audio'].includes(resource.fileType || '')) {
        groups['Multimedia'].push(resource);
      } else {
        groups['Archivos'].push(resource);
      }
    });

    // Eliminar grupos vacíos
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [filteredResources]);

  // Handlers optimizados
  const handleNavigateFolder = useCallback((resource: AppResourceType) => {
    setCurrentFolderId(resource.id);
    setBreadcrumbs(prev => [...prev, { id: resource.id, title: resource.title }]);
    setSearchTerm('');
    setIsSelecting(false);
    setSelectedIds(new Set());
  }, []);

  const handleBreadcrumbClick = useCallback((folderId: string | null, index: number) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    setSearchTerm('');
    setIsSelecting(false);
    setSelectedIds(new Set());
  }, []);

  const handleQuickFilter = useCallback((filter: string) => {
    const [type, value] = filter.split(':');
    switch (type) {
      case 'type':
        setFileType(value);
        break;
      case 'date':
        if (value === 'week') {
          setDateRange({
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            to: new Date()
          });
        }
        break;
      case 'tags':
        if (value === 'none') {
          setTagsFilter('');
        }
        break;
    }
  }, []);

  const handleBulkAction = useCallback(async (action: 'pin' | 'archive' | 'download') => {
    if (selectedIds.size === 0) return;

    try {
      const endpoint = action === 'download' 
        ? '/api/resources/bulk-download' 
        : `/api/resources/bulk-${action}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });

      if (!response.ok) throw new Error('Error en acción masiva');

      if (action === 'download') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recursos-${new Date().toISOString().split('T')[0]}.zip`;
        a.click();
      }

      toast({
        title: 'Acción completada',
        description: `${selectedIds.size} recursos procesados`
      });

      fetchResources();
      setSelectedIds(new Set());
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo completar la acción',
        variant: 'destructive'
      });
    }
  }, [selectedIds, toast, fetchResources]);

  // Renderizado condicional optimizado
  const renderContent = () => {
    if (isLoadingData) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 space-y-4"
        >
          <AlertTriangle className="mx-auto h-16 w-16 text-destructive/60" />
          <div>
            <h3 className="text-lg font-semibold text-destructive">{error}</h3>
            <p className="text-muted-foreground mt-2">No se pudieron cargar los recursos</p>
          </div>
          <Button onClick={() => fetchResources()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </motion.div>
      );
    }

    if (isPlaylistView && currentFolder) {
      return <VideoPlaylistView resources={allApiResources} folder={currentFolder} />;
    }

    if (filteredResources.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center space-y-4"
        >
          <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No hay recursos</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'No se encontraron resultados para tu búsqueda' : 'Comienza agregando recursos a tu biblioteca'}
            </p>
          </div>
          {canManage && (
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setIsFolderEditorOpen(true)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                Nueva Carpeta
              </Button>
              <Button onClick={() => setIsUploaderOpen(true)} variant="secondary">
                <UploadCloud className="mr-2 h-4 w-4" />
                Subir Archivos
              </Button>
            </div>
          )}
        </motion.div>
      );
    }

    return (
      <LayoutGroup>
        <div className="space-y-8">
          <ResourceStats resources={filteredResources} />
          
          {Object.entries(groupedResources).map(([category, resources]) => (
            <motion.section
              key={category}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {category === 'Carpetas' && <FolderIcon className="h-5 w-5" />}
                  {category === 'Listas de Videos' && <ListVideo className="h-5 w-5" />}
                  {category === 'Documentos' && <FileText className="h-5 w-5" />}
                  {category === 'Multimedia' && <VideoIcon className="h-5 w-5" />}
                  {category}
                  <Badge variant="outline" className="ml-2">
                    {resources.length}
                  </Badge>
                </h3>
                
                {category === 'Archivos' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode('list')}
                      className={cn(viewMode === 'list' && 'bg-muted')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode('grid')}
                      className={cn(viewMode === 'grid' && 'bg-muted')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode('table')}
                      className={cn(viewMode === 'table' && 'bg-muted')}
                    >
                      <Table className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {viewMode === 'grid' || category !== 'Archivos' ? (
                <div 
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(auto-fill, minmax(${gridSize}px, 1fr))`
                  }}
                >
                  {resources.map((resource) => (
                    <ResourceGridItem
                      key={resource.id}
                      resource={resource}
                      onSelect={() => setPreviewingResource(resource)}
                      onEdit={setResourceToEdit}
                      onDelete={setResourceToDelete}
                      onNavigate={handleNavigateFolder}
                      onTogglePin={() => {}}
                      isSelected={selectedIds.has(resource.id)}
                      onSelectionChange={(id, checked) => {
                        setSelectedIds(prev => {
                          const newSet = new Set(prev);
                          if (checked) newSet.add(id);
                          else newSet.delete(id);
                          return newSet;
                        });
                      }}
                      showThumbnail={showThumbnails}
                    />
                  ))}
                </div>
              ) : viewMode === 'list' ? (
                <ResourceListItem
                  resources={resources}
                  onSelect={setPreviewingResource}
                  onEdit={setResourceToEdit}
                  onDelete={setResourceToDelete}
                  selectedIds={selectedIds}
                  onSelectionChange={(id, checked) => {
                    setSelectedIds(prev => {
                      const newSet = new Set(prev);
                      if (checked) newSet.add(id);
                      else newSet.delete(id);
                      return newSet;
                    });
                  }}
                />
              ) : (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4">Nombre</th>
                          <th className="text-left p-4">Tipo</th>
                          <th className="text-left p-4">Tamaño</th>
                          <th className="text-left p-4">Fecha</th>
                          <th className="text-left p-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resources.map((resource) => (
                          <tr key={resource.id} className="border-b hover:bg-muted/50">
                            <td className="p-4">{resource.title}</td>
                            <td className="p-4">
                              <Badge variant="outline">{resource.fileType}</Badge>
                            </td>
                            <td className="p-4">
                              {formatFileSize(resource.fileSize || 0)}
                            </td>
                            <td className="p-4">
                              {new Date(resource.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </motion.section>
          ))}
        </div>
      </LayoutGroup>
    );
  };

  return (
    <DndContext onDragEnd={() => {}}>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-4rem)]">
          {/* Panel lateral */}
          <ResizablePanel 
            defaultSize={20} 
            minSize={15} 
            maxSize={30}
            collapsible
            collapsedSize={0}
          >
            <AnimatePresence mode="wait">
              {isSidebarVisible && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full p-6 border-r"
                >
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h2 className="font-semibold text-lg">Biblioteca</h2>
                      <p className="text-sm text-muted-foreground">
                        Organiza tus recursos inteligentemente
                      </p>
                    </div>
                    
                    <Tabs defaultValue="folders" className="w-full">
                      <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="folders">Carpetas</TabsTrigger>
                        <TabsTrigger value="tags">Etiquetas</TabsTrigger>
                      </TabsList>
                      <TabsContent value="folders" className="mt-4">
                        <FolderTree
                          currentFolderId={currentFolderId}
                          onNavigate={handleNavigateFolder}
                          compact
                        />
                      </TabsContent>
                      <TabsContent value="tags" className="mt-4">
                        <div className="space-y-2">
                          <Input placeholder="Buscar etiquetas..." />
                          <div className="flex flex-wrap gap-2 pt-2">
                            {['urgente', 'revisión', 'importante', 'archivo'].map(tag => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <ViewCustomizer
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                      gridSize={gridSize}
                      onGridSizeChange={setGridSize}
                      showThumbnails={showThumbnails}
                      onShowThumbnailsChange={setShowThumbnails}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Contenido principal */}
          <ResizablePanel defaultSize={80}>
            <div className="p-6 space-y-6" ref={containerRef}>
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                      Biblioteca de Recursos
                    </h1>
                    <p className="text-muted-foreground">
                      Gestiona y comparte documentos importantes, guías y materiales de formación
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                    >
                      {isSidebarVisible ? (
                        <PanelLeftClose className="h-4 w-4" />
                      ) : (
                        <PanelLeftOpen className="h-4 w-4" />
                      )}
                    </Button>
                    {canManage && (
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nuevo Recurso
                      </Button>
                    )}
                  </div>
                </div>

                {/* Filtros rápidos */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant={resourceView === 'all' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setResourceView('all')}
                      >
                        Todos
                      </Button>
                      <Button
                        variant={resourceView === 'favorites' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setResourceView('favorites')}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Favoritos
                      </Button>
                      <Button
                        variant={resourceView === 'recent' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setResourceView('recent')}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Recientes
                      </Button>
                      <Button
                        variant={resourceView === 'unread' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setResourceView('unread')}
                      >
                        <EyeOff className="mr-2 h-4 w-4" />
                        No vistos
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Filter className="mr-2 h-4 w-4" />
                            Filtros
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-4">
                            <h4 className="font-medium">Filtros avanzados</h4>
                            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                            <Select value={fileType} onValueChange={setFileType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Tipo de archivo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="image">Imágenes</SelectItem>
                                <SelectItem value="video">Videos</SelectItem>
                                <SelectItem value="pdf">PDFs</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <AdvancedSearch
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onQuickFilter={handleQuickFilter}
                  />
                </Card>
              </motion.div>

              {/* Breadcrumbs */}
              <motion.nav
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-sm"
              >
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.id || 'root'}>
                    {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <button
                      onClick={() => handleBreadcrumbClick(crumb.id, index)}
                      className={cn(
                        "hover:text-primary transition-colors",
                        index === breadcrumbs.length - 1
                          ? "font-semibold"
                          : "text-muted-foreground"
                      )}
                    >
                      {crumb.title}
                    </button>
                  </React.Fragment>
                ))}
              </motion.nav>

              {/* Contenido */}
              {renderContent()}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Barra de acciones flotante */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <Card className="px-4 py-3 shadow-xl border-2">
              <div className="flex items-center gap-4">
                <p className="font-medium">
                  {selectedIds.size} seleccionado{selectedIds.size > 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkAction('pin')}
                        >
                          <Pin className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Fijar seleccionados</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsMoveModalOpen(true)}
                        >
                          <Move className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Mover seleccionados</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkAction('download')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Descargar seleccionados</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setResourceToDelete({ id: 'bulk' } as any)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modales */}
      <ResourcePreviewModal
        resource={previewingResource}
        onClose={() => setPreviewingResource(null)}
      />

      <MoveResourceModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        resourceIds={Array.from(selectedIds)}
        onMoveSuccess={() => {
          setSelectedIds(new Set());
          fetchResources();
        }}
      />

      <QuickActionsFAB
        canManage={canManage}
        onCreateFolder={() => setIsFolderEditorOpen(true)}
        onUploadFile={() => setIsUploaderOpen(true)}
        onCreatePlaylist={() => setIsPlaylistCreatorOpen(true)}
      />
    </DndContext>
  );
}

// Helper function
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}