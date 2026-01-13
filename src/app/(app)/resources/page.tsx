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
  BarChart3, HardDrive, Calendar, Tag, Users, Zap, ChevronLeft
} from 'lucide-react';
import { ResourceGridItem } from '@/components/resources/resource-grid-item';
import { ResourceListItem } from '@/components/resources/resource-list-item';
import { 
  DndContext, 
  type DragEndEvent, 
  MouseSensor, 
  PointerSensor, 
  TouchSensor, 
  useSensor, 
  useSensors,
  useDroppable 
} from '@dnd-kit/core';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ResourceEditorModal } from '@/components/resources/resource-editor-modal';
import { FolderEditorModal } from '@/components/resources/folder-editor-modal';
import { PlaylistCreatorModal } from '@/components/resources/playlist-creator-modal';
import { FolderTree } from '@/components/resources/folder-tree';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuGroup,
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { VideoPlaylistView } from '@/components/resources/video-playlist-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { AnimatePresence, motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { type DateRange } from 'react-day-picker';
import { ResourcePreviewModal } from '@/components/resources/resource-preview-modal';
import { MoveResourceModal } from '@/components/resources/move-resource-modal';
import { useRecentResources } from '@/hooks/use-recent-resources';
import { QuickActionsFAB } from '@/components/resources/quick-actions-fab';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';

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

      const response = await fetch(`/api/resources?${queryParams.toString()}`);
      
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

