// src/lib/resource-utils.tsx
import React from 'react';
import type { AppResourceType } from '@/types';
import { FolderIcon, FileQuestion, Video as VideoIcon, FileText as FileTextIcon, Info, Notebook, Shield, Link as LinkIcon, Archive as ZipIcon } from 'lucide-react';
import { cn } from './utils';

// Enhanced getIconForType with colors
export const getIconForType = (type: AppResourceType['type']): React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }> => {
    const iconMap: Record<AppResourceType['type'], { icon: React.ElementType, color: string, gradient: string }> = {
        FOLDER: { icon: FolderIcon, color: 'text-amber-500', gradient: 'from-amber-500/10' },
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

export const getIconForFileType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileTextIcon;
    if (mimeType.startsWith('video/')) return VideoIcon;
    if (mimeType === 'application/pdf') return FileTextIcon;
    if (mimeType.includes('word')) return FileTextIcon;
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return FileTextIcon;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return FileTextIcon;
    if (mimeType.includes('zip') || mimeType.includes('archive')) return ZipIcon;
    return FileQuestion;
}

export const getYoutubeVideoId = (url: string | undefined): string | null => {
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

export const FallbackIcon = ({ resource, className }: { resource: AppResourceType, className?: string }) => {
    const Icon = getIconForType(resource.type);
    
    const iconMap: Record<AppResourceType['type'], { gradient: string }> = {
        FOLDER: { gradient: 'from-amber-500/10' },
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
