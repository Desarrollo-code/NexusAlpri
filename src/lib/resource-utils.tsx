// src/lib/resource-utils.tsx
import React from 'react';
import type { AppResourceType } from '@/types';
import { FolderIcon, FileQuestion, Video as VideoIcon, FileText as FileTextIcon, Info, Notebook, Shield, Link as LinkIcon, Archive as ZipIcon, FilePen } from 'lucide-react';
import { cn } from './utils';

// --- NUEVA LÓGICA PARA ICONOS DE ARCHIVO ESTILIZADOS ---
export interface FileTypeDetails {
  label: string;
  bgColor: string;
  textColor: string;
}

// Paletas de colores sólidos y sutiles para los fondos
const fileTypeMap: Record<string, FileTypeDetails> = {
  // Documentos
  PDF: { label: 'PDF', bgColor: 'hsl(0, 100%, 98%)', textColor: 'hsl(0, 70%, 50%)' },
  DOCX: { label: 'DOCX', bgColor: 'hsl(220, 100%, 98%)', textColor: 'hsl(220, 70%, 55%)' },
  DOC: { label: 'DOC', bgColor: 'hsl(220, 100%, 98%)', textColor: 'hsl(220, 70%, 55%)' },
  PPT: { label: 'PPT', bgColor: 'hsl(25, 100%, 97%)', textColor: 'hsl(25, 85%, 55%)' },
  XLS: { label: 'XLS', bgColor: 'hsl(145, 80%, 97%)', textColor: 'hsl(145, 63%, 42%)' },
  // Imágenes
  PNG: { label: 'PNG', bgColor: 'hsl(225, 20%, 97%)', textColor: 'hsl(225, 10%, 40%)' },
  JPG: { label: 'JPG', bgColor: 'hsl(225, 20%, 97%)', textColor: 'hsl(225, 10%, 40%)' },
  JPEG: { label: 'JPEG', bgColor: 'hsl(225, 20%, 97%)', textColor: 'hsl(225, 10%, 40%)' },
  GIF: { label: 'GIF', bgColor: 'hsl(206, 95%, 97%)', textColor: 'hsl(206, 85%, 55%)' },
  SVG: { label: 'SVG', bgColor: 'hsl(346, 72%, 97%)', textColor: 'hsl(346, 62%, 55%)' },
  WEBP: { label: 'WEBP', bgColor: 'hsl(160, 60%, 97%)', textColor: 'hsl(160, 50%, 50%)' },
  // Video
  MP4: { label: 'MP4', bgColor: 'hsl(262, 74%, 98%)', textColor: 'hsl(262, 64%, 60%)' },
  YOUTUBE: { label: 'YOUTUBE', bgColor: 'hsl(0, 100%, 98%)', textColor: 'hsl(0, 70%, 50%)' },
  // Archivos
  ZIP: { label: 'ZIP', bgColor: 'hsl(220, 10%, 97%)', textColor: 'hsl(220, 5%, 45%)' },
  ISO: { label: 'ISO', bgColor: 'hsl(60, 90%, 97%)', textColor: 'hsl(60, 80%, 45%)' },
  // Código y Diseño
  HTML: { label: 'HTML', bgColor: 'hsl(25, 95%, 97%)', textColor: 'hsl(25, 75%, 55%)' },
  CSS: { label: 'CSS', bgColor: 'hsl(221, 83%, 97%)', textColor: 'hsl(221, 63%, 55%)' },
  AI: { label: 'AI', bgColor: 'hsl(30, 80%, 97%)', textColor: 'hsl(30, 70%, 55%)' },
  PSD: { label: 'PSD', bgColor: 'hsl(206, 95%, 97%)', textColor: 'hsl(206, 85%, 55%)' },
  CAD: { label: 'CAD', bgColor: 'hsl(225, 20%, 97%)', textColor: 'hsl(225, 10%, 40%)' },
  // Otros
  DB: { label: 'DB', bgColor: 'hsl(180, 60%, 97%)', textColor: 'hsl(180, 50%, 50%)' },
  DEFAULT: { label: 'FILE', bgColor: 'hsl(220, 10%, 97%)', textColor: 'hsl(220, 5%, 45%)' },
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
