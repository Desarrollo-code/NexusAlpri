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
  Zap, ChevronLeft, Sparkles, Layers,
  Share2, Copy, ExternalLink, Info, Tag, Calendar, User, Hash, File
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

// Modal de detalles del recurso
function ResourceDetailsModal({
  resource,
  isOpen,
  onClose
}: {
  resource: AppResourceType | null;
  isOpen: boolean;
  onClose: () => void
}) {
  if (!resource) return null;

  const getResourceIcon = () => {
    if (resource.type === 'FOLDER') return <FolderIcon className="h-12 w-12 text-blue-500" />;
    if (resource.type === 'VIDEO_PLAYLIST') return <ListVideo className="h-12 w-12 text-purple-500" />;
    if (resource.filetype === 'pdf') return <FileText className="h-12 w-12 text-red-500" />;
    if (resource.filetype?.startsWith('image/')) return <ImageIcon className="h-12 w-12 text-green-500" />;
    if (resource.filetype?.startsWith('video/')) return <VideoIcon className="h-12 w-12 text-amber-500" />;
    return <File className="h-12 w-12 text-gray-500" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              {getResourceIcon()}
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">{resource.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">
                  {resource.type === 'FOLDER' ? 'Carpeta' :
                    resource.type === 'VIDEO_PLAYLIST' ? 'Lista de reproducción' :
                      'Archivo'}
                </Badge>
                {resource.isPinned && <Badge className="bg-amber-500"><Star className="h-3 w-3 mr-1" />Favorito</Badge>}
                {resource.shared && <Badge className="bg-green-500"><Share2 className="h-3 w-3 mr-1" />Compartido</Badge>}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Descripción */}
          {resource.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Descripción</span>
              </div>
              <p className="text-sm bg-muted/30 p-3 rounded-lg">{resource.description}</p>
            </div>
          )}

          {/* Información detallada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha de creación</span>
                </div>
                <p className="text-sm">{formatDate(resource.uploadDate)}</p>
              </div>

              {resource.expiresAt && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Fecha de expiración</span>
                  </div>
                  <p className="text-sm">{formatDate(resource.expiresAt)}</p>
                </div>
              )}

              {resource.size && resource.type !== 'FOLDER' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    <span>Tamaño</span>
                  </div>
                  <p className="text-sm">{formatFileSize(resource.size)}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {resource.filetype && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <File className="h-4 w-4" />
                    <span>Tipo de archivo</span>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {resource.filetype}
                  </Badge>
                </div>
              )}

              {resource.uploadedBy && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Subido por</span>
                  </div>
                  <p className="text-sm">{resource.uploadedBy}</p>
                </div>
              )}

              {resource.downloadCount !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Download className="h-4 w-4" />
                    <span>Descargas</span>
                  </div>
                  <p className="text-sm">{resource.downloadCount}</p>
                </div>
              )}
            </div>
          </div>

          {/* Etiquetas */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>Etiquetas</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-primary/10">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Categoría */}
          {resource.category && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Layers className="h-4 w-4" />
                <span>Categoría</span>
              </div>
              <Badge variant="outline">{resource.category}</Badge>
            </div>
          )}

          {/* Información adicional */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>Información adicional</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Estado</p>
                <Badge variant={resource.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {resource.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Visto</p>
                <p>{resource.isViewed ? 'Sí' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cerrar
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-primary to-primary/80">
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 px-1"
    >
      <div className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id || 'root'}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 mx-1" />
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onBreadcrumbClick(crumb.id, index)}
              className={cn(
                "group flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                index === breadcrumbs.length - 1
                  ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-semibold border border-primary/20"
                  : "text-muted-foreground hover:text-primary hover:bg-accent/50"
              )}
              disabled={index === breadcrumbs.length - 1}
            >
              {index === 0 ? (
                <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <FolderOpen className="h-4 w-4 text-primary" />
                </div>
              ) : (
                <FolderIcon className="h-4 w-4" />
              )}
              <span className="truncate max-w-[120px] lg:max-w-[180px]">
                {crumb.title}
              </span>
            </motion.button>
          </React.Fragment>
        ))}
      </div>
    </motion.nav>
  );
}

