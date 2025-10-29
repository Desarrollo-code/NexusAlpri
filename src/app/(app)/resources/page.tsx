// src/app/(app)/resources/page.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { AppResourceType, ResourceStatus } from '@/types';
import { Search, Loader2, AlertTriangle, FolderPlus, UploadCloud, Grid, List, ChevronRight, Users, Globe, Filter, HelpCircle, File as FileIcon, Image as ImageIcon, Music, Archive } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTitle } from '@/contexts/title-context';
import { Card, CardContent } from '@/components/ui/card';
import { useTour } from '@/contexts/tour-context';
import { resourcesTour } from '@/lib/tour-steps';
import { DecorativeFolder } from '@/components/resources/decorative-folder';
import { ResourceGridItem } from '@/components/resources/resource-grid-item';
import { ResourceListItem } from '@/components/resources/resource-list-item';
import { ResourcePreviewModal } from '@/components/resources/resource-preview-modal';
import { useIsMobile } from '@/hooks/use-mobile';
import { DndContext, type DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface StorageStat {
  type: string;
  count: number;
  size: number;
  icon: React.ElementType;
  color: string;
}

const Sidebar = ({ stats, totalSize, totalFiles, user }: { stats: StorageStat[], totalSize: number, totalFiles: number, user: any }) => {
    const usagePercentage = totalSize > 0 ? (totalSize / (50 * 1024 * 1024 * 1024)) * 100 : 0;
    
    return (
        <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-headline">Mi Nube</h2>
                <div className="flex items-center gap-2">
                    {/* Placeholder for icons */}
                    <div className="h-8 w-8 rounded-full bg-muted"></div>
                    <div className="h-8 w-8 rounded-full bg-muted"></div>
                    <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">+</div>
                </div>
            </div>
            
            <p className="text-muted-foreground">Hola {user?.name?.split(' ')[0]}, ¡Bienvenido de nuevo!</p>

            {/* Storage Card */}
            <Card className="bg-muted/30">
                <CardContent className="p-4 text-center">
                    <div className="w-32 h-32 mx-auto relative flex items-center justify-center mb-2">
                        <svg viewBox="0 0 36 36" className="w-full h-full">
                            <path
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="3"
                            />
                            <path
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="url(#storageGradient)"
                                strokeWidth="3"
                                strokeDasharray={`${usagePercentage}, 100`}
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="storageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#8b5cf6" />
                                    <stop offset="50%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#2dd4bf" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute">
                             <div className="text-2xl font-bold">{(totalSize / (1024**3)).toFixed(1)} GB</div>
                             <div className="text-xs text-muted-foreground">de 50 GB</div>
                        </div>
                    </div>
                    <Button variant="link" size="sm">Mejorar Plan</Button>
                </CardContent>
            </Card>

            {/* Storage Breakdown */}
            <div className="space-y-3">
                {stats.map(stat => (
                    <div key={stat.type} className="flex items-center gap-3 text-sm">
                        <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}><stat.icon className={`h-5 w-5 text-${stat.color}-600 dark:text-${stat.color}-300`} /></div>
                        <div className="flex-grow">
                            <p className="font-semibold">{stat.type}</p>
                            <p className="text-xs text-muted-foreground">{stat.count} archivos</p>
                        </div>
                        <p className="font-semibold text-muted-foreground">{(stat.size / (1024**3)).toFixed(1)} GB</p>
                    </div>
                ))}
            </div>
            
            <Separator />

            {/* File Upload */}
            <div className="space-y-4">
                 <h3 className="font-semibold">Subida de Archivos</h3>
                 <div className="space-y-3">
                    <div className="text-sm">
                        <p className="font-medium">Subiendo 59 Fotos</p>
                        <p className="text-xs text-muted-foreground">Photos01</p>
                        <Progress value={95} className="h-1.5 mt-1" />
                    </div>
                     <div className="text-sm">
                        <p className="font-medium">Subiendo 7 Videos</p>
                        <p className="text-xs text-muted-foreground">Museum</p>
                        <Progress value={40} className="h-1.5 mt-1" />
                    </div>
                     <div className="text-sm">
                        <p className="font-medium">Subiendo 12 Documentos</p>
                        <p className="text-xs text-muted-foreground">MyWork</p>
                        <Progress value={30} className="h-1.5 mt-1" />
                    </div>
                 </div>
            </div>
        </aside>
    )
}

