'use client';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { AppResourceType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Search, Filter, ChevronLeft, ChevronRight, Grid, List, Table,
  FolderPlus, UploadCloud, ListVideo, Star, Clock, EyeOff,
  HardDrive, BarChart3, Zap, Users, FolderOpen, MoreVertical,
  Download, Trash2, Move, Copy, Share2, Eye, X, RefreshCw,
  PanelLeftOpen, PanelLeftClose, ArrowUpDown, PlusCircle,
  Image as ImageIcon, Video as VideoIcon, FileText, FileQuestion,
  AlertTriangle, Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence, motion } from 'framer-motion';
import { useDebounce } from '@/hooks/use-debounce';
import { ResourceGridItem } from '@/components/resources/resource-grid-item';
import { ResourcePreviewModal } from '@/components/resources/resource-preview-modal';
import { ResourceEditorModal } from '@/components/resources/resource-editor-modal';
import { FolderEditorModal } from '@/components/resources/folder-editor-modal';
import { PlaylistCreatorModal } from '@/components/resources/playlist-creator-modal';
import { MoveResourceModal } from '@/components/resources/move-resource-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Custom hook para gestión de recursos
const useResourceManager = () => {
  const [resources, setResources] = useState<AppResourceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchResources = useCallback(async (params?: {
    parentId?: string | null;
    search?: string;
    filters?: any;
  }) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        status: 'ACTIVE',
        ...(params?.parentId && { parentId: params.parentId }),
        ...(params?.search && { search: params.search }),
        ...params?.filters
      });

      const response = await fetch(`/api/resources?${queryParams}`);
      if (!response.ok) throw new Error('Error al cargar recursos');
      
      const data = await response.json();
      setResources(data.resources || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  return { resources, isLoading, error, fetchResources, setResources };
};

// Componente de estadísticas con protección
const ResourceStats = ({ resources }: { resources: AppResourceType[] }) => {
  const safeResources = Array.isArray(resources) ? resources : [];
  
  const stats = useMemo(() => {
    const totalSize = safeResources.reduce((sum, r) => sum + ((r?.fileSize) || 0), 0);
    const favorites = safeResources.filter(r => r?.isPinned).length;
    const unread = safeResources.filter(r => !r?.isViewed).length;
    
    return {
      total: safeResources.length,
      size: formatFileSize(totalSize),
      favorites,
      unread
    };
  }, [safeResources]);

  const statCards = [
    { label: 'Total', value: stats.total, icon: HardDrive, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Tamaño', value: stats.size, icon: BarChart3, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Favoritos', value: stats.favorites, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'No vistos', value: stats.unread, icon: EyeOff, color: 'text-purple-500', bg: 'bg-purple-50' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {statCards.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label} className={`p-4 ${bg} dark:bg-opacity-10`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
            <Icon className={`h-8 w-8 ${color} opacity-80`} />
          </div>
        </Card>
      ))}
    </div>
  );
};

