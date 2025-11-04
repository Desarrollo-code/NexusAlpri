// src/lib/resource-utils.tsx
import React from 'react';
import type { AppResourceType } from '@/types';
import { FolderIcon, FileQuestion, Video as VideoIcon, FileText as FileTextIcon, Info, Notebook, Shield, Link as LinkIcon, Archive as ZipIcon, FilePen } from 'lucide-react';
import { cn } from './utils';

export interface FileTypeDetails {
  label: string;
  bgColor: string;
  textColor: string;
}

const fileTypeMap: Record<string, FileTypeDetails> = {
  // Colores sólidos basados en la nueva imagen de ejemplo
  PDF: { label: 'PDF', bgColor: '#D32F2F', textColor: '#C62828' },   // Rojo
  DOCX: { label: 'DOCX', bgColor: '#1976D2', textColor: '#1565C0' }, // Azul
  DOC: { label: 'DOC', bgColor: '#1976D2', textColor: '#1565C0' },
  PPT: { label: 'PPT', bgColor: '#E64A19', textColor: '#D84315' },   // Naranja oscuro
  PPTX: { label: 'PPTX', bgColor: '#E64A19', textColor: '#D84315' },
  XLS: { label: 'XLS', bgColor: '#388E3C', textColor: '#2E7D32' },   // Verde
  XLSX: { label: 'XLSX', bgColor: '#388E3C', textColor: '#2E7D32' },
  PNG: { label: 'PNG', bgColor: '#5E35B1', textColor: '#4527A0' },   // Morado
  JPG: { label: 'JPG', bgColor: '#5E35B1', textColor: '#4527A0' },
  JPEG: { label: 'JPEG', bgColor: '#5E35B1', textColor: '#4527A0' },
  SVG: { label: 'SVG', bgColor: '#FBC02D', textColor: '#F9A825' },   // Amarillo
  GIF: { label: 'GIF', bgColor: '#039BE5', textColor: '#0288D1' },   // Celeste
  MP4: { label: 'MP4', bgColor: '#039BE5', textColor: '#0288D1' },
  WEBM: { label: 'WEBM', bgColor: '#039BE5', textColor: '#0288D1' },
  YOUTUBE: { label: 'YT', bgColor: '#D32F2F', textColor: '#C62828' },
  ZIP: { label: 'ZIP', bgColor: '#546E7A', textColor: '#455A64' },   // Gris azulado
  HTML: { label: 'CODE', bgColor: '#00897b', textColor: '#00796b' },
  CSS: { label: 'CODE', bgColor: '#7cb342', textColor: '#689f38' },
  JS: { label: 'CODE', bgColor: '#fdd835', textColor: '#fbc02d' },
  AI: { label: 'AI', bgColor: '#455A64', textColor: '#37474F' },
  PSD: { label: 'PSD', bgColor: '#1976D2', textColor: '#1565C0' },
  DEFAULT: { label: 'FILE', bgColor: '#78909C', textColor: '#607D8B' },
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
