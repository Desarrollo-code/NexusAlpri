
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import type { EnterpriseResource as AppResourceType, UserRole } from '@/types';
import { Search, UploadCloud, ArchiveX, Loader2, AlertTriangle, Trash2, Edit, Save, List, Pin, PinOff, MoreVertical, Folder, FileText, Video, Info, FileQuestion, LayoutGrid, Eye, Download, ChevronRight, Home, Notebook, Shield, Filter, ArrowUp, ArrowDown, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Resource as PrismaResource, ResourceType as PrismaResourceType } from '@prisma/client';
import { Progress } from '@/components/ui/progress';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { Textarea } from '@/components/ui/textarea';

// --- Types and Mappers ---
interface ApiResource extends Omit<PrismaResource, 'uploader' | 'tags' | 'type' | 'uploadDate' | 'pin'> {
  uploader: { id: string; name: string | null } | null;
  tags: string[];
  type: PrismaResourceType;
  uploadDate: string;
  hasPin: boolean;
  description: string | null;
}

function mapApiResourceToAppResource(apiResource: ApiResource): AppResourceType {
  return {
    id: apiResource.id,
    title: apiResource.title,
    description: apiResource.description || undefined,
    type: apiResource.type as AppResourceType['type'],
    category: apiResource.category || 'General',
    tags: apiResource.tags,
    url: apiResource.url || undefined,
    uploadDate: apiResource.uploadDate,
    uploaderId: apiResource.uploaderId || undefined,
    uploaderName: apiResource.uploader?.name || 'N/A',
    hasPin: apiResource.hasPin,
    parentId: apiResource.parentId,
  };
}

// --- Helper Functions ---
const getIconForType = (type: AppResourceType['type']) => {
    switch (type) {
      case 'FOLDER': return <Folder className="h-5 w-5 text-yellow-500" />;
      case 'DOCUMENT': return <FileText className="h-5 w-5 text-blue-500" />;
      case 'GUIDE': return <Info className="h-5 w-5 text-green-500" />;
      case 'MANUAL': return <Notebook className="h-5 w-5 text-indigo-500" />;
      case 'POLICY': return <Shield className="h-5 w-5 text-red-500" />;
      case 'VIDEO': return <Video className="h-5 w-5 text-purple-500" />;
      default: return <FileQuestion className="h-5 w-5 text-gray-500" />;
    }
};

const getPreviewIconForType = (type: AppResourceType['type']) => {
    const className = "h-16 w-16 text-muted-foreground";
    switch (type) {
        case 'FOLDER': return <Folder className={cn(className, "text-yellow-500/80")} />;
        case 'DOCUMENT': return <FileText className={cn(className, "text-blue-500/80")} />;
        case 'GUIDE': return <Info className={cn(className, "text-green-500/80")} />;
        case 'MANUAL': return <Notebook className={cn(className, "text-indigo-500/80")} />;
        case 'POLICY': return <Shield className={cn(className, "text-red-500/80")} />;
        case 'VIDEO': return <Video className={cn(className, "text-purple-500/80")} />;
        default: return <FileQuestion className={cn(className, "text-primary")} />;
    }
};

const getYoutubeVideoId = (url: string | undefined): string | null => {
    if (!url) return null;
    let videoId = null;
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.substring(1);
      }
    } catch (e) {
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      return match ? match[1] : null;
    }
    return videoId;
};

const getFileFormat = (url?: string) => {
    if (!url) return 'Enlace';
    const extension = url.split('.').pop()?.split('?')[0];
    return extension ? extension.toUpperCase() : 'URL';
};

