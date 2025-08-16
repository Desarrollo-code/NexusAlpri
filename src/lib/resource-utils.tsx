// src/lib/resource-utils.tsx
import React from 'react';
import type { AppResourceType } from '@/types';
import { FolderIcon, FileQuestion, Video as VideoIcon, FileText as FileTextIcon, Info, Notebook, Shield, Link as LinkIcon } from 'lucide-react';
import { cn } from './utils';

// Enhanced getIconForType with colors
export const getIconForType = (type: AppResourceType['type']): React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }> => {
    const iconMap: Record<AppResourceType['type'], { icon: React.ElementType, color: string }> = {
        FOLDER: { icon: FolderIcon, color: 'text-amber-500' },
        DOCUMENT: { icon: FileTextIcon, color: 'text-blue-500' },
        GUIDE: { icon: Info, color: 'text-cyan-500' },
        MANUAL: { icon: Notebook, color: 'text-indigo-500' },
        POLICY: { icon: Shield, color: 'text-gray-500' },
        VIDEO: { icon: VideoIcon, color: 'text-red-500' },
        EXTERNAL_LINK: { icon: LinkIcon, color: 'text-green-500' },
        OTHER: { icon: FileQuestion, color: 'text-slate-500' }
    };

    const { icon: Icon, color } = iconMap[type] || iconMap.OTHER;
    
    // Return a new component that applies the color class
    return ({ className, ...props }) => <Icon className={cn(color, className)} {...props} />;
};


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
    return (
        <div className={cn("w-full h-full flex items-center justify-center bg-muted/30", className)}>
            <Icon className="h-12 w-12 text-muted-foreground/50" />
        </div>
    );
};
