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
import { Loader2, AlertTriangle, FolderPlus, UploadCloud, Grid, List, ChevronRight, Users, Globe, Filter, HelpCircle, File as FileIcon, Image as ImageIcon, Video, Archive, Search, PlusCircle } from 'lucide-react';
import { DecorativeFolder } from '@/components/resources/decorative-folder';
import { ResourceGridItem } from '@/components/resources/resource-grid-item';
import { ResourceListItem } from '@/components/resources/resource-list-item';
import { ResourcePreviewModal } from '@/components/resources/resource-preview-modal';
import { useIsMobile } from '@/hooks/use-mobile';
import { DndContext, type DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useDebounce } from '@/hooks/use-debounce';
import { Skeleton } from '../ui/skeleton';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';

interface StorageStat {
  type: string;
  count: number;
  size: number;
  icon: React.ElementType;
  color: string;
}

const Sidebar = ({ stats, totalSize, totalFiles, user }: { stats: StorageStat[], totalSize: number, totalFiles: number, user: any }) => {
    const storageLimitGB = 50;
    const totalSizeGB = totalSize / (1024 ** 3);
    const usagePercentage = totalSize > 0 ? (totalSizeGB / storageLimitGB) * 100 : 0;
    const animatedGB = useAnimatedCounter(Number(totalSizeGB.toFixed(1)), 0, 1000);

    return (
        <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-headline">Mi Nube</h2>
                <Button size="icon" className="rounded-full h-9 w-9"><PlusCircle className="h-5 w-5"/></Button>
            </div>
            
            <p className="text-muted-foreground">Hola {user?.name?.split(' ')[0]}, ¡Bienvenido de nuevo!</p>

            <Card className="bg-muted/30">
                <CardContent className="p-4 text-center">
                    <div className="w-32 h-32 mx-auto relative flex items-center justify-center mb-2">
                        <svg viewBox="0 0 36 36" className="w-full h-full">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#storageGradient)" strokeWidth="3" strokeDasharray={`${usagePercentage}, 100`} strokeLinecap="round" />
                            <defs><linearGradient id="storageGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="hsl(var(--primary))" /><stop offset="100%" stopColor="hsl(var(--accent))" /></linearGradient></defs>
                        </svg>
                        <div className="absolute">
                             <div className="text-2xl font-bold">{animatedGB} GB</div>
                             <div className="text-xs text-muted-foreground">de {storageLimitGB} GB</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                {stats.map(stat => (
                    <div key={stat.type} className="flex items-center gap-3 text-sm">
                        <div className={`p-2 rounded-lg bg-opacity-10 ${stat.color.replace('text-', 'bg-')}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
                        <div className="flex-grow">
                            <p className="font-semibold">{stat.type}</p>
                            <p className="text-xs text-muted-foreground">{stat.count} archivos</p>
                        </div>
                        <p className="font-semibold text-muted-foreground">{(stat.size / (1024**2)).toFixed(1)} MB</p>
                    </div>
                ))}
            </div>
        </aside>
    )
}

// --- Main Page Component ---
export default function ResourcesPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { setPageTitle } = useTitle();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [allApiResources, setAllApiResources] = useState<AppResourceType[]>([]);
  const [stats, setStats] = useState<any>({ storage: [], recentFiles: [], categoryCounts: {} });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [activeTab, setActiveTab] = useState<ResourceStatus>('ACTIVE');
  
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
    if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
    
    try {
      const response = await fetch(`/api/resources?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch resources');
      const data = await response.json();
      setAllApiResources(data.resources || []);
      setStats({
          storage: data.storageStats || [],
          recentFiles: data.recentFiles || [],
          categoryCounts: data.categoryCounts || {},
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

  const storageStats: StorageStat[] = useMemo(() => {
    const iconMap: Record<string, React.ElementType> = {
        'Images': ImageIcon, 'Documents': FileIcon, 'Videos': Video, 'Archives': Archive, 'Other': FileIcon
    };
     const colorMap: Record<string, string> = {
        'Images': 'text-indigo-500', 'Documents': 'text-blue-500', 'Videos': 'text-red-500', 'Archives': 'text-gray-500', 'Other': 'text-slate-500'
    };
    return (stats.storage || []).map((s: any) => ({ ...s, icon: iconMap[s.type] || FileIcon, color: colorMap[s.type] || 'text-slate-500' }));
  }, [stats.storage]);

  const totalSize = useMemo(() => stats.storage?.reduce((acc: number, s: any) => acc + s.size, 0) || 0, [stats.storage]);
  const totalFiles = useMemo(() => stats.storage?.reduce((acc: number, s: any) => acc + s.count, 0) || 0, [stats.storage]);

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
    
  if (isAuthLoading) {
      return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  const StatCard = ({ title, icon: Icon, count, colorClass }: { title: string, icon: React.ElementType, count: number, colorClass: string }) => (
       <Card className={cn("p-4 flex items-center gap-4 transition-all hover:shadow-lg hover:-translate-y-1", colorClass)}>
          <div className="p-3 bg-black/5 rounded-lg text-black"><Icon/></div>
          <div><p className="font-bold text-lg">{title}</p><p className="text-sm text-black/60">{count} archivos</p></div>
       </Card>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8">
        <main className="flex-1 space-y-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ResourceStatus)}>
                <TabsList>
                    <TabsTrigger value="ACTIVE">Activo</TabsTrigger>
                    <TabsTrigger value="ARCHIVED">Archivado</TabsTrigger>
                </TabsList>
            </Tabs>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Buscar en mi nube..." className="pl-10 h-11" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="Todas las Imágenes" icon={ImageIcon} count={stats.categoryCounts?.Images || 0} colorClass="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200" />
                <StatCard title="Todos los Documentos" icon={FileIcon} count={stats.categoryCounts?.Documents || 0} colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200" />
                <StatCard title="Todos los Videos" icon={Video} count={stats.categoryCounts?.Videos || 0} colorClass="bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-200" />
            </div>
            
            <section>
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold">Carpetas</h3>
                    {folders.length > 4 && <Button variant="link" size="sm">Ver todo</Button>}
                </div>
                {isLoadingData ? <Skeleton className="h-32 w-full"/> : folders.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {folders.slice(0,4).map(folder => (
                            <Card key={folder.id} className="p-4 text-center cursor-pointer hover:bg-muted" onClick={() => handleNavigateFolder(folder)}>
                                <DecorativeFolder patternId={folder.id} className="w-16 h-12 mx-auto rounded-lg" />
                                <p className="font-semibold text-sm mt-2 truncate">{folder.title}</p>
                            </Card>
                        ))}
                    </div>
                ) : <p className="text-sm text-muted-foreground text-center py-4">No hay carpetas aquí.</p>}
            </section>
            
            <section>
                 <h3 className="text-xl font-bold mb-2">Archivos Recientes</h3>
                 {isLoadingData ? <Skeleton className="h-48 w-full"/> : files.length > 0 ? (
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground font-medium">
                                    <th className="p-2">Nombre</th>
                                    <th className="p-2 hidden md:table-cell">Subido por</th>
                                    <th className="p-2 hidden lg:table-cell">Última Edición</th>
                                    <th className="p-2 hidden sm:table-cell">Tamaño</th>
                                </tr>
                            </thead>
                             <tbody>
                                {files.slice(0, 5).map(file => {
                                    const Icon = getIconForType(file.type);
                                    return (
                                        <tr key={file.id} className="border-b last:border-b-0 hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedResource(file)}>
                                            <td className="p-2 font-medium flex items-center gap-2"><Icon className="h-4 w-4 shrink-0 text-primary"/> <span className="truncate">{file.title}</span></td>
                                            <td className="p-2 text-muted-foreground hidden md:table-cell">{file.uploaderName}</td>
                                            <td className="p-2 text-muted-foreground hidden lg:table-cell">{new Date(file.uploadDate).toLocaleDateString('es-ES', { day:'numeric', month: 'short'})}</td>
                                            <td className="p-2 text-muted-foreground hidden sm:table-cell">{file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</td>
                                        </tr>
                                    )
                                })}
                             </tbody>
                        </table>
                     </div>
                 ) : <p className="text-sm text-muted-foreground text-center py-8">No hay archivos recientes.</p>}
            </section>
        </main>
        
        {!isMobile && <Sidebar stats={storageStats} totalSize={totalSize} totalFiles={totalFiles} user={user} />}

         <ResourcePreviewModal
              resource={selectedResource}
              onClose={() => setSelectedResource(null)}
              onNavigate={() => {}}
          />
    </div>
  );
}