// Componente Sidebar mejorado
function SidebarNavigation({
  isVisible,
  onToggle,
  currentFolderId,
  onNavigate
}: {
  isVisible: boolean;
  onToggle: () => void;
  currentFolderId: string | null;
  onNavigate: (resource: AppResourceType) => void;
}) {
  if (!isVisible) return null;

  return (
    <motion.aside
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: "spring", damping: 20 }}
      className="hidden lg:block sticky top-0 h-screen overflow-y-auto pb-24"
    >
      <ScrollArea className="h-full">
        <div className="space-y-6 p-6">
          {/* Header del Sidebar */}
          <div className="pb-4 border-b border-border/40">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Explorador
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Navega por tu biblioteca</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-8 w-8 rounded-full hover:bg-accent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs de Navegación */}
          <Tabs defaultValue="folders" className="w-full">
            <TabsList className="grid grid-cols-2 bg-gradient-to-r from-muted/50 to-muted/30 p-1">
              <TabsTrigger value="folders" className="data-[state=active]:bg-background">
                <FolderIcon className="h-4 w-4 mr-2" />
                Carpetas
              </TabsTrigger>
              <TabsTrigger value="tags" className="data-[state=active]:bg-background">
                <Layers className="h-4 w-4 mr-2" />
                Etiquetas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="folders" className="mt-4">
              <FolderTree
                currentFolderId={currentFolderId}
                onNavigate={onNavigate}
                compact
              />
            </TabsContent>

            <TabsContent value="tags" className="mt-4">
              <div className="space-y-4">
                <Input
                  placeholder="Buscar etiquetas..."
                  className="bg-background/50 border-border/50"
                />
                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    { label: 'Urgente', color: 'bg-red-500/20 text-red-700' },
                    { label: 'Revisión', color: 'bg-amber-500/20 text-amber-700' },
                    { label: 'Importante', color: 'bg-blue-500/20 text-blue-700' },
                    { label: 'Archivo', color: 'bg-gray-500/20 text-gray-700' },
                    { label: 'Confidencial', color: 'bg-purple-500/20 text-purple-700' },
                    { label: 'Público', color: 'bg-green-500/20 text-green-700' }
                  ].map(tag => (
                    <Badge
                      key={tag.label}
                      className={`${tag.color} border-0 cursor-pointer hover:scale-105 transition-transform`}
                    >
                      {tag.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </motion.aside>
  );
}

// Componentes auxiliares mejorados
function LoadingState() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-muted/30 to-muted/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Skeleton className="aspect-square w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16 space-y-6"
    >
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-full flex items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-destructive mb-2">{error}</h3>
        <p className="text-muted-foreground">No se pudieron cargar los recursos. Inténtalo de nuevo.</p>
      </div>
      <Button
        onClick={onRetry}
        className="bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Reintentar
      </Button>
    </motion.div>
  );
}

