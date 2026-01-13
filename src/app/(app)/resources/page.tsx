'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, Grid, List, Plus, Folder, File, Image as ImageIcon,
  Video, FileText, Star, Clock, TrendingUp, Download, Share2,
  MoreVertical, Trash2, Eye, Heart, Filter, SlidersHorizontal,
  ChevronRight, X, Upload, Sparkles, Zap, Archive, Loader2, ChevronLeft
} from 'lucide-react';
import { AppResourceType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ResourceEditorModal } from '@/components/resources/resource-editor-modal';
import { ResourcePreviewModal } from '@/components/resources/resource-preview-modal';
import { getFileTypeDetails } from '@/lib/resource-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

export default function ModernResourcesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [resources, setResources] = useState<AppResourceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [parentId, setParentId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string, title: string }[]>([]);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<AppResourceType | null>(null);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (parentId) params.append('parentId', parentId);
      if (selectedFilter !== 'todos') {
        const filterMap: Record<string, string> = {
          'imágenes': 'image',
          'videos': 'video',
          'documentos': 'pdf'
        };
        const apiFilter = filterMap[selectedFilter];
        if (apiFilter) params.append('fileType', apiFilter);
      }
      if (searchTerm) params.append('search', searchTerm);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await fetch(`/api/resources?${params.toString()}`);
      if (!response.ok) throw new Error('Error al cargar recursos');
      const data = await response.json();
      setResources(data.resources || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los recursos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [parentId, selectedFilter, searchTerm, sortBy, sortOrder, toast]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleFolderClick = (folder: AppResourceType) => {
    if (folder.type === 'FOLDER') {
      setParentId(folder.id);
      setBreadcrumb(prev => [...prev, { id: folder.id, title: folder.title }]);
    }
  };

  const handleBreadcrumbClick = (id: string | null, index: number) => {
    setParentId(id);
    if (id === null) {
      setBreadcrumb([]);
    } else {
      setBreadcrumb(prev => prev.slice(0, index + 1));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este recurso?')) return;
    try {
      const response = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      toast({ title: 'Éxito', description: 'Recurso eliminado correctamente' });
      fetchResources();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el recurso', variant: 'destructive' });
    }
  };

  const stats = useMemo(() => {
    const totalSize = resources.reduce((acc, curr) => acc + (curr.size || 0), 0);
    const sizeInGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);
    const sharedCount = resources.filter(r => r.sharingMode !== 'PUBLIC').length;
    const favoriteCount = resources.filter(r => r.isPinned).length;

    return [
      { label: 'Total Archivos', value: resources.length.toString(), icon: Archive, color: 'from-blue-500 to-cyan-500', trend: '+12%' },
      { label: 'Almacenamiento', value: `${sizeInGB} GB`, icon: TrendingUp, color: 'from-emerald-500 to-green-500', trend: '68%' },
      { label: 'Compartidos', value: sharedCount.toString(), icon: Share2, color: 'from-violet-500 to-purple-500', trend: '+8' },
      { label: 'Favoritos', value: favoriteCount.toString(), icon: Star, color: 'from-amber-500 to-orange-500', trend: '+5' },
    ];
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter(r =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [resources, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-300/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <header className="relative border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Media Library
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {filteredResources.length} recursos disponibles
                </p>
              </div>
            </div>

            <div className="flex-1 max-w-2xl mx-4 md:mx-8">
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                <Input
                  type="text"
                  placeholder="Buscar archivos, carpetas o contenido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 pl-12 pr-12 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border-2 border-transparent focus:border-violet-500 focus:bg-white dark:focus:bg-slate-950 transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="hidden lg:flex items-center gap-2 h-11 px-5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800"
                onClick={() => toast({ title: "Próximamente", description: "Filtros avanzados en desarrollo" })}
              >
                <Filter className="w-4 h-4" />
                <span className="font-medium text-sm">Filtros</span>
              </Button>

              <Button
                onClick={() => { setSelectedResource(null); setIsEditorOpen(true); }}
                className="flex items-center gap-2 h-11 px-6 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all border-none"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-[1800px] mx-auto px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide text-sm">
          <button
            onClick={() => handleBreadcrumbClick(null, -1)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors",
              parentId === null ? "text-violet-600 dark:text-violet-400 font-bold bg-violet-50 dark:bg-violet-950/30" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Archive className="w-4 h-4" />
            <span>Biblioteca</span>
          </button>

          {breadcrumb.map((item, index) => (
            <React.Fragment key={item.id}>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              <button
                onClick={() => handleBreadcrumbClick(item.id, index)}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap",
                  item.id === parentId ? "text-violet-600 dark:text-violet-400 font-bold bg-violet-50 dark:bg-violet-950/30" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {item.title}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg">
                    {stat.trend}
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {['Todos', 'Recientes', 'Favoritos', 'Compartidos', 'Imágenes', 'Videos', 'Documentos'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter.toLowerCase())}
              className={cn(
                "flex-shrink-0 px-5 py-2.5 rounded-xl font-medium text-sm transition-all",
                selectedFilter === filter.toLowerCase()
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-violet-500/50'
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className={cn("rounded-xl", viewMode === 'grid' && "bg-violet-500 hover:bg-violet-600 shadow-lg shadow-violet-500/30")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              className={cn("rounded-xl", viewMode === 'list' && "bg-violet-500 hover:bg-violet-600 shadow-lg shadow-violet-500/30")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none font-medium text-slate-900 dark:text-white cursor-pointer hover:border-violet-500/50 transition-colors"
            >
              <option value="date">Recientes</option>
              <option value="name">Nombre</option>
              <option value="size">Tamaño</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
            <p className="text-slate-500 font-medium">Cargando recursos...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
              <Archive className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Biblioteca vacía</h3>
            <p className="text-slate-500 max-w-sm mb-8">
              Parece que no hay recursos aquí todavía. ¡Empieza subiendo tu primer archivo!
            </p>
            <Button
              onClick={() => { setSelectedResource(null); setIsEditorOpen(true); }}
              className="bg-violet-500 hover:bg-violet-600 text-white rounded-xl px-8"
            >
              Subir recurso
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResources.map((resource, i) => {
              const fileDetails = getFileTypeDetails(resource.filetype || resource.type);

              return (
                <div
                  key={resource.id}
                  className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-violet-200/50 dark:hover:shadow-violet-900/50 transition-all duration-300 hover:-translate-y-2"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div
                    className="relative h-48 flex items-center justify-center overflow-hidden cursor-pointer"
                    style={{ backgroundColor: fileDetails.bgColor + '20' }}
                    onClick={() => {
                      if (resource.type === 'FOLDER') {
                        handleFolderClick(resource);
                      } else {
                        setSelectedResource(resource);
                        setIsPreviewOpen(true);
                      }
                    }}
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r"
                      style={{ background: `linear-gradient(to right, ${fileDetails.bgColor}, ${fileDetails.bgColor}80)` }}
                    />

                    <div className="relative z-10 group-hover:scale-110 transition-transform duration-500">
                      {resource.type === 'FOLDER' ? (
                        <Folder className="w-20 h-20 text-amber-500 drop-shadow-xl" fill="currentColor" />
                      ) : resource.type === 'VIDEO' ? (
                        <Video className="w-20 h-20 text-red-500 drop-shadow-xl" />
                      ) : (
                        <FileText className="w-20 h-20 text-blue-500 drop-shadow-xl" />
                      )}
                    </div>

                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedResource(resource);
                          setIsPreviewOpen(true);
                        }}
                      >
                        <Eye className="w-5 h-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (resource.url) window.open(resource.url, '_blank');
                        }}
                      >
                        <Download className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="absolute top-4 left-4">
                      <span
                        className="px-3 py-1 rounded-xl text-white text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: fileDetails.bgColor }}
                      >
                        {fileDetails.label}
                      </span>
                    </div>

                    <button
                      className={cn(
                        "absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all",
                        resource.isPinned ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" : "bg-white/80 dark:bg-slate-800/80 text-slate-400 hover:text-red-500"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({ title: "Acción", description: "Función de marcar favorito en desarrollo" });
                      }}
                    >
                      <Star className={cn("w-4 h-4", resource.isPinned && "fill-current")} />
                    </button>
                  </div>

                  <div className="p-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {resource.title}
                    </h3>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-6">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(resource.uploadDate).toLocaleDateString()}
                      </span>
                      <span className="font-bold uppercase tracking-tighter opacity-80">
                        {resource.type === 'FOLDER' ? 'Folder' : (resource.size ? (resource.size / 1024 / 1024).toFixed(1) + ' MB' : '---')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-bold border-2 border-white dark:border-slate-900">
                          {resource.uploaderName ? resource.uploaderName[0] : 'S'}
                        </div>
                        {resource.sharedWith && resource.sharedWith.length > 0 && (
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-bold border-2 border-white dark:border-slate-900">
                            +{resource.sharedWith.length}
                          </div>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xl p-2 w-48">
                          <DropdownMenuItem className="rounded-xl gap-2 cursor-pointer" onClick={() => { setSelectedResource(resource); setIsPreviewOpen(true); }}>
                            <Eye className="w-4 h-4" /> Ver
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl gap-2 cursor-pointer" onClick={() => { setSelectedResource(resource); setIsEditorOpen(true); }}>
                            <SlidersHorizontal className="w-4 h-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl gap-2 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30" onClick={() => handleDelete(resource.id)}>
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredResources.map((resource, i) => {
              const fileDetails = getFileTypeDetails(resource.filetype || resource.type);
              return (
                <div
                  key={resource.id}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-4 hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-900/50 transition-all cursor-pointer"
                  onClick={() => {
                    if (resource.type === 'FOLDER') {
                      handleFolderClick(resource);
                    } else {
                      setSelectedResource(resource);
                      setIsPreviewOpen(true);
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105"
                      style={{ backgroundColor: fileDetails.bgColor + '15' }}
                    >
                      {resource.type === 'FOLDER' ? (
                        <Folder className="w-7 h-7 text-amber-500" fill="currentColor" />
                      ) : (
                        <FileText className="w-7 h-7 text-blue-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {resource.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <span className="uppercase text-violet-500 dark:text-violet-400 font-bold tracking-widest">{fileDetails.label}</span>
                        <span className="opacity-60">{resource.size ? (resource.size / 1024 / 1024).toFixed(1) + ' MB' : '---'}</span>
                        <span className="opacity-60">{new Date(resource.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-8">
                      <span className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <Eye className="w-3.5 h-13.5 text-violet-500" />
                        {resource.views || 0}
                      </span>
                      <span className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        {resource.favorites || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { setSelectedResource(resource); setIsPreviewOpen(true); }}>
                        <Eye className="w-4 h-4 text-slate-400 hover:text-violet-500" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xl p-2 w-48">
                          <DropdownMenuItem className="rounded-xl gap-2 cursor-pointer" onClick={() => { setSelectedResource(resource); setIsEditorOpen(true); }}>
                            <SlidersHorizontal className="w-4 h-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl gap-2 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30" onClick={() => handleDelete(resource.id)}>
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewMode === 'list' && (
        <button
          onClick={() => { setSelectedResource(null); setIsEditorOpen(true); }}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-3xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-2xl shadow-violet-500/40 hover:shadow-[0_20px_50px_rgba(139,92,246,0.5)] hover:scale-110 transition-all flex items-center justify-center group z-50 animate-bounce-subtle"
        >
          <Upload className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {isEditorOpen && (
        <ResourceEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          resource={selectedResource}
          parentId={parentId}
          onSave={() => { fetchResources(); setIsEditorOpen(false); }}
        />
      )}

      {isPreviewOpen && selectedResource && (
        <ResourcePreviewModal
          resource={selectedResource}
          onClose={() => setIsPreviewOpen(false)}
          onNavigate={(dir) => {
            const currentIndex = filteredResources.findIndex(r => r.id === selectedResource.id);
            if (currentIndex === -1) return;
            const newIndex = dir === 'next'
              ? (currentIndex + 1) % filteredResources.length
              : (currentIndex - 1 + filteredResources.length) % filteredResources.length;
            setSelectedResource(filteredResources[newIndex]);
          }}
        />
      )}
    </div>
  );
}