// Componente de vista rápida
const QuickActions = ({ onFolder, onUpload, onPlaylist }: any) => (
  <div className="flex gap-2">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline" onClick={onFolder}>
            <FolderPlus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Nueva carpeta</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline" onClick={onUpload}>
            <UploadCloud className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Subir archivo</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline" onClick={onPlaylist}>
            <ListVideo className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Nueva lista</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

// Componente principal rediseñado
export default function ResourcesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Estados de modales
  const [showUploader, setShowUploader] = useState(false);
  const [showFolderEditor, setShowFolderEditor] = useState(false);
  const [showPlaylistEditor, setShowPlaylistEditor] = useState(false);
  const [previewResource, setPreviewResource] = useState<AppResourceType | null>(null);
  const [deleteResource, setDeleteResource] = useState<AppResourceType | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  
  // Estados de filtro
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [fileType, setFileType] = useState('all');
  const [dateRange, setDateRange] = useState<any>(undefined);

  const debouncedSearch = useDebounce(searchTerm, 300);
  const { resources, isLoading, error, fetchResources } = useResourceManager();
  
  // Filtrado optimizado con protección
  const filteredResources = useMemo(() => {
    if (!Array.isArray(resources)) return [];
    
    let filtered = [...resources];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r?.title?.toLowerCase().includes(term) ||
        r?.description?.toLowerCase().includes(term) ||
        r?.tags?.some(t => t?.toLowerCase().includes(term))
      );
    }
    
    if (fileType !== 'all') {
      filtered = filtered.filter(r => r?.fileType === fileType);
    }
    
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name': 
          comparison = (a?.title || '').localeCompare(b?.title || ''); 
          break;
        case 'size': 
          comparison = (a?.fileSize || 0) - (b?.fileSize || 0); 
          break;
        default: 
          comparison = new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime();
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [resources, searchTerm, fileType, sortBy, sortOrder]);

  // Efectos
  useEffect(() => {
    fetchResources({ parentId: currentFolderId, search: debouncedSearch });
  }, [currentFolderId, debouncedSearch, fetchResources]);

  // Handlers optimizados
  const handleBulkAction = useCallback(async (action: 'delete' | 'download' | 'move') => {
    if (selectedIds.size === 0) return;
    
    try {
      const endpoint = {
        delete: '/api/resources/bulk-delete',
        download: '/api/resources/bulk-download',
        move: '/api/resources/bulk-move'
      }[action];

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });

      if (response.ok) {
        toast({ title: 'Acción completada', description: `${selectedIds.size} recursos procesados` });
        setSelectedIds(new Set());
        fetchResources();
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Acción fallida', 
        variant: 'destructive' 
      });
    }
  }, [selectedIds, toast, fetchResources]);

  const handleResourceClick = useCallback((resource: AppResourceType) => {
    if (!resource) return;
    
    if (resource.type === 'FOLDER') {
      setCurrentFolderId(resource.id);
    } else {
      setPreviewResource(resource);
    }
  }, []);

  const handleRetry = useCallback(() => {
    fetchResources({ parentId: currentFolderId, search: debouncedSearch });
  }, [fetchResources, currentFolderId, debouncedSearch]);

  // Renderizado de contenido
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <ResourceStats resources={[]} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </Card>
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
          className="text-center py-16 space-y-6"
        >
          <AlertTriangle className="mx-auto h-16 w-16 text-destructive/60" />
          <div>
            <h3 className="text-lg font-semibold text-destructive mb-2">Error de carga</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={handleRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
        </motion.div>
      );
    }

    if (!filteredResources || filteredResources.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 space-y-6"
        >
          <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <FolderOpen className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">
              {searchTerm ? 'Sin resultados' : 'Biblioteca vacía'}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchTerm 
                ? 'Prueba con otros términos de búsqueda'
                : 'Comienza agregando recursos a tu biblioteca'
              }
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setShowFolderEditor(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Nueva Carpeta
            </Button>
            <Button onClick={() => setShowUploader(true)} variant="secondary">
              <UploadCloud className="mr-2 h-4 w-4" />
              Subir Archivos
            </Button>
          </div>
        </motion.div>
      );
    }

    return (
      <div className="space-y-6">
        <ResourceStats resources={filteredResources} />
        
        <div className={`gap-4 ${viewMode === 'grid' 
          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
          : 'space-y-2'
        }`}>
          {filteredResources.map((resource) => (
            resource && (
              <ResourceGridItem
                key={resource.id}
                resource={resource}
                viewMode={viewMode}
                isSelected={selectedIds.has(resource.id)}
                onSelect={() => handleResourceClick(resource)}
                onSelectionChange={(id, checked) => {
                  const newSet = new Set(selectedIds);
                  checked ? newSet.add(id) : newSet.delete(id);
                  setSelectedIds(newSet);
                }}
              />
            )
          ))}
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/10">
      {/* Header principal */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
            >
              {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
            </Button>
            
            <div className="hidden md:flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Recursos</h1>
              {Array.isArray(filteredResources) && (
                <Badge variant="outline" className="ml-2">
                  {filteredResources.length}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Barra de búsqueda */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar recursos..."
                className="pl-9 pr-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Acciones rápidas */}
            <QuickActions
              onFolder={() => setShowFolderEditor(true)}
              onUpload={() => setShowUploader(true)}
              onPlaylist={() => setShowPlaylistEditor(true)}
            />
          </div>
        </div>
      </header>

      <div className="container px-4 md:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Colapsable */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] overflow-hidden"
              >
                <Card className="h-full p-4 space-y-6">
                  {/* Filtros rápidos */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Vista</h3>
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="grid grid-cols-3">
                        <TabsTrigger value="all">
                          <Grid className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="favorites">
                          <Star className="h-4 w-4" />
                        </TabsTrigger>
                        <TabsTrigger value="recent">
                          <Clock className="h-4 w-4" />
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Ordenación */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Ordenar por</h3>
                    <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Fecha</SelectItem>
                        <SelectItem value="name">Nombre</SelectItem>
                        <SelectItem value="size">Tamaño</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
                      className="w-full"
                    >
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      {sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                    </Button>
                  </div>

                  {/* Tipo de archivo */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Tipo</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'all', label: 'Todos', icon: FileQuestion },
                        { value: 'image', label: 'Imágenes', icon: ImageIcon },
                        { value: 'video', label: 'Videos', icon: VideoIcon },
                        { value: 'pdf', label: 'PDFs', icon: FileText }
                      ].map(({ value, label, icon: Icon }) => (
                        <Button
                          key={value}
                          variant={fileType === value ? 'secondary' : 'ghost'}
                          className="w-full justify-start"
                          onClick={() => setFileType(value)}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Filtros avanzados */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros avanzados
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <h4 className="font-medium">Rango de fechas</h4>
                        <DateRangePicker
                          date={dateRange}
                          onDateChange={setDateRange}
                        />
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => setDateRange(undefined)}
                        >
                          Limpiar filtros
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </Card>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Contenido principal */}
          <main className="flex-1 min-w-0">
            {/* Barra de herramientas */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="flex gap-1 p-1 rounded-lg bg-muted">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                          size="icon"
                          onClick={() => setViewMode('grid')}
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Vista cuadrícula</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                          size="icon"
                          onClick={() => setViewMode('list')}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Vista lista</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                          size="icon"
                          onClick={() => setViewMode('table')}
                        >
                          <Table className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Vista tabla</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {Array.isArray(filteredResources) && (
                  <Badge variant="outline" className="hidden sm:flex">
                    {filteredResources.length} elementos
                  </Badge>
                )}
              </div>

              {selectedIds.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm font-medium">
                    {selectedIds.size} seleccionados
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMoveModal(true)}
                  >
                    <Move className="h-4 w-4 mr-2" />
                    Mover
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('download')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteResource({ id: 'bulk' } as any)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Contenido */}
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Barra de acciones flotante */}
      <AnimatePresence>
        {selectedIds.size === 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Card className="p-2 shadow-xl">
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" className="h-12 w-12 rounded-full">
                      <PlusCircle className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowFolderEditor(true)}>
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Nueva carpeta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowUploader(true)}>
                      <UploadCloud className="h-4 w-4 mr-2" />
                      Subir archivo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowPlaylistEditor(true)}>
                      <ListVideo className="h-4 w-4 mr-2" />
                      Nueva lista de videos
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modales */}
      <ResourcePreviewModal
        resource={previewResource}
        onClose={() => setPreviewResource(null)}
      />

      <ResourceEditorModal
        isOpen={showUploader}
        onClose={() => setShowUploader(false)}
        parentId={currentFolderId}
        onSave={() => {
          setShowUploader(false);
          fetchResources();
        }}
      />

      <FolderEditorModal
        isOpen={showFolderEditor}
        onClose={() => setShowFolderEditor(false)}
        onSave={() => {
          setShowFolderEditor(false);
          fetchResources();
        }}
      />

      <PlaylistCreatorModal
        isOpen={showPlaylistEditor}
        onClose={() => setShowPlaylistEditor(false)}
        onSave={() => {
          setShowPlaylistEditor(false);
          fetchResources();
        }}
      />

      <MoveResourceModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        resourceIds={Array.from(selectedIds)}
        onMoveSuccess={() => {
          setShowMoveModal(false);
          setSelectedIds(new Set());
          fetchResources();
        }}
      />

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={!!deleteResource} onOpenChange={(open) => !open && setDeleteResource(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteResource?.id === 'bulk' 
                ? `¿Eliminar ${selectedIds.size} elementos?`
                : '¿Eliminar recurso?'
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteResource?.id === 'bulk'
                ? `Se eliminarán ${selectedIds.size} elementos permanentemente. Esta acción no se puede deshacer.`
                : `El recurso será eliminado permanentemente. Esta acción no se puede deshacer.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteResource?.id === 'bulk') {
                  handleBulkAction('delete');
                } else if (deleteResource) {
                  // Aquí deberías implementar la eliminación individual
                  toast({ title: 'Funcionalidad en desarrollo', description: 'Eliminación individual' });
                }
                setDeleteResource(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper function con protección
function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}