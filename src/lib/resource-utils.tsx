// src/lib/resource-utils.tsx
import React from 'react';
import type { AppResourceType } from '@/types';
import { FolderIcon, FileQuestion, Video as VideoIcon, FileText as FileTextIcon, Info, Notebook, Shield, Link as LinkIcon, Archive as ZipIcon, FilePen } from 'lucide-react';
import { cn } from './utils';

// --- NUEVA LÓGICA PARA ICONOS DE ARCHIVO ESTILIZADOS ---
export interface FileTypeDetails {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const fileTypeMap: Record<string, FileTypeDetails> = {
  // Documentos
  PDF: { label: 'PDF', color: '#E53E3E', icon: FileTextIcon },
  DOCX: { label: 'DOCX', color: '#4285F4', icon: FileTextIcon },
  DOC: { label: 'DOC', color: '#4285F4', icon: FileTextIcon },
  PPT: { label: 'PPT', color: '#D94B25', icon: FileTextIcon },
  XLS: { label: 'XLS', color: '#34A853', icon: FileTextIcon },
  // Imágenes
  PNG: { label: 'PNG', color: '#4A5568', icon: FileTextIcon },
  JPG: { label: 'JPG', color: '#4A5568', icon: FileTextIcon },
  JPEG: { label: 'JPEG', color: '#4A5568', icon: FileTextIcon },
  GIF: { label: 'GIF', color: '#4299E1', icon: FileTextIcon },
  BMP: { label: 'BMP', color: '#805AD5', icon: FileTextIcon },
  SVG: { label: 'SVG', color: '#F56565', icon: FileTextIcon },
  WEBP: { label: 'WEBP', color: '#38B2AC', icon: FileTextIcon },
  // Video
  MP4: { label: 'MP4', color: '#3182CE', icon: VideoIcon },
  YOUTUBE: { label: 'YOUTUBE', color: '#FF0000', icon: VideoIcon },
  // Archivos
  ZIP: { label: 'ZIP', color: '#A0AEC0', icon: ZipIcon },
  ISO: { label: 'ISO', color: '#F6E05E', icon: FileTextIcon },
  // Código y Diseño
  HTML: { label: 'HTM', color: '#DD6B20', icon: FileTextIcon },
  CSS: { label: 'CSS', color: '#3182CE', icon: FileTextIcon },
  AI: { label: 'AI', color: '#ED8936', icon: FilePen },
  PSD: { label: 'PSD', color: '#4299E1', icon: FilePen },
  CAD: { label: 'CAD', color: '#4A5568', icon: FilePen },
  // Otros
  DB: { label: 'DB', color: '#38B2AC', icon: FileQuestion },
  DEFAULT: { label: 'FILE', color: '#A0AEC0', icon: FileQuestion },
};

export const getFileTypeDetails = (type: string): FileTypeDetails => {
  const upperType = type.toUpperCase();
  // Extraer extensión de un nombre de archivo
  const extension = upperType.split('.').pop() || 'DEFAULT';
  return fileTypeMap[extension] || fileTypeMap['DEFAULT'];
};


// --- LÓGICA ANTIGUA (aún se usa para iconos simples) ---
export const getIconForType = (type: AppResourceType['type']): React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }> => {
    const iconMap: Record<string, { icon: React.ElementType, color: string, gradient: string }> = {
        FOLDER: { icon: FolderIcon, color: 'text-amber-500', gradient: 'from-amber-500/10' },
        DOCUMENTO_EDITABLE: { icon: FilePen, color: 'text-blue-500', gradient: 'from-blue-500/10' },
        DOCUMENT: { icon: FileTextIcon, color: 'text-blue-500', gradient: 'from-blue-500/10' },
        GUIDE: { icon: Info, color: 'text-cyan-500', gradient: 'from-cyan-500/10' },
        MANUAL: { icon: Notebook, color: 'text-indigo-500', gradient: 'from-indigo-500/10' },
        POLICY: { icon: Shield, color: 'text-gray-500', gradient: 'from-gray-500/10' },
        VIDEO: { icon: VideoIcon, color: 'text-red-500', gradient: 'from-red-500/10' },
        EXTERNAL_LINK: { icon: LinkIcon, color: 'text-green-500', gradient: 'from-green-500/10' },
        OTHER: { icon: FileQuestion, color: 'text-slate-500', gradient: 'from-slate-500/10' }
    };

    const { icon: Icon, color } = iconMap[type] || iconMap.OTHER;
    
    return ({ className, ...props }) => <Icon className={cn(color, className)} {...props} />;
};

export const getIconForFileType = (mimeType?: string | null): React.ElementType => {
    if (!mimeType) return FileQuestion;
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.startsWith('video/')) return VideoIcon;
    if (mimeType === 'application/pdf') return FileTextIcon;
    if (mimeType.includes('word')) return FileTextIcon;
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return FileTextIcon;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return FileTextIcon;
    if (mimeType.includes('zip') || mimeType.includes('archive')) return ZipIcon;
    return FileQuestion;
}

export const getYoutubeVideoId = (url: string | undefined | null): string | null => {
    if (!url) return null;
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
};

export const FallbackIcon = ({ resource, className }: { resource: AppResourceType, className?: string }) => {
    const Icon = getIconForType(resource.type);
    
    const iconMap: Record<string, { gradient: string }> = {
        FOLDER: { gradient: 'from-amber-500/10' },
        DOCUMENTO_EDITABLE: { gradient: 'from-blue-500/10' },
        DOCUMENT: { gradient: 'from-blue-500/10' },
        GUIDE: { gradient: 'from-cyan-500/10' },
        MANUAL: { gradient: 'from-indigo-500/10' },
        POLICY: { gradient: 'from-gray-500/10' },
        VIDEO: { gradient: 'from-red-500/10' },
        EXTERNAL_LINK: { gradient: 'from-green-500/10' },
        OTHER: { gradient: 'from-slate-500/10' }
    };
    const { gradient } = iconMap[resource.type] || iconMap.OTHER;

    return (
        <div className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br to-transparent", gradient, className)}>
            <Icon className="h-12 w-12 opacity-80" />
        </div>
    );
};

export function isPdfUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.toLowerCase().endsWith('.pdf');
  } catch (error) {
    return url.toLowerCase().includes('.pdf');
  }
}