// --- Main Page Component ---
export default function ResourcesPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { setPageTitle } = useTitle();
  const isMobile = useIsMobile();
  
  const [allApiResources, setAllApiResources] = useState<AppResourceType[]>([]);
  const [stats, setStats] = useState<any>({ storage: [], recentFiles: [] });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<ResourceStatus>('ACTIVE');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); // Default to list for Recent Files
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; title: string }[]>([{ id: null, title: 'Biblioteca' }]);
  const [selectedResource, setSelectedResource] = useState<AppResourceType | null>(null);

  useEffect(() => {
    setPageTitle('Mi Nube');
  }, [setPageTitle]);

  const fetchResourcesAndStats = useCallback(async () => {
    if (isAuthLoading) return;
    setIsLoadingData(true);
    setError(null);
    
    const params = new URLSearchParams({ status: activeTab, stats: 'true' });
    if (currentFolderId) params.append('parentId', currentFolderId);
    
    try {
      const response = await fetch(`/api/resources?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch resources');
      const data = await response.json();
      setAllApiResources(data.resources || []);
      setStats({
          storage: data.storageStats || [],
          recentFiles: data.recentFiles || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthLoading, activeTab, currentFolderId]);

  useEffect(() => {
    fetchResourcesAndStats();
  }, [fetchResourcesAndStats]);

  const storageStats: StorageStat[] = useMemo(() => {
    const iconMap: Record<string, React.ElementType> = {
        'Images': ImageIcon, 'Documents': FileIcon, 'Music': Music, 'Video': ImageIcon, 'Archive': Archive
    };
    return (stats.storage || []).map((s: any) => ({ ...s, icon: iconMap[s.type] || FileIcon }));
  }, [stats.storage]);

  const totalSize = useMemo(() => stats.storage?.reduce((acc: number, s: any) => acc + s.size, 0) || 0, [stats.storage]);
  const totalFiles = useMemo(() => stats.storage?.reduce((acc: number, s: any) => acc + s.count, 0) || 0, [stats.storage]);


  const folders = useMemo(() => allApiResources.filter(r => r.type === 'FOLDER'), [allApiResources]);

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
    
  if (isLoadingData || isAuthLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <main className="flex-1 space-y-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ResourceStatus)}>
                <TabsList>
                    <TabsTrigger value="ACTIVE">Activo</TabsTrigger>
                    <TabsTrigger value="ARCHIVED">Archivado</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Category Summaries */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-indigo-100 dark:bg-indigo-900/30 p-4 flex items-center gap-4">
                    <div className="p-3 bg-indigo-500 rounded-lg text-white"><ImageIcon/></div>
                    <div><p className="font-bold text-lg">Todas las Imágenes</p><p className="text-sm text-muted-foreground">{stats.storage?.find(s => s.type === 'Images')?.count || 0} archivos</p></div>
                </Card>
                 <Card className="bg-blue-100 dark:bg-blue-900/30 p-4 flex items-center gap-4">
                    <div className="p-3 bg-blue-500 rounded-lg text-white"><FileIcon/></div>
                    <div><p className="font-bold text-lg">Todos los Documentos</p><p className="text-sm text-muted-foreground">{stats.storage?.find(s => s.type === 'Documents')?.count || 0} archivos</p></div>
                </Card>
                 <Card className="bg-orange-100 dark:bg-orange-900/30 p-4 flex items-center gap-4">
                    <div className="p-3 bg-orange-500 rounded-lg text-white"><Music/></div>
                    <div><p className="font-bold text-lg">Toda la Música</p><p className="text-sm text-muted-foreground">{stats.storage?.find(s => s.type === 'Music')?.count || 0} archivos</p></div>
                </Card>
            </div>
            
            {/* Folders */}
            <section>
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold">Carpetas</h3>
                    <Button variant="link" size="sm">Ver todo</Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {folders.slice(0,4).map(folder => (
                        <Card key={folder.id} className="p-4 text-center cursor-pointer hover:bg-muted" onClick={() => handleNavigateFolder(folder)}>
                            <DecorativeFolder patternId={folder.id} className="w-16 h-12 mx-auto rounded-lg" />
                            <p className="font-semibold text-sm mt-2 truncate">{folder.title}</p>
                            <p className="text-xs text-muted-foreground">{folder.sharedWith?.length || 0} archivos</p>
                        </Card>
                    ))}
                </div>
            </section>
            
            {/* Recent Files */}
            <section>
                 <h3 className="text-xl font-bold mb-2">Archivos Recientes</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-muted-foreground font-medium">
                                <th className="p-2">Nombre</th>
                                <th className="p-2">Uploader</th>
                                <th className="p-2 hidden md:table-cell">Última Edición</th>
                                <th className="p-2 hidden sm:table-cell">Tamaño</th>
                                <th className="p-2 hidden lg:table-cell">Formato</th>
                            </tr>
                        </thead>
                         <tbody>
                            {stats.recentFiles.map((file: any) => {
                                const Icon = getIconForType(file.type);
                                return (
                                    <tr key={file.id} className="border-b last:border-b-0 hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedResource(file)}>
                                        <td className="p-2 font-medium flex items-center gap-2"><Icon className="h-4 w-4 shrink-0 text-primary"/> <span className="truncate">{file.title}</span></td>
                                        <td className="p-2 text-muted-foreground">{file.uploaderName}</td>
                                        <td className="p-2 text-muted-foreground hidden md:table-cell">{new Date(file.uploadDate).toLocaleDateString('es-ES', { day:'numeric', month: 'short', year:'numeric'})}</td>
                                        <td className="p-2 text-muted-foreground hidden sm:table-cell">{(file.size / 1024 / 1024).toFixed(2)} MB</td>
                                        <td className="p-2 text-muted-foreground hidden lg:table-cell">{file.type}</td>
                                    </tr>
                                )
                            })}
                         </tbody>
                    </table>
                 </div>
            </section>

        </main>

        {/* Sidebar */}
        <Sidebar stats={storageStats} totalSize={totalSize} totalFiles={totalFiles} user={user} />

         <ResourcePreviewModal
              resource={selectedResource}
              onClose={() => setSelectedResource(null)}
              onNavigate={() => {}}
          />
    </div>
  );
}