function EmptyState({ canManage, searchTerm, onCreateFolder, onUpload }: {
  canManage: boolean;
  searchTerm: string;
  onCreateFolder: () => void;
  onUpload: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-16 text-center space-y-8"
    >
      <div className="w-40 h-40 mx-auto bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-full flex items-center justify-center">
        <div className="relative">
          <FolderOpen className="h-24 w-24 text-primary" />
          <Sparkles className="h-8 w-8 text-amber-500 absolute -top-2 -right-2 animate-pulse" />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-3">
          {searchTerm ? 'No se encontraron resultados' : 'Biblioteca vacía'}
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto text-lg">
          {searchTerm
            ? 'No hay recursos que coincidan con tu búsqueda. Intenta con otros términos.'
            : 'Comienza agregando recursos a tu biblioteca. ¡Es fácil y rápido!'}
        </p>
      </div>
      {canManage && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button
            onClick={onCreateFolder}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <FolderPlus className="mr-2 h-5 w-5" />
            Nueva Carpeta
          </Button>
          <Button
            onClick={onUpload}
            variant="secondary"
            className="border-2"
          >
            <UploadCloud className="mr-2 h-5 w-5" />
            Subir Archivos
          </Button>
          <Button variant="outline">
            <Sparkles className="mr-2 h-5 w-5" />
            Ver Tutorial
          </Button>
        </motion.div>
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
  onTogglePin,
  onShare,
  onDetails
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
  onShare: (resource: AppResourceType) => void;
  onDetails: (resource: AppResourceType) => void;
}) {
  const icons = {
    '📁 Carpetas': FolderIcon,
    '🎬 Listas de Videos': ListVideo,
    '📄 Documentos': FileText,
    '🖼️ Multimedia': VideoIcon,
    '📎 Otros Archivos': FileQuestion
  };
  const Icon = icons[category as keyof typeof icons] || FileQuestion;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{category}</h3>
            <p className="text-sm text-muted-foreground">
              {resources.length} {resources.length === 1 ? 'elemento' : 'elementos'}
            </p>
          </div>
        </div>
        {category === '📎 Otros Archivos' && resources.length > 0 && (
          <div className="flex items-center gap-1 p-1 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm">
            {(['grid', 'list', 'table'] as const).map(mode => (
              <TooltipProvider key={mode}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "p-2 rounded-md transition-all duration-200",
                        viewMode === mode
                          ? "bg-background shadow-sm"
                          : "hover:bg-accent/50"
                      )}
                      onClick={() => onViewModeChange(mode)}
                    >
                      {mode === 'list' && <List className="h-4 w-4" />}
                      {mode === 'grid' && <Grid className="h-4 w-4" />}
                      {mode === 'table' && <Table className="h-4 w-4" />}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Vista {mode === 'list' ? 'lista' : mode === 'grid' ? 'cuadrícula' : 'tabla'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </div>

      {viewMode === 'grid' || category !== '📎 Otros Archivos' ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
            >
              <ResourceGridItem
                resource={resource}
                onSelect={() => onPreview(resource)}
                onEdit={onEdit}
                onDelete={onDelete}
                onNavigate={onNavigate}
                onTogglePin={onTogglePin}
                onShare={onShare}
                onDetails={onDetails}
                isSelected={selectedIds.has(resource.id)}
                onSelectionChange={onSelectionChange}
              />
            </motion.div>
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <Card className="overflow-hidden border-0 shadow-lg">
          <ResourceListItem
            resources={resources}
            onSelect={onPreview}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePin={onTogglePin}
            onShare={onShare}
            onDetails={onDetails}
            selectedIds={selectedIds}
            onSelectionChange={onSelectionChange}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gradient-to-r from-muted/30 to-muted/10">
                  <th className="text-left p-4">
                    <Checkbox
                      checked={selectedIds.size === resources.length && resources.length > 0}
                      onCheckedChange={(c) => onSelectionChange('all', !!c)}
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
                {resources.map(resource => (
                  <tr
                    key={resource.id}
                    className="border-b hover:bg-gradient-to-r hover:from-accent/30 hover:to-accent/10 transition-colors"
                  >
                    <td className="p-4">
                      <Checkbox
                        checked={selectedIds.has(resource.id)}
                        onCheckedChange={(c) => onSelectionChange(resource.id, !!c)}
                      />
                    </td>
                    <td className="p-4 font-medium">{resource.title}</td>
                    <td className="p-4">
                      <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-primary/5">
                        {resource.filetype || resource.type}
                      </Badge>
                    </td>
                    <td className="p-4">{formatFileSize(resource.size || 0)}</td>
                    <td className="p-4">
                      {new Date(resource.uploadDate).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10"
                          onClick={() => onPreview(resource)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-blue-500/10"
                          onClick={() => onDetails(resource)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-green-500/10"
                          onClick={() => onEdit(resource)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-purple-500/10"
                          onClick={() => onShare(resource)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10"
                          onClick={() => onDelete(resource)}
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
  onViewChange,
  selectedCount
}: {
  canManage: boolean;
  isSidebarVisible: boolean;
  onToggleSidebar: () => void;
  onCreateFolder: () => void;
  onCreatePlaylist: () => void;
  onUpload: () => void;
  resourceView: 'all' | 'favorites' | 'recent' | 'unread' | 'shared';
  onViewChange: (view: 'all' | 'favorites' | 'recent' | 'unread' | 'shared') => void;
  selectedCount?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              <FolderOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-purple-600 bg-clip-text text-transparent">
                Biblioteca de Recursos
              </h1>
              <p className="text-muted-foreground text-lg">
                Gestiona y comparte documentos importantes, guías y materiales de formación
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:hidden rounded-full border-primary/20 hover:border-primary/40"
          >
            {isSidebarVisible ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Nuevo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-semibold">Crear nuevo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={onCreateFolder} className="cursor-pointer">
                    <FolderIcon className="mr-2 h-4 w-4" />
                    <span>Nueva Carpeta</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onCreatePlaylist} className="cursor-pointer">
                    <ListVideo className="mr-2 h-4 w-4" />
                    <span>Nueva Lista de Videos</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onUpload} className="cursor-pointer">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    <span>Subir Archivo/Enlace</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {([
          { key: 'all', label: 'Todos', icon: null },
          { key: 'favorites', label: 'Favoritos', icon: Star },
          { key: 'recent', label: 'Recientes', icon: Clock },
          { key: 'unread', label: 'No vistos', icon: Eye },
          { key: 'shared', label: 'Compartidos', icon: Share2 }
        ] as const).map(({ key, label, icon: Icon }) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewChange(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all duration-300",
              resourceView === key
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
                : "bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/30 text-muted-foreground"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
            {key === 'all' && selectedCount && selectedCount > 0 && (
              <Badge className="ml-2 bg-white/20 text-white/90">
                {selectedCount}
              </Badge>
            )}
          </motion.button>
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
    <Card className="p-6 bg-gradient-to-br from-background via-background to-primary/5 border-primary/20 shadow-lg">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="relative w-full flex-grow group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-xl blur-xl opacity-0 group-focus-within:opacity-30 transition-opacity duration-300" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Buscar recursos por nombre, descripción o etiquetas..."
            className="pl-12 h-12 text-base rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm focus-visible:border-primary focus-visible:ring-0 transition-all duration-300"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
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

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 px-4 rounded-xl border-border/50 hover:border-primary/50">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <span className="font-medium">
                  {sortBy === 'name' ? 'Nombre' :
                    sortBy === 'size' ? 'Tamaño' :
                      sortBy === 'type' ? 'Tipo' : 'Fecha'}
                </span>
                <Badge variant="outline" className="ml-2">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onSortChange('name', 'asc')}>
                  Nombre (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange('name', 'desc')}>
                  Nombre (Z-A)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSortChange('date', 'desc')}>
                  Más recientes primero
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange('date', 'asc')}>
                  Más antiguos primero
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSortChange('size', 'desc')}>
                  Tamaño (Mayor a menor)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange('size', 'asc')}>
                  Tamaño (Menor a mayor)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange('type', 'asc')}>
                  Tipo de archivo
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover open={isFilterOpen} onOpenChange={onFilterOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-12 px-4 rounded-xl border-border/50 hover:border-primary/50 relative"
              >
                <Filter className="mr-2 h-4 w-4" />
                <span className="font-medium">Filtros</span>
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 bg-primary text-primary-foreground">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96" align="end">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros Avanzados
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Refina tu búsqueda con múltiples criterios
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-medium">Fecha de subida</Label>
                    <DateRangePicker
                      date={dateRange}
                      onDateChange={onDateChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-medium">Tipo de Archivo</Label>
                    <Select value={fileType} onValueChange={onFileTypeChange}>
                      <SelectTrigger className="border-border/50">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        <SelectItem value="image">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Imágenes
                          </div>
                        </SelectItem>
                        <SelectItem value="video">
                          <div className="flex items-center gap-2">
                            <VideoIcon className="h-4 w-4" />
                            Videos
                          </div>
                        </SelectItem>
                        <SelectItem value="pdf">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Documentos PDF
                          </div>
                        </SelectItem>
                        <SelectItem value="doc">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Documentos Word
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <FileQuestion className="h-4 w-4" />
                            Otros tipos
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasPin"
                        checked={hasPin}
                        onCheckedChange={(c) => onHasPinChange(!!c)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <Label
                        htmlFor="hasPin"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Pin className="h-4 w-4" />
                        Con Pin
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasExpiry"
                        checked={hasExpiry}
                        onCheckedChange={(c) => onHasExpiryChange(!!c)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <Label
                        htmlFor="hasExpiry"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Clock className="h-4 w-4" />
                        Con Vencimiento
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags-filter" className="font-medium">
                      Etiquetas (separadas por coma)
                    </Label>
                    <Input
                      id="tags-filter"
                      placeholder="ej: urgente, revisión, confidencial"
                      value={tagsFilter}
                      onChange={e => onTagsFilterChange(e.target.value)}
                      className="border-border/50"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      onDateChange(undefined);
                      onFileTypeChange('all');
                      onHasPinChange(false);
                      onHasExpiryChange(false);
                      onTagsFilterChange('');
                      onFilterOpenChange(false);
                    }}
                  >
                    Limpiar
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                    onClick={() => onFilterOpenChange(false)}
                  >
                    Aplicar Filtros
                  </Button>
                </div>
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
  onShare,
  onClearSelection
}: {
  selectedIds: Set<string>;
  onMove: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onShare: () => void;
  onClearSelection: () => void;
}) {
  if (selectedIds.size === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 100, opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
    >
      <Card className="px-6 py-4 shadow-2xl border-2 border-primary/30 bg-gradient-to-r from-background via-background to-primary/5 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
              <Check className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">
                {selectedIds.size} {selectedIds.size === 1 ? 'recurso' : 'recursos'} seleccionado{selectedIds.size > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                Haz clic en una acción para continuar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onMove}
                    className="gap-2 hover:border-blue-500 hover:bg-blue-500/10"
                  >
                    <FolderInput className="h-4 w-4" />
                    <span className="hidden sm:inline">Mover</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mover a otra carpeta</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onShare}
                    className="gap-2 hover:border-green-500 hover:bg-green-500/10"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Compartir</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Compartir selección</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDownload}
                    className="gap-2 hover:border-purple-500 hover:bg-purple-500/10"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Descargar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Descargar selección</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-6" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDelete}
                    className="gap-2 bg-gradient-to-r from-destructive to-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Eliminar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Eliminar selección</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearSelection}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Limpiar selección</TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
  onCreatePlaylist,
  detailsResource,
  onCloseDetails,
  onDetails
}: any) {
  return (
    <>
      <MoveResourceModal isOpen={isMoveModalOpen} onClose={onCloseMoveModal} resourceIds={Array.from(selectedIds)} onMoveSuccess={onMoveSuccess} />
      <ResourcePreviewModal resource={previewingResource} onClose={onClosePreview} onNavigate={onNavigatePreview} />
      <ResourceDetailsModal resource={detailsResource} isOpen={!!detailsResource} onClose={onCloseDetails} />
      <ResourceEditorModal isOpen={isUploaderOpen || !!resourceToEdit} onClose={onCloseUploader} resource={resourceToEdit} parentId={parentId} onSave={onSaveSuccess} />
      <FolderEditorModal isOpen={isFolderEditorOpen} onClose={onCloseFolderEditor} onSave={onSaveFolderSuccess} parentId={parentId} folderToEdit={folderToEdit} />
      <PlaylistCreatorModal isOpen={isPlaylistCreatorOpen} onClose={onClosePlaylistCreator} onSave={onSaveSuccess} parentId={parentId} playlistToEdit={playlistToEdit} />

      <AlertDialog open={!!resourceToDelete} onOpenChange={(open) => !open && onCloseDelete()}>
        <AlertDialogContent className="border-2 border-destructive/20">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-destructive/10">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {resourceToDelete?.id === 'bulk'
                ? `Se eliminarán permanentemente los ${selectedIdsCount} elementos seleccionados. Esta acción no se puede deshacer.`
                : `El recurso "${resourceToDelete?.title}" será eliminado permanentemente. Si es una carpeta, debe estar vacía. Esta acción no se puede deshacer.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={resourceToDelete?.id === 'bulk' ? onBulkDelete : onConfirmDelete}
              className="bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QuickActionsFAB
        canManage={canManage}
        onCreateFolder={onCreateFolder}
        onUploadFile={onUploadFile}
        onCreatePlaylist={onCreatePlaylist}
      />

      <DragOverlay>
        {activeId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.8, scale: 0.95 }}
            className="shadow-2xl rounded-xl"
          >
            <ResourceGridItem
              resource={resources.find((r: AppResourceType) => r.id === activeId)!}
              onSelect={() => { }}
              onEdit={() => { }}
              onDelete={() => { }}
              onNavigate={() => { }}
              onTogglePin={() => { }}
              onShare={() => { }}
              onDetails={() => { }}
              isSelected={selected.has(activeId)}
              onSelectionChange={() => { }}
            />
          </motion.div>
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
  const [resourceView, setResourceView] = useState<'all' | 'favorites' | 'recent' | 'unread' | 'shared'>('all');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<AppResourceType | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, title: 'Biblioteca Principal' }]);

  // Estados de UI
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [detailsResource, setDetailsResource] = useState<AppResourceType | null>(null);

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

  // Atajos de teclado mejorados
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(new Set(allApiResources.map(r => r.id)));
        toast({
          title: "Todos seleccionados",
          description: `${allApiResources.length} recursos seleccionados`
        });
      }
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        toast({
          description: "Selección limpiada"
        });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]');
        searchInput?.focus();
        searchInput?.select();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsFolderEditorOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allApiResources, toast]);

  useEffect(() => {
    setPageTitle('📚 Biblioteca de Recursos - Gestor Inteligente');
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
    if (resourceView === 'shared') filtered = filtered.filter(r => r.shared);
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
      '📁 Carpetas': filtered.filter(r => r.type === 'FOLDER'),
      '🎬 Listas de Videos': filtered.filter(r => r.type === 'VIDEO_PLAYLIST'),
      '📄 Documentos': filtered.filter(r => ['pdf', 'doc', 'xls', 'ppt'].includes(r.filetype || '')),
      '🖼️ Multimedia': filtered.filter(r => ['image', 'video', 'audio'].includes(r.filetype || '')),
      '📎 Otros Archivos': filtered.filter(r => !['FOLDER', 'VIDEO_PLAYLIST'].includes(r.type))
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

        toast({
          title: '✅ Recurso Movido',
          description: `"${resourceToMove.title}" se movió correctamente.`,
          className: "border-l-4 border-l-green-500"
        });
        fetchResources({ parentId: currentFolderId, search: debouncedSearchTerm });
      } catch {
        toast({
          title: '❌ Error',
          description: 'No se pudo mover el recurso.',
          variant: 'destructive'
        });
      }
    }
  }, [currentFolderId, debouncedSearchTerm, fetchResources, toast]);

  const handleBulkAction = useCallback(async (action: 'download' | 'delete' | 'share') => {
    if (selectedIds.size === 0) return;

    try {
      const endpoint = action === 'download' ? '/api/resources/bulk-download' :
        action === 'share' ? '/api/resources/bulk-share' :
          '/api/resources/bulk-delete';

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

      toast({
        title: `✅ ${action === 'share' ? 'Recursos compartidos' : 'Acción completada'}`,
        description: `${selectedIds.size} recursos procesados`,
        className: "border-l-4 border-l-green-500"
      });

      fetchResources({ parentId: currentFolderId, search: debouncedSearchTerm });
      setSelectedIds(new Set());
    } catch {
      toast({
        title: '❌ Error',
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
        description: `✅ Recurso ${resource.isPinned ? 'desfijado' : 'fijado'}.`,
        className: "border-l-4 border-l-amber-500"
      });
      fetchResources({ parentId: currentFolderId, search: debouncedSearchTerm });
    } catch (err) {
      toast({
        title: "❌ Error",
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
    fetchResources({ parentId: currentFolderId, search: debouncedSearchTerm });

    toast({
      title: "✅ Guardado exitoso",
      description: "Los cambios se han guardado correctamente",
      className: "border-l-4 border-l-green-500"
    });
  }, [currentFolderId, debouncedSearchTerm, fetchResources, toast]);

  const confirmDelete = useCallback(async () => {
    if (!resourceToDelete) return;

    try {
      await fetch(`/api/resources/${resourceToDelete.id}`, { method: 'DELETE' });
      toast({
        title: "✅ Recurso eliminado",
        description: `"${resourceToDelete.title}" ha sido eliminado.`,
        className: "border-l-4 border-l-red-500"
      });
      fetchResources({ parentId: currentFolderId, search: debouncedSearchTerm });
    } catch (err) {
      toast({
        title: "❌ Error",
        description: (err as Error).message,
        variant: "destructive"
      });
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

  const handleShareResource = useCallback(async (resource: AppResourceType) => {
    try {
      const shareUrl = `${window.location.origin}/share/${resource.id}`;
      await navigator.clipboard.writeText(shareUrl);

      toast({
        title: "🔗 Enlace copiado",
        description: "El enlace de compartir ha sido copiado al portapapeles",
        className: "border-l-4 border-l-blue-500"
      });
    } catch (err) {
      toast({
        title: "❌ Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleResourceDetails = useCallback((resource: AppResourceType) => {
    setDetailsResource(resource);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setDetailsResource(null);
  }, []);

  // Renderizado condicional optimizado
  const renderContent = () => {
    if (isLoadingData) return <LoadingState />;
    if (error) return <ErrorState error={error} onRetry={() => fetchResources({ parentId: currentFolderId, search: debouncedSearchTerm })} />;
    if (currentFolder?.type === 'VIDEO_PLAYLIST') return <VideoPlaylistView resources={allApiResources} folder={currentFolder} />;
    if (filteredResources.length === 0) return <EmptyState
      canManage={canManage}
      searchTerm={searchTerm}
      onCreateFolder={() => setIsFolderEditorOpen(true)}
      onUpload={() => setIsUploaderOpen(true)}
    />;

    return (
      <div className="space-y-8">
        {/* Aquí se eliminó el ResourceStats */}
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
            onShare={handleShareResource}
            onDetails={handleResourceDetails}
          />
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center space-y-4">
          <div className="animate-spin">
            <Loader2 className="h-12 w-12 text-primary" />
          </div>
          <p className="text-muted-foreground">Cargando recursos...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext onDragStart={(e) => setActiveId(e.active.id)} onDragEnd={handleDragEnd} sensors={sensors}>
      <div className={cn(
        "grid transition-all duration-500 ease-in-out min-h-screen bg-gradient-to-br from-background via-background to-muted/20",
        isSidebarVisible ? "lg:grid-cols-[300px_1fr] gap-0" : "grid-cols-1"
      )}>
        <SidebarNavigation
          isVisible={isSidebarVisible}
          onToggle={() => setIsSidebarVisible(!isSidebarVisible)}
          currentFolderId={currentFolderId}
          onNavigate={handleNavigateFolder}
        />

        <main className="relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.015] pointer-events-none" />

          <div className="space-y-6 p-6 lg:p-8 relative" ref={setRootDroppableRef}>
            {!isSidebarVisible && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsSidebarVisible(true)}
                  className="hidden lg:flex absolute -left-12 top-6 h-10 w-10 rounded-full shadow-lg bg-background border-primary/20 hover:bg-primary/5"
                >
                  <PanelLeftOpen className="h-5 w-5 text-primary" />
                </Button>
              </motion.div>
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
              selectedCount={selectedIds.size}
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

            <motion.div
              ref={containerRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </main>
      </div>

      <SelectionActionBar
        selectedIds={selectedIds}
        onMove={() => setIsMoveModalOpen(true)}
        onDownload={() => handleBulkAction('download')}
        onDelete={() => setResourceToDelete({ id: 'bulk' } as any)}
        onShare={() => handleBulkAction('share')}
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
        detailsResource={detailsResource}
        onCloseDetails={handleCloseDetails}
        onDetails={handleResourceDetails}
      />
    </DndContext>
  );
}