// Componente de búsqueda mejorada
function EnhancedSearch({
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

// Componente de breadcrumbs mejorado
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
                "hover:text-primary transition-colors text-left flex items-center gap-1",
                "disabled:hover:no-underline disabled:cursor-default",
                index === breadcrumbs.length - 1
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              )}
              disabled={index === breadcrumbs.length - 1}
            >
              {index === 0 ? (
                <FolderOpen className="h-4 w-4 text-primary" />
              ) : (
                <FolderIcon className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="truncate max-w-[150px]">{crumb.title}</span>
            </button>
          </React.Fragment>
        ))}
      </div>
    </nav>
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
  
  // Estados de filtros
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [fileType, setFileType] = useState('all');
  const [hasPin, setHasPin] = useState(false);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [tagsFilter, setTagsFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Estados de personalización
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { setNodeRef: setRootDroppableRef, isOver: isOverRoot } = useDroppable({ id: 'root' });
  const containerRef = useRef<HTMLDivElement>(null);

  // Configuración de sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

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

  // Fetch inicial de recursos
  useEffect(() => {
    const loadData = async () => {
      try {
        const params: any = {
          parentId: currentFolderId,
          search: debouncedSearchTerm
        };

        if (dateRange?.from) params.startDate = dateRange.from.toISOString();
        if (dateRange?.to) params.endDate = dateRange.to.toISOString();
        if (fileType !== 'all') params.fileType = fileType;
        if (hasPin) params.hasPin = 'true';
        if (hasExpiry) params.hasExpiry = 'true';
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;

        await fetchResources(params);

        if (currentFolderId) {
          const folderRes = await fetch(`/api/resources/${currentFolderId}`);
          if (folderRes.ok) {
            const folderData = await folderRes.json();
            setCurrentFolder(folderData);
            setIsPlaylistView(folderData.type === 'VIDEO_PLAYLIST');
          }
        } else {
          setCurrentFolder(null);
          setIsPlaylistView(false);
        }
      } catch (err) {
        console.error('Error loading resources:', err);
      }
    };

    loadData();
  }, [currentFolderId, debouncedSearchTerm, dateRange, fileType, hasPin, hasExpiry, sortBy, sortOrder, fetchResources]);

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

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
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
        
        toast({ 
          title: 'Recurso Movido', 
          description: `"${resourceToMove.title}" se movió correctamente.` 
        });
        
        fetchResources({
          parentId: currentFolderId,
          search: debouncedSearchTerm
        });
      } catch (e) {
        toast({ 
          title: 'Error', 
          description: 'No se pudo mover el recurso.', 
          variant: 'destructive' 
        });
      }
    }
  }, [currentFolderId, debouncedSearchTerm, fetchResources, toast]);

  const handleOpenPlaylistEditor = useCallback(async (resource: AppResourceType) => {
    try {
      const response = await fetch(`/api/resources?parentId=${resource.id}`);
      if (!response.ok) throw new Error('No se pudieron cargar los videos de la lista.');
      const data = await response.json();
      const playlistWithChildren = { ...resource, children: data.resources || [] };
      setPlaylistToEdit(playlistWithChildren);
      setIsPlaylistCreatorOpen(true);
    } catch (err) {
      toast({ 
        title: "Error", 
        description: (err as Error).message, 
        variant: "destructive" 
      });
    }
  }, [toast]);

  const handleBulkAction = useCallback(async (action: 'pin' | 'download' | 'delete') => {
    if (selectedIds.size === 0) return;

    try {
      let endpoint = '';
      let method = 'POST';
      
      switch (action) {
        case 'download':
          endpoint = '/api/resources/bulk-download';
          break;
        case 'pin':
          endpoint = '/api/resources/bulk-pin';
          break;
        case 'delete':
          endpoint = '/api/resources/bulk-delete';
          break;
      }

      const response = await fetch(endpoint, {
        method,
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
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: 'Acción completada',
        description: `${selectedIds.size} recursos procesados`
      });

      fetchResources({
        parentId: currentFolderId,
        search: debouncedSearchTerm
      });
      setSelectedIds(new Set());
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo completar la acción',
        variant: 'destructive'
      });
    }
  }, [selectedIds, toast, fetchResources, currentFolderId, debouncedSearchTerm]);

  const handleTogglePin = useCallback(async (resource: AppResourceType) => {
    try {
      await fetch(`/api/resources/${resource.id}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !resource.isPinned }),
      });
      
      toast({ 
        description: `Recurso ${resource.isPinned ? 'desfijado' : 'fijado'}.` 
      });
      
      fetchResources({
        parentId: currentFolderId,
        search: debouncedSearchTerm
      });
    } catch (err) {
      toast({ 
        title: "Error", 
        description: (err as Error).message, 
        variant: "destructive" 
      });
    }
  }, [currentFolderId, debouncedSearchTerm, fetchResources, toast]);

  const handleSaveSuccess = useCallback(() => {
    setResourceToEdit(null);
    setIsFolderEditorOpen(false);
    setFolderToEdit(null);
    setIsPlaylistCreatorOpen(false);
    setPlaylistToEdit(null);
    setIsUploaderOpen(false);
    
    fetchResources({
      parentId: currentFolderId,
      search: debouncedSearchTerm
    });
  }, [currentFolderId, debouncedSearchTerm, fetchResources]);

  const confirmDelete = useCallback(async () => {
    if (!resourceToDelete) return;
    
    try {
      const res = await fetch(`/api/resources/${resourceToDelete.id}`, { 
        method: 'DELETE' 
      });
      
      if (!res.ok) throw new Error((await res.json()).message || 'No se pudo eliminar el recurso.');
      
      toast({ 
        title: "Recurso eliminado",
        description: `"${resourceToDelete.title}" ha sido eliminado.`
      });
      
      fetchResources({
        parentId: currentFolderId,
        search: debouncedSearchTerm
      });
    } catch (err) {
      toast({ 
        title: "Error", 
        description: (err as Error).message, 
        variant: "destructive" 
      });
    } finally {
      setResourceToDelete(null);
    }
  }, [resourceToDelete, currentFolderId, debouncedSearchTerm, fetchResources, toast]);

  const handleBulkDelete = useCallback(async () => {
    try {
      const res = await fetch('/api/resources/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      
      if (!res.ok) throw new Error((await res.json()).message || "Error al eliminar.");
      
      toast({ 
        description: `${selectedIds.size} elemento(s) eliminados.` 
      });
      
      fetchResources({
        parentId: currentFolderId,
        search: debouncedSearchTerm
      });
    } catch (err) {
      toast({ 
        title: "Error", 
        description: (err as Error).message, 
        variant: 'destructive' 
      });
    } finally {
      setResourceToDelete(null);
      setSelectedIds(new Set());
    }
  }, [selectedIds, currentFolderId, debouncedSearchTerm, fetchResources, toast]);

  const handleSelectionChange = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (id === 'all') {
        if (checked) {
          filteredResources.forEach(r => newSet.add(r.id));
        } else {
          filteredResources.forEach(r => newSet.delete(r.id));
        }
      } else {
        if (checked) newSet.add(id);
        else newSet.delete(id);
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
    if (isLoadingData) {
      return (
        <div className="space-y-6">
          <ResourceStats resources={[]} />
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
          <Button onClick={() => fetchResources({
            parentId: currentFolderId,
            search: debouncedSearchTerm
          })}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </motion.div>
      );
    }

    if (isPlaylistView && currentFolder) {
      return (
        <VideoPlaylistView 
          resources={allApiResources} 
          folder={currentFolder} 
        />
      );
    }

    if (filteredResources.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center space-y-6"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center">
            <FolderOpen className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">
              {searchTerm ? 'No se encontraron resultados' : 'Biblioteca vacía'}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchTerm 
                ? 'No hay recursos que coincidan con tu búsqueda. Intenta con otros términos.'
                : 'Comienza agregando recursos a tu biblioteca para organizar y compartir con tu equipo.'
              }
            </p>
          </div>
          {canManage && (
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setIsFolderEditorOpen(true)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                Nueva Carpeta
              </Button>
              <Button onClick={() => setIsUploaderOpen(true)} variant="secondary">
                <UploadCloud className="mr-2 h-4 w-4" />
                Subir Archivos
              </Button>
              <Button onClick={() => setIsPlaylistCreatorOpen(true)} variant="outline">
                <ListVideo className="mr-2 h-4 w-4" />
                Nueva Lista
              </Button>
            </div>
          )}
        </motion.div>
      );
    }

    return (
      <div className="space-y-8">
        <ResourceStats resources={filteredResources} />
        
        {Object.entries(groupedResources).map(([category, resources]) => (
          <motion.section
            key={category}
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
                {category === 'Archivos' && <FileQuestion className="h-5 w-5" />}
                {category}
                <Badge variant="outline" className="ml-2">
                  {resources.length}
                </Badge>
              </h3>
              
              {category === 'Archivos' && resources.length > 0 && (
                <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewMode('list')}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Vista de lista</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewMode('grid')}
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Vista de cuadrícula</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewMode('table')}
                        >
                          <Table className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Vista de tabla</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>

            {viewMode === 'grid' || category !== 'Archivos' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {resources.map((resource) => (
                  <ResourceGridItem
                    key={resource.id}
                    resource={resource}
                    onSelect={() => handlePreviewResource(resource)}
                    onEdit={(resource.type === 'FOLDER' || resource.type === 'VIDEO_PLAYLIST') 
                      ? resource.type === 'VIDEO_PLAYLIST' 
                        ? () => handleOpenPlaylistEditor(resource)
                        : () => { setFolderToEdit(resource); setIsFolderEditorOpen(true); }
                      : setResourceToEdit
                    }
                    onDelete={setResourceToDelete}
                    onNavigate={handleNavigateFolder}
                    onRestore={() => {}}
                    onTogglePin={handleTogglePin}
                    isSelected={selectedIds.has(resource.id)}
                    onSelectionChange={handleSelectionChange}
                    showThumbnail={showThumbnails}
                  />
                ))}
              </div>
            ) : viewMode === 'list' ? (
              <ResourceListItem
                resources={resources}
                onSelect={handlePreviewResource}
                onEdit={setResourceToEdit}
                onDelete={setResourceToDelete}
                onRestore={() => {}}
                onTogglePin={handleTogglePin}
                selectedIds={selectedIds}
                onSelectionChange={handleSelectionChange}
              />
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-semibold">
                          <Checkbox
                            checked={selectedIds.size === resources.length && resources.length > 0}
                            onCheckedChange={(checked) => handleSelectionChange('all', !!checked)}
                          />
                        </th>
                        <th className="text-left p-4 font-semibold">Nombre</th>
                        <th className="text-left p-4 font-semibold">Tipo</th>
                        <th className="text-left p-4 font-semibold">Tamaño</th>
                        <th className="text-left p-4 font-semibold">Fecha</th>
                        <th className="text-left p-4 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resources.map((resource) => (
                        <tr key={resource.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-4">
                            <Checkbox
                              checked={selectedIds.has(resource.id)}
                              onCheckedChange={(checked) => handleSelectionChange(resource.id, !!checked)}
                            />
                          </td>
                          <td className="p-4 font-medium">{resource.title}</td>
                          <td className="p-4">
                            <Badge variant="outline">
                              {resource.fileType || resource.type}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {formatFileSize(resource.fileSize || 0)}
                          </td>
                          <td className="p-4">
                            {new Date(resource.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handlePreviewResource(resource)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setResourceToEdit(resource)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setResourceToDelete(resource)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
    );
  };

  const activeFilterCount = useMemo(() => {
    return [
      dateRange?.from || dateRange?.to ? 1 : 0,
      fileType !== 'all' ? 1 : 0,
      hasPin ? 1 : 0,
      hasExpiry ? 1 : 0,
      tagsFilter ? 1 : 0
    ].reduce((a, b) => a + b, 0);
  }, [dateRange, fileType, hasPin, hasExpiry, tagsFilter]);

  if (!user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
      <div className={cn(
        "grid transition-all duration-300 items-start min-h-screen",
        isSidebarVisible ? "grid-cols-1 lg:grid-cols-[280px_1fr] gap-6" : "grid-cols-1 gap-0"
      )}>
        {/* Sidebar Navigation */}
        <AnimatePresence mode="wait">
          {isSidebarVisible ? (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:block sticky top-6 h-[calc(100vh-3rem)] overflow-y-auto pb-6"
            >
              <div className="space-y-6 p-4">
                <div className="pb-4 mb-4 border-b flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-lg truncate">Explorador</h2>
                    <p className="text-sm text-muted-foreground truncate">Navega por tu biblioteca</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarVisible(false)}
                    className="h-8 w-8 shrink-0 hover:bg-muted"
                    title="Ocultar panel lateral"
                  >
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </Button>
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
                      <Switch
                        checked={showThumbnails}
                        onCheckedChange={setShowThumbnails}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </motion.aside>
          ) : (
            <div className="hidden lg:block"></div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="space-y-6 min-w-0 relative p-4 md:p-6">
          {!isSidebarVisible && (
            <div className="hidden lg:block absolute -left-8 top-0 h-full w-8 z-20">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsSidebarVisible(true)}
                className="absolute left-0 top-4 h-8 w-8 rounded-full shadow-md bg-background border-primary/20 hover:bg-primary/5 hover:scale-110 transition-transform"
                title="Mostrar panel lateral"
              >
                <PanelLeftOpen className="h-4 w-4 text-primary" />
              </Button>
            </div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
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
                  className="lg:hidden"
                >
                  {isSidebarVisible ? (
                    <PanelLeftClose className="h-4 w-4" />
                  ) : (
                    <PanelLeftOpen className="h-4 w-4" />
                  )}
                </Button>
                
                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nuevo
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setFolderToEdit(null);
                        setIsFolderEditorOpen(true);
                      }}>
                        <FolderIcon className="mr-2 h-4 w-4" />
                        Nueva Carpeta
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setPlaylistToEdit(null);
                        setIsPlaylistCreatorOpen(true);
                      }}>
                        <ListVideo className="mr-2 h-4 w-4" />
                        Nueva Lista de Videos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsUploaderOpen(true)}>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Subir Archivo/Enlace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* View Selector */}
            {!isPlaylistView && (
              <div className="flex items-center gap-2 border-b overflow-x-auto">
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
                  <Star className="mr-2 h-4 w-4" />
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
                <Button
                  variant={resourceView === 'unread' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setResourceView('unread')}
                  className="rounded-b-none"
                >
                  <EyeOff className="mr-2 h-4 w-4" />
                  No vistos
                </Button>
              </div>
            )}

            {/* Search and Filters */}
            {!isPlaylistView && (
              <Card className="p-4 bg-card shadow-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative w-full flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar en la carpeta actual..." 
                      className="pl-10 h-10 text-base rounded-md" 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                    />
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
                        <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder('asc'); }}>
                          Nombre (A-Z)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder('desc'); }}>
                          Nombre (Z-A)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('desc'); }}>
                          Más recientes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('asc'); }}>
                          Más antiguos
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setSortBy('size'); setSortOrder('desc'); }}>
                          Tamaño (Mayor-Menor)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSortBy('size'); setSortOrder('asc'); }}>
                          Tamaño (Menor-Mayor)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-10 flex-grow md:flex-none">
                          <Filter className="mr-2 h-4 w-4" /> 
                          Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="end">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none">Filtros Avanzados</h4>
                            <p className="text-sm text-muted-foreground">Refina tu búsqueda de recursos.</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Fecha de subida</Label>
                            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Tipo de Archivo</Label>
                            <Select value={fileType} onValueChange={setFileType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="image">Imagen</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="doc">Documento</SelectItem>
                                <SelectItem value="xls">Hoja de cálculo</SelectItem>
                                <SelectItem value="ppt">Presentación</SelectItem>
                                <SelectItem value="zip">ZIP</SelectItem>
                                <SelectItem value="other">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="hasPin" 
                              checked={hasPin} 
                              onCheckedChange={(c) => setHasPin(!!c)} 
                            />
                            <Label htmlFor="hasPin">Con PIN</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="hasExpiry" 
                              checked={hasExpiry} 
                              onCheckedChange={(c) => setHasExpiry(!!c)} 
                            />
                            <Label htmlFor="hasExpiry">Con Vencimiento</Label>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="tags-filter">Etiquetas (separadas por coma)</Label>
                            <Input 
                              id="tags-filter" 
                              placeholder="ej. urgente, revisión" 
                              value={tagsFilter} 
                              onChange={e => setTagsFilter(e.target.value)} 
                            />
                          </div>
                          
                          <Button onClick={() => setIsFilterPopoverOpen(false)}>
                            Aplicar Filtros
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </Card>
            )}
          </motion.div>

          {/* Breadcrumbs */}
          <EnhancedBreadcrumbs
            breadcrumbs={breadcrumbs}
            onBreadcrumbClick={handleBreadcrumbClick}
          />

          {/* Main Content */}
          <div ref={containerRef}>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && canManage && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
          >
            <Card className="px-4 py-3 shadow-xl border-2">
              <div className="flex items-center justify-between gap-4">
                <p className="px-2 text-sm font-semibold">
                  {selectedIds.size} seleccionado{selectedIds.size > 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsMoveModalOpen(true)}
                  >
                    <FolderInput className="mr-2 h-4 w-4" />
                    Mover
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleBulkAction('download')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setResourceToDelete({ id: 'bulk' } as any)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
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

      {/* Modals */}
      <MoveResourceModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        resourceIds={Array.from(selectedIds)}
        onMoveSuccess={() => { 
          setSelectedIds(new Set()); 
          fetchResources({
            parentId: currentFolderId,
            search: debouncedSearchTerm
          }); 
        }}
      />

      <ResourcePreviewModal
        resource={previewingResource}
        onClose={() => setPreviewingResource(null)}
        onNavigate={(direction) => {
          const fileResources = allApiResources.filter(r => 
            r.type !== 'FOLDER' && r.type !== 'VIDEO_PLAYLIST'
          );
          
          if (fileResources.length <= 1 || !previewingResource) return;
          
          const currentIndex = fileResources.findIndex(r => r.id === previewingResource.id);
          if (currentIndex === -1) return;
          
          let nextIndex;
          if (direction === 'next') {
            nextIndex = (currentIndex + 1) % fileResources.length;
          } else {
            nextIndex = (currentIndex - 1 + fileResources.length) % fileResources.length;
          }
          
          setPreviewingResource(fileResources[nextIndex]);
          addRecentResource(fileResources[nextIndex].id);
        }}
      />

      <ResourceEditorModal
        isOpen={isUploaderOpen || !!resourceToEdit}
        onClose={() => { 
          setResourceToEdit(null); 
          setIsUploaderOpen(false); 
        }}
        resource={resourceToEdit}
        parentId={currentFolderId}
        onSave={handleSaveSuccess}
      />

      <FolderEditorModal
        isOpen={isFolderEditorOpen}
        onClose={() => { 
          setIsFolderEditorOpen(false); 
          setFolderToEdit(null); 
        }}
        onSave={handleSaveSuccess}
        parentId={currentFolderId}
        folderToEdit={folderToEdit}
      />

      <PlaylistCreatorModal
        isOpen={isPlaylistCreatorOpen}
        onClose={() => { 
          setIsPlaylistCreatorOpen(false); 
          setPlaylistToEdit(null); 
        }}
        onSave={handleSaveSuccess}
        parentId={currentFolderId}
        playlistToEdit={playlistToEdit}
      />

      {/* Delete Confirmation Dialog */}
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
            <AlertDialogAction 
              onClick={() => resourceToDelete?.id === 'bulk' ? handleBulkDelete() : confirmDelete()} 
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Sí, eliminar
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