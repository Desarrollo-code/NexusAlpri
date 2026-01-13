import React, { useState, useMemo } from 'react';
import { 
  Search, Grid, List, Plus, Folder, File, Image, 
  Video, FileText, Star, Clock, TrendingUp, Download, Share2, 
  MoreVertical, Trash2, Eye, Heart, Filter, SlidersHorizontal,
  ChevronRight, X, Upload, Sparkles, Zap, Archive
} from 'lucide-react';

// Mock data
const mockResources = [
  { id: '1', title: 'Presentación Q4', type: 'pdf', size: '2.4 MB', date: '2024-01-10', views: 234, favorites: 12, thumbnail: '📄', color: 'from-red-500 to-orange-500' },
  { id: '2', title: 'Video Tutorial React', type: 'video', size: '45.2 MB', date: '2024-01-09', views: 567, favorites: 89, thumbnail: '🎬', color: 'from-purple-500 to-pink-500' },
  { id: '3', title: 'Diseños UI/UX', type: 'folder', size: '156 MB', date: '2024-01-08', views: 123, favorites: 34, thumbnail: '📁', color: 'from-blue-500 to-cyan-500' },
  { id: '4', title: 'Banner Marketing', type: 'image', size: '8.7 MB', date: '2024-01-07', views: 890, favorites: 145, thumbnail: '🖼️', color: 'from-green-500 to-emerald-500' },
  { id: '5', title: 'Informe Anual 2024', type: 'pdf', size: '5.1 MB', date: '2024-01-06', views: 456, favorites: 67, thumbnail: '📊', color: 'from-amber-500 to-yellow-500' },
  { id: '6', title: 'Demo Producto', type: 'video', size: '78.3 MB', date: '2024-01-05', views: 1234, favorites: 234, thumbnail: '🎥', color: 'from-violet-500 to-purple-500' },
  { id: '7', title: 'Assets Brand', type: 'folder', size: '234 MB', date: '2024-01-04', views: 345, favorites: 78, thumbnail: '🎨', color: 'from-pink-500 to-rose-500' },
  { id: '8', title: 'Foto Equipo', type: 'image', size: '12.4 MB', date: '2024-01-03', views: 678, favorites: 123, thumbnail: '📸', color: 'from-indigo-500 to-blue-500' },
];

export default function ModernResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredResources = useMemo(() => {
    return mockResources.filter(r => 
      r.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-300/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="relative border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Media Library
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {filteredResources.length} recursos disponibles
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar archivos, carpetas o contenido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 pl-12 pr-12 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border-2 border-transparent focus:border-violet-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
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

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="hidden lg:flex items-center gap-2 h-11 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Filter className="w-4 h-4" />
                <span className="font-medium text-sm">Filtros</span>
              </button>
              
              <button className="flex items-center gap-2 h-11 px-6 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-[1800px] mx-auto px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Archivos', value: '248', icon: Archive, color: 'from-blue-500 to-cyan-500', trend: '+12%' },
            { label: 'Almacenamiento', value: '12.4 GB', icon: TrendingUp, color: 'from-emerald-500 to-green-500', trend: '68%' },
            { label: 'Compartidos', value: '34', icon: Share2, color: 'from-violet-500 to-purple-500', trend: '+8' },
            { label: 'Favoritos', value: '67', icon: Star, color: 'from-amber-500 to-orange-500', trend: '+5' },
          ].map((stat, i) => (
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

        {/* Quick Filters */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {['Todos', 'Recientes', 'Favoritos', 'Compartidos', 'Imágenes', 'Videos', 'Documentos'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter.toLowerCase())}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                selectedFilter === filter.toLowerCase()
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-violet-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-violet-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Ordenar por:</span>
            <select className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border-0 outline-none font-medium text-slate-900 dark:text-white cursor-pointer">
              <option>Recientes</option>
              <option>Nombre</option>
              <option>Tamaño</option>
              <option>Más vistos</option>
            </select>
          </div>
        </div>

        {/* Resources Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredResources.map((resource, i) => (
              <div
                key={resource.id}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Thumbnail */}
                <div className={`relative h-48 bg-gradient-to-br ${resource.color} flex items-center justify-center overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
                  <span className="text-7xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                    {resource.thumbnail}
                  </span>
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-colors">
                      <Eye className="w-4 h-4 text-white" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-colors">
                      <Download className="w-4 h-4 text-white" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-colors">
                      <Share2 className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-lg bg-white/20 backdrop-blur-md text-white text-xs font-semibold uppercase">
                      {resource.type}
                    </span>
                  </div>

                  {/* Favorite */}
                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center transition-colors">
                    <Heart className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {resource.title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {resource.date}
                    </span>
                    <span className="font-medium">{resource.size}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Eye className="w-3 h-3" />
                        {resource.views}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Star className="w-3 h-3" />
                        {resource.favorites}
                      </span>
                    </div>
                    
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResources.map((resource, i) => (
              <div
                key={resource.id}
                className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50 p-4 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-900 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${resource.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-2xl">{resource.thumbnail}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {resource.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="uppercase font-medium">{resource.type}</span>
                      <span>{resource.size}</span>
                      <span>{resource.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {resource.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {resource.favorites}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <Eye className="w-4 h-4 text-slate-400" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <Download className="w-4 h-4 text-slate-400" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <Share2 className="w-4 h-4 text-slate-400" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Upload Button */}
      <button className="fixed bottom-8 right-8 w-16 h-16 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-2xl shadow-violet-500/40 hover:shadow-3xl hover:shadow-violet-500/50 hover:scale-110 transition-all flex items-center justify-center group z-50">
        <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
}