// --- Sub-components for Page ---
const ResourceGridItem = ({ resource, onDelete, onPreview, onDownload, onEdit }: { resource: AppResourceType, onDelete: (id: string) => void, onPreview: () => void, onDownload: () => void, onEdit: (resource: AppResourceType) => void }) => {
    const { user } = useAuth();
    const canModify = user && (user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && resource.uploaderId === user.id));
    const isFolder = resource.type === 'FOLDER';
    
    const Thumbnail = () => {
        const isImage = !isFolder && resource.url && /\.(jpe?g|png|gif|webp)$/i.test(resource.url);
        const youtubeId = !isFolder && resource.type === 'VIDEO' ? getYoutubeVideoId(resource.url) : null;
        const isPdf = !isFolder && resource.url && /\.pdf$/i.test(resource.url);

        return (
            <>
                {isImage ? (
                    <Image src={resource.url!} alt={resource.title} fill className="object-cover" data-ai-hint="resource file" />
                ) : youtubeId ? (
                    <Image src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`} alt={resource.title} fill className="object-cover" data-ai-hint="video thumbnail"/>
                ) : isPdf ? (
                    <FileText className="h-16 w-16 text-red-500/80" />
                ) : (
                    getPreviewIconForType(resource.type)
                )}
                {resource.hasPin && (
                    <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm p-1 rounded-full">
                        <Lock className="h-3 w-3 text-amber-400" />
                    </div>
                )}
            </>
        );
    };

    return (
        <div 
            className="group rounded-lg border bg-card text-card-foreground shadow-sm transition-colors flex flex-col cursor-pointer"
            onClick={onPreview}
        >
            <div className="aspect-[4/3] w-full bg-muted/30 rounded-t-lg flex items-center justify-center overflow-hidden relative">
                <Thumbnail />
            </div>
            <div className="p-2 border-t flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                    {getIconForType(resource.type)}
                    <span className="font-medium text-sm truncate">{resource.title}</span>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mr-2">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={onPreview}><Eye className="mr-2 h-4 w-4 text-sky-500" /> {isFolder ? 'Abrir' : 'Ver'}</DropdownMenuItem>
                        {!isFolder && (<DropdownMenuItem onClick={onDownload} disabled={!resource.url}><Download className="mr-2 h-4 w-4 text-green-500" /> Descargar</DropdownMenuItem>)}
                        {canModify && (<><Separator /><DropdownMenuItem onClick={() => onEdit(resource)}><Edit className="mr-2 h-4 w-4 text-blue-500" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => onDelete(resource.id)} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem></>)}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

const ResourceListItem = ({ resource, onDelete, onPreview, onDownload, onEdit }: { resource: AppResourceType, onDelete: (id: string) => void, onPreview: () => void, onDownload: () => void, onEdit: (resource: AppResourceType) => void }) => {
    const { user } = useAuth();
    const canModify = user && (user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && resource.uploaderId === user.id));
    const isFolder = resource.type === 'FOLDER';
    
    return (
        <TableRow className="cursor-pointer" onClick={onPreview}>
            <TableCell>
                <div className="flex items-center gap-3">
                    {getIconForType(resource.type)}
                    <div className="flex-grow overflow-hidden">
                        <div className="flex items-center gap-1.5">
                            <span className="font-medium truncate">{resource.title}</span>
                            {resource.hasPin && <Lock className="h-4 w-4 text-amber-400 shrink-0" />}
                        </div>
                        {resource.description && (
                            <p className="text-xs text-muted-foreground truncate">{resource.description}</p>
                        )}
                    </div>
                </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">{resource.uploaderName}</TableCell>
            <TableCell>{isFolder ? '—' : resource.category}</TableCell>
            <TableCell className="hidden lg:table-cell">{getFileFormat(resource.url)}</TableCell>
            <TableCell className="hidden lg:table-cell">{new Date(resource.uploadDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</TableCell>
            <TableCell className="text-right">
                 <div className="flex items-center justify-end gap-1">
                    {!isFolder && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onDownload(); }} aria-label="Descargar">
                            <Download className="h-4 w-4" />
                        </Button>
                    )}
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={onPreview}><Eye className="mr-2 h-4 w-4 text-sky-500" /> {isFolder ? 'Abrir' : 'Ver'}</DropdownMenuItem>
                            {canModify && (<><Separator /><DropdownMenuItem onClick={() => onEdit(resource)}><Edit className="mr-2 h-4 w-4 text-blue-500" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => onDelete(resource.id)} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem></>)}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </TableCell>
        </TableRow>
    );
};


// --- Main Page Component ---
export default function ResourcesPage() {
  const { user, settings } = useAuth();
  const { toast } = useToast();

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [allApiResources, setAllApiResources] = useState<AppResourceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  
  const [sortColumn, setSortColumn] = useState<'title' | 'category' | 'uploadDate'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Folder navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; title: string }[]>([]);

  // Modals state
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [isSubmittingResource, setIsSubmittingResource] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceType, setNewResourceType] = useState<AppResourceType['type'] | ''>('');
  const [newResourceCategory, setNewResourceCategory] = useState('');
  const [newResourceDescription, setNewResourceDescription] = useState('');
  const [newResourceFile, setNewResourceFile] = useState<File | null>(null);
  const [newResourceUrl, setNewResourceUrl] = useState('');
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState<AppResourceType | null>(null);
  const [editResourceTitle, setEditResourceTitle] = useState('');
  const [editResourceCategory, setEditResourceCategory] = useState('');
  const [editResourceDescription, setEditResourceDescription] = useState('');
  const [editResourceTags, setEditResourceTags] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editResourcePin, setEditResourcePin] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  const [resourceToDelete, setResourceToDelete] = useState<AppResourceType | null>(null);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [isDeletingResource, setIsDeletingResource] = useState(false);
  
  const [previewResource, setPreviewResource] = useState<AppResourceType | null>(null);
  const [resourceToUnlock, setResourceToUnlock] = useState<{ resource: AppResourceType, action: 'preview' | 'download' } | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Client-side preview state
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);


  // --- Data Fetching and Memoization ---
  const fetchResources = useCallback(async (folderId: string | null) => {
    setIsLoading(true);
    setError(null);
    let url = '/api/resources';
    if (folderId) {
      url += `?parentId=${folderId}`;
    }

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch resources');
      const data: ApiResource[] = await response.json();
      setAllApiResources(data.map(mapApiResourceToAppResource));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
      toast({ title: "Error al cargar recursos", description: err instanceof Error ? err.message : 'No se pudo cargar la biblioteca.', variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchResources(currentFolderId);
  }, [fetchResources, currentFolderId]);

  const { folders, files, availableFormats } = useMemo(() => {
    let formats = new Set<string>();

    const filtered = allApiResources.filter(resource => {
      // Add format to the set for the filter dropdown
      if (resource.type !== 'FOLDER' && resource.url) {
        formats.add(getFileFormat(resource.url));
      }

      // Search filter logic
      const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));

      if (resource.type === 'FOLDER') {
        return matchesSearch;
      }
      
      const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
      const matchesFormat = selectedFormat === 'all' || getFileFormat(resource.url) === selectedFormat;

      return matchesCategory && matchesSearch && matchesFormat;
    });
    
    const sortedFiles = filtered.filter(item => item.type !== 'FOLDER')
      .sort((a, b) => {
          let compareA: string | number | Date = '';
          let compareB: string | number | Date = '';

          switch (sortColumn) {
              case 'title':
                  compareA = a.title.toLowerCase();
                  compareB = b.title.toLowerCase();
                  break;
              case 'category':
                  compareA = a.category.toLowerCase();
                  compareB = b.category.toLowerCase();
                  break;
              case 'uploadDate':
                  compareA = new Date(a.uploadDate);
                  compareB = new Date(b.uploadDate);
                  break;
          }

          if (compareA < compareB) {
              return sortDirection === 'asc' ? -1 : 1;
          }
          if (compareA > compareB) {
              return sortDirection === 'asc' ? 1 : -1;
          }
          return 0;
      });

    return {
      folders: filtered.filter(item => item.type === 'FOLDER'),
      files: sortedFiles,
      availableFormats: Array.from(formats).sort()
    };
  }, [allApiResources, searchTerm, selectedCategory, selectedFormat, sortColumn, sortDirection]);
  
    // Effect for handling file conversions for preview
  useEffect(() => {
    if (!previewResource || !previewResource.url) {
        setPreviewHtml(null);
        return;
    }

    const fileUrl = previewResource.url;
    const isDocx = fileUrl.toLowerCase().endsWith('.docx');
    const isXlsx = fileUrl.toLowerCase().endsWith('.xlsx');
    
    if (!isDocx && !isXlsx) {
        setPreviewHtml(null);
        setConversionError(null);
        return;
    }

    const convertFile = async () => {
        setIsConverting(true);
        setConversionError(null);
        setPreviewHtml(null);

        try {
            const response = await fetch(fileUrl);
            if (!response.ok) {
                throw new Error(`Error al descargar el archivo: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            
            if (isDocx) {
                const result = await mammoth.convertToHtml({ arrayBuffer });
                setPreviewHtml(result.value);
            } else if (isXlsx) {
                const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const html = XLSX.utils.sheet_to_html(worksheet);
                setPreviewHtml(html);
            }

        } catch (e) {
            console.error("Conversion error:", e);
            setConversionError(e instanceof Error ? e.message : "Error al convertir el archivo para la previsualización.");
        } finally {
            setIsConverting(false);
        }
    };
    
    convertFile();

  }, [previewResource]);


  // --- Event Handlers ---
  const resetCreateForm = () => {
    setNewResourceTitle('');
    setNewResourceType('');
    setNewResourceCategory('');
    setNewResourceDescription('');
    setNewResourceFile(null);
    setNewResourceUrl('');
    setUploadProgress(0);
    const fileInput = document.getElementById('resource-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleCreateFile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newResourceTitle || !newResourceType || !newResourceCategory) {
        toast({ title: "Error", description: "Título, tipo y categoría son obligatorios.", variant: "destructive" });
        return;
    }
    if (newResourceType !== 'VIDEO' && !newResourceFile && !newResourceUrl) {
        toast({ title: "Error", description: "Debes adjuntar un archivo o proveer una URL.", variant: "destructive" });
        return;
    }
    if (newResourceType === 'VIDEO' && !newResourceUrl) {
        toast({ title: "Error", description: "Para videos, debes proveer una URL.", variant: "destructive" });
        return;
    }
    if (!user?.id) return;

    setIsSubmittingResource(true);
    let finalResourceUrl = newResourceUrl;

    if (newResourceFile) {
        setIsUploadingFile(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('file', newResourceFile);
        try {
          const result: { url: string } = await uploadWithProgress('/api/upload/resource-file', formData, setUploadProgress);
          finalResourceUrl = result.url;
        } catch (err) {
          toast({ title: "Error de Subida", description: (err as Error).message, variant: "destructive" });
          setIsUploadingFile(false);
          setIsSubmittingResource(false);
          return;
        }
        setIsUploadingFile(false);
    }
    
    try {
      const payload = { title: newResourceTitle, type: newResourceType, category: newResourceCategory, url: finalResourceUrl, uploaderId: user.id, parentId: currentFolderId, description: newResourceDescription };
      const response = await fetch('/api/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to create resource');
      toast({ title: "Recurso Creado", description: `El recurso "${newResourceTitle}" ha sido añadido.` });
      setShowCreateFileModal(false);
      resetCreateForm();
      fetchResources(currentFolderId);
    } catch (err) {
      toast({ title: "Error al crear recurso", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingResource(false);
    }
  };
  
  const handleCreateFolder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newFolderName.trim()) return;
    setIsSubmittingResource(true);
    try {
      const payload = { title: newFolderName, type: 'FOLDER', uploaderId: user?.id, parentId: currentFolderId };
      const response = await fetch('/api/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to create folder');
      toast({ title: "Carpeta Creada", description: `La carpeta "${newFolderName}" ha sido creada.` });
      setShowCreateFolderModal(false);
      setNewFolderName('');
      fetchResources(currentFolderId);
    } catch (err) {
      toast({ title: "Error al crear carpeta", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingResource(false);
    }
  };

  const openDeleteConfirmationModal = (resourceId: string) => {
    const resToDelete = allApiResources.find(res => res.id === resourceId);
    if (resToDelete) {
      setResourceToDelete(resToDelete);
      setShowDeleteConfirmDialog(true);
    }
  };

  const handleDeleteResource = async () => {
    if (!resourceToDelete) return;
    setIsDeletingResource(true);
    try {
      const response = await fetch(`/api/resources/${resourceToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to delete resource');
      toast({ title: 'Recurso Eliminado', description: `El recurso "${resourceToDelete.title}" ha sido eliminado.` });
      fetchResources(currentFolderId);
    } catch (err) {
      toast({ title: 'Error al eliminar', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsDeletingResource(false);
      setShowDeleteConfirmDialog(false);
      setResourceToDelete(null);
    }
  };

  const handleOpenEditModal = (resource: AppResourceType) => {
    setResourceToEdit(resource);
    setEditResourceTitle(resource.title);
    setEditResourceCategory(resource.category);
    setEditResourceDescription(resource.description || '');
    setEditResourceTags(resource.tags.join(', '));
    setEditResourcePin('');
    setShowEditModal(true);
  };

  const handleSaveResourceEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resourceToEdit) return;

    setIsSavingEdit(true);
    try {
      const tagsArray = editResourceTags.split(',').map(tag => tag.trim()).filter(Boolean);
      const payload = { title: editResourceTitle, category: editResourceCategory, tags: tagsArray, description: editResourceDescription };
      const response = await fetch(`/api/resources/${resourceToEdit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to update resource');
      toast({ title: "Recurso Actualizado", description: "Los cambios han sido guardados." });
      setShowEditModal(false);
      fetchResources(currentFolderId);
    } catch (err) {
      toast({ title: "Error al Guardar", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsSavingEdit(false);
    }
  };
  
  const handleSavePin = async () => {
    if (!resourceToEdit || !editResourcePin || editResourcePin.length < 4) {
      toast({ title: "Error", description: "Ingresa un PIN válido (mín. 4 caracteres).", variant: "destructive"});
      return;
    }
    setIsSavingPin(true);
    try {
      const response = await fetch(`/api/resources/${resourceToEdit.id}/pin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: editResourcePin }) });
      if (!response.ok) throw new Error((await response.json()).message || "Failed to set PIN");
      toast({ title: "PIN Guardado", description: "El recurso ahora está protegido."});
      setShowEditModal(false);
      fetchResources(currentFolderId);
    } catch (err) {
      toast({ title: "Error al guardar PIN", description: (err as Error).message, variant: "destructive"});
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleRemovePin = async () => {
     if (!resourceToEdit) return;
    setIsSavingPin(true);
    try {
      const response = await fetch(`/api/resources/${resourceToEdit.id}/pin`, { method: 'DELETE' });
      if (!response.ok) throw new Error((await response.json()).message || "Failed to remove PIN");
      toast({ title: "PIN Eliminado", description: "El recurso ya no está protegido."});
      setShowEditModal(false);
      fetchResources(currentFolderId);
    } catch (err) {
      toast({ title: "Error al quitar PIN", description: (err as Error).message, variant: "destructive"});
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleAccessResource = (resource: AppResourceType, action: 'preview' | 'download') => {
    if (resource.type === 'FOLDER') {
        const currentFolder = allApiResources.find(f => f.id === currentFolderId);
        const newBreadcrumbs = [...breadcrumbs];
        if (currentFolder) {
            newBreadcrumbs.push({ id: currentFolderId, title: currentFolder?.title || '...' });
        }
        setBreadcrumbs(prev => [...prev, {id: resource.id, title: resource.title}]);
        setCurrentFolderId(resource.id);
        return;
    }
    if (resource.hasPin) {
      setResourceToUnlock({ resource, action });
    } else {
      if (action === 'preview') setPreviewResource(resource);
      else if (action === 'download' && resource.url) window.open(resource.url, '_blank');
    }
  };
  
  const handleBreadcrumbClick = (folderId: string | null, index: number) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs(prev => prev.slice(0, index));
  };


  const handleVerifyPin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resourceToUnlock || !pinInput) return;

    setIsVerifyingPin(true);
    setPinError(null);
    try {
      const response = await fetch(`/api/resources/${resourceToUnlock.resource.id}/verify-pin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: pinInput }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to verify PIN');
      setResourceToUnlock(null);
      setPinInput('');
      if (resourceToUnlock.action === 'preview') setPreviewResource({ ...resourceToUnlock.resource, url: data.url });
      else if (resourceToUnlock.action === 'download') window.open(data.url, '_blank');
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'Ocurrió un error.');
      toast({ title: "Error de Verificación", description: err instanceof Error ? err.message : 'PIN incorrecto o error del servidor.', variant: "destructive" });
    } finally {
      setIsVerifyingPin(false);
    }
  };
  
  const handleSort = (column: 'title' | 'category' | 'uploadDate') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({ column, label }: { column: 'title' | 'category' | 'uploadDate', label: string }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-2">
        {label}
        {sortColumn === column && (
          sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
        )}
      </div>
    </TableHead>
  );

  
  const resourceTypeOptions: { value: AppResourceType['type']; label: string }[] = [
    { value: 'DOCUMENT', label: 'Documento' }, { value: 'GUIDE', label: 'Guía' }, { value: 'MANUAL', label: 'Manual' },
    { value: 'POLICY', label: 'Política' }, { value: 'VIDEO', label: 'Video (Enlace)' }, { value: 'OTHER', label: 'Otro' },
  ];


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline mb-2">Biblioteca de Recursos</h1>
            <p className="text-muted-foreground">Encuentra documentos, guías, manuales y más.</p>
        </div>
        <div className="flex flex-row flex-wrap items-center gap-2">
            {(user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR') && (
                <Dialog open={showCreateFolderModal} onOpenChange={setShowCreateFolderModal}>
                    <DialogTrigger asChild><Button><Folder className="mr-2 h-4 w-4" /> Crear Carpeta</Button></DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-md rounded-lg">
                        <DialogHeader><DialogTitle>Crear Nueva Carpeta</DialogTitle><DialogDescription>Ingresa un nombre para la nueva carpeta en la ubicación actual.</DialogDescription></DialogHeader>
                        <form onSubmit={handleCreateFolder} className="space-y-4">
                            <div><Label htmlFor="folder-name" className="sr-only">Nombre de la carpeta</Label><Input id="folder-name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Nombre de la carpeta" required disabled={isSubmittingResource} /></div>
                            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"><Button type="button" variant="outline" onClick={() => setShowCreateFolderModal(false)} disabled={isSubmittingResource}>Cancelar</Button><Button type="submit" disabled={isSubmittingResource}>{isSubmittingResource && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Crear</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
            {(user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR') && (
              <Dialog open={showCreateFileModal} onOpenChange={(isOpen) => { if (!isOpen) resetCreateForm(); setShowCreateFileModal(isOpen); }}>
                <DialogTrigger asChild>
                  <Button disabled={isSubmittingResource || isUploadingFile}><UploadCloud className="mr-2 h-4 w-4" /> Subir Recurso</Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-lg rounded-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Subir Nuevo Recurso</DialogTitle><DialogDescription>Completa los detalles para añadir un nuevo recurso a la biblioteca.</DialogDescription></DialogHeader>
                  <form onSubmit={handleCreateFile} className="grid gap-4 py-4">
                     <div className="space-y-1"><Label htmlFor="resource-title">Título <span className="text-destructive">*</span></Label><Input id="resource-title" value={newResourceTitle} onChange={(e) => setNewResourceTitle(e.target.value)} required disabled={isSubmittingResource} /></div>
                     <div className="space-y-1"><Label htmlFor="resource-description">Descripción (Opcional)</Label><Textarea id="resource-description" value={newResourceDescription} onChange={(e) => setNewResourceDescription(e.target.value)} disabled={isSubmittingResource} rows={3} /></div>
                     <div className="space-y-1"><Label htmlFor="resource-type">Tipo <span className="text-destructive">*</span></Label><Select name="resource-type" value={newResourceType} onValueChange={(v) => setNewResourceType(v as AppResourceType['type'])} required disabled={isSubmittingResource}><SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger><SelectContent>{resourceTypeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                     <div className="space-y-1"><Label htmlFor="resource-category">Categoría <span className="text-destructive">*</span></Label><Select name="resource-category" value={newResourceCategory} onValueChange={setNewResourceCategory} required disabled={isSubmittingResource}><SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger><SelectContent>{settings?.resourceCategories.sort().map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                     <Separator />
                     {newResourceType === 'VIDEO' ? (
                        <div className="space-y-1">
                          <Label htmlFor="resource-url">Pegar URL de Video (ej. YouTube)</Label>
                          <Input id="resource-url" type="url" placeholder="https://..." value={newResourceUrl} onChange={e => setNewResourceUrl(e.target.value)} required disabled={isSubmittingResource} />
                        </div>
                     ) : (
                        <>
                          <div className="space-y-1">
                            <Label htmlFor="resource-file">Subir Archivo</Label>
                            <Input id="resource-file" type="file" onChange={(e) => setNewResourceFile(e.target.files ? e.target.files[0] : null)} disabled={isSubmittingResource || !!newResourceUrl} />
                            {isUploadingFile && <Progress value={uploadProgress} className="mt-2" />}
                          </div>
                          <div className="text-center text-xs text-muted-foreground">O</div>
                          <div className="space-y-1">
                            <Label htmlFor="resource-url-alt">Pegar URL de recurso externo</Label>
                            <Input id="resource-url-alt" type="url" placeholder="https://..." value={newResourceUrl} onChange={e => setNewResourceUrl(e.target.value)} disabled={isSubmittingResource || !!newResourceFile} />
                          </div>
                        </>
                     )}
                     <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4"><Button type="button" variant="outline" onClick={() => setShowCreateFileModal(false)} disabled={isSubmittingResource}>Cancelar</Button><Button type="submit" disabled={isSubmittingResource}>{isSubmittingResource ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Guardar</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
        </div>
      </div>

       <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center text-sm text-muted-foreground overflow-x-auto whitespace-nowrap pb-2 md:pb-0">
            <button onClick={() => handleBreadcrumbClick(null, 0)} className="hover:text-primary flex items-center gap-1 shrink-0"><Home className="h-4 w-4 text-primary"/> Biblioteca</button>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.id || 'root'}>
                <ChevronRight className="h-4 w-4 mx-1 shrink-0" />
                <button onClick={() => handleBreadcrumbClick(crumb.id, index + 1)} className="hover:text-primary shrink-0 truncate">{crumb.title}</button>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
            <div className="relative w-full md:flex-1 md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="search" placeholder="Buscar en esta carpeta..." className="pl-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')} aria-label="Vista de lista"><List className="h-5 w-5"/></Button>
              <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')} aria-label="Vista de cuadrícula"><LayoutGrid className="h-5 w-5"/></Button>
            </div>
          </div>
        </div>

        {!currentFolderId && (
          <>
            <Separator />
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="category-filter" className="text-sm shrink-0">Categoría:</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category-filter" className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {settings?.resourceCategories.sort().map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="format-filter" className="text-sm shrink-0">Formato:</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger id="format-filter" className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {availableFormats.map(format => (
                       <SelectItem key={format} value={format}>{format}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Cargando recursos...</p></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-destructive"><AlertTriangle className="h-8 w-8 mb-2" /><p className="font-semibold">{error}</p><Button onClick={() => fetchResources(currentFolderId)} variant="outline" className="mt-4">Reintentar</Button></div>
      ) : (folders.length === 0 && files.length === 0) ? (
        <div className="text-center py-12"><ArchiveX className="mx-auto h-12 w-12 text-primary"/><h3 className="text-xl font-semibold">{searchTerm ? 'No hay coincidencias' : 'Carpeta Vacía'}</h3><p className="text-muted-foreground">{searchTerm ? 'Prueba con otro término de búsqueda.' : 'Sube un archivo o crea una carpeta para empezar.'}</p></div>
      ) : (
        <div className="space-y-6">
            {folders.length > 0 && (
                <div>
                    <h3 className="text-lg font-medium text-muted-foreground mb-3">Carpetas</h3>
                    {view === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                           {folders.map(item => <ResourceGridItem key={item.id} resource={item} onDelete={openDeleteConfirmationModal} onPreview={() => handleAccessResource(item, 'preview')} onDownload={() => {}} onEdit={handleOpenEditModal} />)}
                        </div>
                    ) : (
                        <Card><Table><TableBody>{folders.map(item => <ResourceListItem key={item.id} resource={item} onDelete={openDeleteConfirmationModal} onPreview={() => handleAccessResource(item, 'preview')} onDownload={() => {}} onEdit={handleOpenEditModal} />)}</TableBody></Table></Card>
                    )}
                </div>
            )}
             {files.length > 0 && (
                <div>
                    <h3 className="text-lg font-medium text-muted-foreground mb-3">Archivos</h3>
                    {view === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                           {files.map(item => <ResourceGridItem key={item.id} resource={item} onDelete={openDeleteConfirmationModal} onPreview={() => handleAccessResource(item, 'preview')} onDownload={() => handleAccessResource(item, 'download')} onEdit={handleOpenEditModal} />)}
                        </div>
                    ) : (
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <SortableHeader column="title" label="Nombre" />
                                        <TableHead className="hidden md:table-cell">Subido por</TableHead>
                                        <SortableHeader column="category" label="Categoría" />
                                        <TableHead className="hidden lg:table-cell">Formato</TableHead>
                                        <SortableHeader column="uploadDate" label="Fecha" />
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {files.map(item => <ResourceListItem key={item.id} resource={item} onDelete={openDeleteConfirmationModal} onPreview={() => handleAccessResource(item, 'preview')} onDownload={() => handleAccessResource(item, 'download')} onEdit={handleOpenEditModal} />)}
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                </div>
            )}
        </div>
      )}

      <Dialog open={showEditModal} onOpenChange={(isOpen) => { if (!isOpen) setResourceToEdit(null); setShowEditModal(isOpen); }}>
        <DialogContent className="w-[95vw] max-w-lg rounded-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar {resourceToEdit?.type === 'FOLDER' ? 'Carpeta' : 'Recurso'}</DialogTitle>
            <DialogDescription>Modifica los detalles. El archivo adjunto no se puede cambiar.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveResourceEdit} className="grid gap-4 py-4">
            <div className="space-y-1"><Label htmlFor="edit-resource-title">Título</Label><Input id="edit-resource-title" value={editResourceTitle} onChange={(e) => setEditResourceTitle(e.target.value)} required disabled={isSavingEdit || isSavingPin} /></div>
            {resourceToEdit?.type !== 'FOLDER' && (<>
              <div className="space-y-1"><Label htmlFor="edit-resource-description">Descripción (Opcional)</Label><Textarea id="edit-resource-description" value={editResourceDescription} onChange={(e) => setEditResourceDescription(e.target.value)} disabled={isSavingEdit || isSavingPin} rows={3}/></div>
              <div className="space-y-1"><Label htmlFor="edit-resource-category">Categoría</Label><Select name="edit-resource-category" value={editResourceCategory} onValueChange={setEditResourceCategory} required disabled={isSavingEdit || isSavingPin}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{settings?.resourceCategories.sort().map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label htmlFor="edit-resource-tags">Etiquetas</Label><Input id="edit-resource-tags" value={editResourceTags} onChange={(e) => setEditResourceTags(e.target.value)} disabled={isSavingEdit || isSavingPin} /></div>
            </>)}
            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"><Button type="button" variant="outline" onClick={() => setShowEditModal(false)} disabled={isSavingEdit || isSavingPin}>Cancelar</Button><Button type="submit" disabled={isSavingEdit || isSavingPin}>{isSavingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Guardar</Button></DialogFooter>
          </form>
          {user?.role === 'ADMINISTRATOR' && resourceToEdit?.type !== 'FOLDER' && (<><Separator /><div className="space-y-3 pt-4"><h4 className="font-medium flex items-center gap-2"><Lock className="h-4 w-4 text-amber-500" />PIN de Seguridad</h4><p className="text-sm text-muted-foreground">Protege este recurso con un PIN.</p><div className="flex items-center gap-2"><Input id="edit-resource-pin" type="password" placeholder="Ingresa un PIN (mín. 4 caracteres)" value={editResourcePin} onChange={(e) => setEditResourcePin(e.target.value.replace(/\D/g, ''))} maxLength={16} disabled={isSavingPin || isSavingEdit} /><Button onClick={handleSavePin} disabled={isSavingPin || isSavingEdit || !editResourcePin}>{isSavingPin && !resourceToEdit?.hasPin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pin className="h-4 w-4" />}</Button></div>{resourceToEdit?.hasPin && (<Button variant="destructive" className="w-full" onClick={handleRemovePin} disabled={isSavingPin || isSavingEdit}>{isSavingPin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PinOff className="mr-2 h-4 w-4" />}Quitar PIN</Button>)}</div></>)}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>El recurso "<strong>{resourceToDelete?.title}</strong>" será eliminado permanentemente. {resourceToDelete?.type === 'FOLDER' && 'Todos los archivos y subcarpetas dentro de esta carpeta también serán eliminados.'}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"><AlertDialogCancel onClick={() => setResourceToDelete(null)} disabled={isDeletingResource}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteResource} disabled={isDeletingResource} className={buttonVariants({ variant: "destructive" })}>{isDeletingResource ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Sí, eliminar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!previewResource} onOpenChange={(isOpen) => { if (!isOpen) setPreviewResource(null); }}>
        <DialogContent className="w-[95vw] max-w-4xl rounded-lg h-auto max-h-[90vh] flex flex-col p-4 sm:p-6">
          <DialogHeader className="pr-10"><DialogTitle className="truncate">{previewResource?.title}</DialogTitle><DialogDescription>Categoría: {previewResource?.category}</DialogDescription></DialogHeader>
          <ScrollArea className="flex-grow rounded-lg bg-muted/20 p-2">
            {(() => {
                if (!previewResource || !previewResource.url) {
                    return <div className="text-center py-8"><p className="text-muted-foreground">No hay previsualización disponible.</p></div>;
                }

                if (isConverting) {
                    return <div className="flex flex-col items-center justify-center h-full gap-2"><Loader2 className="h-8 w-8 animate-spin" /><p>Convirtiendo para previsualización...</p></div>;
                }

                if (conversionError) {
                    return <div className="flex flex-col items-center justify-center h-full gap-2 text-destructive"><AlertTriangle className="h-8 w-8" /><p>Error en la previsualización</p><p className="text-xs">{conversionError}</p></div>;
                }

                const url = previewResource.url;
                const youtubeId = getYoutubeVideoId(url);
                const isImage = !youtubeId && url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp|svg)$/);
                const isVideoFile = !youtubeId && url.toLowerCase().match(/\.(mp4|webm|ogv)$/);
                const isPdf = url.toLowerCase().endsWith('.pdf');
                const isOfficeDoc = url.toLowerCase().endsWith('.docx') || url.toLowerCase().endsWith('.xlsx');

                if (isOfficeDoc && previewHtml) {
                    return <div className="prose dark:prose-invert max-w-none p-4 bg-background rounded-md" dangerouslySetInnerHTML={{ __html: previewHtml }} />;
                }
                if (youtubeId) return <iframe className="w-full aspect-video rounded-md" src={`https://www.youtube.com/embed/${youtubeId}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>;
                if (isImage) return <div className="flex justify-center items-center h-full"><Image src={url} alt={previewResource.title} width={800} height={600} className="object-contain max-h-[70vh] rounded-md" data-ai-hint="resource preview" /></div>;
                if (isVideoFile) return <video controls src={url} className="w-full rounded-md max-h-[70vh]">Tu navegador no soporta el tag de video.</video>;
                if (isPdf) return <iframe src={url} className="w-full h-[75vh] border-none rounded-md" title={previewResource.title}></iframe>;

                return (
                    <div className="text-center py-8 flex flex-col items-center justify-center gap-4 h-full">
                        {getPreviewIconForType(previewResource.type)}
                        <h3 className="text-lg font-semibold">Previsualización no disponible</h3>
                        <p className="text-muted-foreground max-w-sm">Este tipo de archivo se debe descargar para poder visualizarlo.</p>
                        <Button asChild>
                            <Link href={url || '#'} target="_blank" rel="noopener noreferrer" download>
                                <Download className="mr-2 h-4 w-4" /> Descargar para ver
                            </Link>
                        </Button>
                    </div>
                );
            })()}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!resourceToUnlock} onOpenChange={(isOpen) => { if(!isOpen) { setResourceToUnlock(null); setPinInput(''); setPinError(null); } }}>
        <DialogContent className="w-[95vw] max-w-md rounded-lg">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-amber-500" />Se requiere PIN de acceso</DialogTitle>
                <DialogDescription>Ingresa el PIN para acceder a "<strong>{resourceToUnlock?.resource.title}</strong>".</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleVerifyPin}><div className="space-y-2 py-4"><Label htmlFor="pin-input" className="sr-only">PIN</Label><Input id="pin-input" type="password" placeholder="Ingresa el PIN" value={pinInput} onChange={e => { setPinInput(e.target.value.replace(/\D/g, '')); setPinError(null); }} autoFocus />{pinError && <p className="text-sm text-destructive">{pinError}</p>}</div><DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"><Button type="button" variant="outline" onClick={() => setResourceToUnlock(null)}>Cancelar</Button><Button type="submit" disabled={isVerifyingPin || pinInput.length < 4}>{isVerifyingPin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Verificar</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
