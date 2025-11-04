// src/lib/resource-utils.tsx
import React from 'react';
import type { AppResourceType } from '@/types';
import { FolderIcon, FileQuestion, Video as VideoIcon, FileText as FileTextIcon, Info, Notebook, Shield, Link as LinkIcon, Archive as ZipIcon, FilePen } from 'lucide-react';
import { cn } from './utils';

export interface FileTypeDetails {
  label: string;
  bgColor: string;
  labelColor: string;
}

const fileTypeMap: Record<string, FileTypeDetails> = {
  // Colores basados en la imagen proporcionada
  PDF: { label: 'PDF', bgColor: '#e53935', labelColor: '#c62828' }, // Rojo
  DOCX: { label: 'DOCX', bgColor: '#3949ab', labelColor: '#283593' }, // Indigo
  DOC: { label: 'DOC', bgColor: '#3949ab', labelColor: '#283593' }, // Indigo
  PPT: { label: 'PPT', bgColor: '#d81b60', labelColor: '#c2185b' }, // Rosa
  PPTX: { label: 'PPTX', bgColor: '#d81b60', labelColor: '#c2185b' },
  XLS: { label: 'XLS', bgColor: '#00897b', labelColor: '#00796b' }, // Verde azulado
  XLSX: { label: 'XLSX', bgColor: '#00897b', labelColor: '#00796b' },
  PNG: { label: 'PNG', bgColor: '#546e7a', labelColor: '#455a64' }, // Gris azulado
  JPG: { label: 'JPG', bgColor: '#546e7a', labelColor: '#455a64' },
  JPEG: { label: 'JPEG', bgColor: '#546e7a', labelColor: '#455a64' },
  SVG: { label: 'SVG', bgColor: '#fb8c00', labelColor: '#f57c00' }, // Naranja
  GIF: { label: 'GIF', bgColor: '#1e88e5', labelColor: '#1565c0' }, // Azul
  MP4: { label: 'MP4', bgColor: '#039be5', labelColor: '#0288d1' }, // Celeste
  WEBM: { label: 'WEBM', bgColor: '#039be5', labelColor: '#0288d1' },
  YOUTUBE: { label: 'YT', bgColor: '#e53935', labelColor: '#c62828' },
  ZIP: { label: 'ZIP', bgColor: '#757575', labelColor: '#616161' }, // Gris
  HTML: { label: 'HTM', bgColor: '#00897b', labelColor: '#00796b' },
  CSS: { label: 'CSS', bgColor: '#7cb342', labelColor: '#689f38' },
  AI: { label: 'AI', bgColor: '#546e7a', labelColor: '#455a64' },
  PSD: { label: 'PSD', bgColor: '#3949ab', labelColor: '#283593' },
  DB: { label: 'DB', bgColor: '#43a047', labelColor: '#388e3c' },
  BMP: { label: 'BMP', bgColor-dark: 'bg-purple-700', labelColor: '#6a1b9a' },
  ISO: { label: 'ISO', bgColor: '#fb8c00', labelColor: '#f57c00' },
  CAD: { label: 'CAD', bgColor: '#00897b', labelColor: '#00796b' },
  DEFAULT: { label: 'FILE', bgColor: '#757575', labelColor: '#616161' },
};

export const getFileTypeDetails = (type: string): FileTypeDetails => {
  if (!type) return fileTypeMap['DEFAULT'];
  const upperType = type.toUpperCase();
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
