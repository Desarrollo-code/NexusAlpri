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

// Paleta de colores inspirada en la imagen de referencia.
const fileTypeMap: Record<string, FileTypeDetails> = {
  // Rojos y Rosas
  PDF: { label: 'PDF', bgColor: '#F44336', labelColor: '#D32F2F' },
  PPT: { label: 'PPT', bgColor: '#E53935', labelColor: '#C62828' },
  PPTX: { label: 'PPTX', bgColor: '#E53935', labelColor: '#C62828' },
  AUT: { label: 'AUT', bgColor: '#D81B60', labelColor: '#C2185B' },

  // Azules
  DOC: { label: 'DOCX', bgColor: '#2196F3', labelColor: '#1976D2' },
  DOCX: { label: 'DOCX', bgColor: '#2196F3', labelColor: '#1976D2' },
  GIF: { label: 'GIF', bgColor: '#1E88E5', labelColor: '#1565C0' },
  XLS: { label: 'XLS', bgColor: '#29B6F6', labelColor: '#039BE5' },
  XLSX: { label: 'XLSX', bgColor: '#29B6F6', labelColor: '#039BE5' },
  MP4: { label: 'MP4', bgColor: '#03A9F4', labelColor: '#0288D1' },

  // Verdes
  CSS: { label: 'CSS', bgColor: '#4CAF50', labelColor: '#388E3C' },
  XLS_GREEN: { label: 'XLS', bgColor: '#66BB6A', labelColor: '#43A047' }, // Alternativa para XLS
  CAD: { label: 'CAD', bgColor: '#81C784', labelColor: '#689F38' },
  DB: { label: 'DB', bgColor: '#4CAF50', labelColor: '#2E7D32' },
  
  // Amarillos y Naranjas
  JS: { label: 'JS', bgColor: '#FFEB3B', labelColor: '#FBC02D' },
  ISO: { label: 'ISO', bgColor: '#FFC107', labelColor: '#FFA000' },
  PSD: { label: 'PSD', bgColor: '#FF9800', labelColor: '#F57C00' },
  
  // Grises y Negros
  AI: { label: 'AI', bgColor: '#78909C', labelColor: '#546E7A' },
  PS: { label: 'PS', bgColor: '#9E9E9E', labelColor: '#616161' },
  RSS: { label: 'RSS', bgColor: '#E53935', labelColor: '#D32F2F' },
  
  // Morados y Violetas
  SVG: { label: 'SVG', bgColor: '#E53935', labelColor: '#D32F2F' },
  BMP: { label: 'BMP', bgColor: '#5E35B1', labelColor: '#4527A0' },
  
  // Marrones
  PNG: { label: 'PNG', bgColor: '#6D4C41', labelColor: '#4E342E' },

  // Otros
  HTM: { label: 'HTM', bgColor: '#009688', labelColor: '#00796B' },
  HTML: { label: 'HTML', bgColor: '#009688', labelColor: '#00796B' },
  SWF: { label: 'SWF', bgColor: '#4CAF50', labelColor: '#388E3C' },
  YOUTUBE: { label: 'YT', bgColor: '#D32F2F', labelColor: '#C62828' },
  DEFAULT: { label: 'FILE', bgColor: '#90A4AE', labelColor: '#607D8B' },
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
