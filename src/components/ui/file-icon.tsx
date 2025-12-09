// src/components/ui/file-icon.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { getYoutubeVideoId } from '@/lib/resource-utils';
import Image from 'next/image';
import { PlayCircle, FileText, BarChart3, Music, Image as ImageIcon, Video as VideoIcon, ListVideo, BrainCircuit } from 'lucide-react';
import { IconFolderDynamic } from '../icons/icon-folder-dynamic';
import { IconVideoPlaylist } from '../icons/icon-video-playlist';
import { getProcessColors } from '@/lib/utils';

interface FileIconProps {
  type: string;
  className?: string;
  thumbnailUrl?: string | null;
  displayMode?: 'grid' | 'list' | 'header';
  resourceId?: string; // Optional, for dynamic coloring
}

const renderIconPath = (type: string, className?: string) => {
    switch (type.toLowerCase()) {
        case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp':
            return <ImageIcon className={cn("w-full h-full", className)} />;
        case 'mp4': case 'webm': case 'mov': case 'video':
            return <VideoIcon className={cn("w-full h-full", className)} />;
        case 'mp3': case 'wav':
            return <Music className={cn("w-full h-full", className)} />;
        case 'xls': case 'xlsx': case 'csv':
            return <BarChart3 className={cn("w-full h-full", className)} />;
        case 'quiz':
            return <BrainCircuit className={cn("w-full h-full", className)} />;
        default:
            return <FileText className={cn("w-full h-full", className)} />;
    }
};

export const FileIcon: React.FC<FileIconProps> = ({ type, className, thumbnailUrl, displayMode = 'grid', resourceId }) => {
  const isYoutube = type.toLowerCase() === 'youtube';
  const isVideoFile = ['mp4', 'webm', 'mov', 'video'].includes(type.toLowerCase());
  const finalThumbnailUrl = isYoutube 
      ? `https://img.youtube.com/vi/${getYoutubeVideoId(thumbnailUrl)}/sddefault.jpg` 
      : thumbnailUrl;
  
  // --- HEADER MODE ---
  if (displayMode === 'header') {
    const Icon = renderIconPath(type);
    return (
      <div className={cn("w-5 h-5 flex items-center justify-center rounded-md", className)}>
        {React.cloneElement(Icon as React.ReactElement, { className: 'text-muted-foreground' })}
      </div>
    );
  }

  // --- LIST MODE ---
  if (displayMode === 'list') {
     const { label, bgColor } = getFileTypeDetails(type);
     return (
        <div className={cn("w-full h-full flex items-center justify-center rounded-md overflow-hidden group relative", className)}>
            {(finalThumbnailUrl && !isVideoFile) ? (
                <>
                    <Image src={finalThumbnailUrl} alt={label} fill className="object-cover transition-transform duration-300 group-hover:scale-105" quality={75} />
                    {isYoutube && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                            <PlayCircle className="h-6 w-6 text-white/80 drop-shadow-lg" />
                        </div>
                    )}
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center rounded-md" style={{ backgroundColor: bgColor }}>
                    {isVideoFile ? <VideoIcon className="h-6 w-6 text-white"/> : 
                     <span className="text-xs font-bold uppercase tracking-wider text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
                        {label}
                    </span>}
                </div>
            )}
        </div>
    );
  }

  // --- GRID VIEW ---
  if (type === 'FOLDER' && resourceId) {
      const colors = getProcessColors(resourceId);
      return (
        <div className="flex h-full w-full items-center justify-center p-4" style={{ background: `radial-gradient(circle, ${colors.raw.medium} 0%, ${colors.raw.light} 100%)` }}>
             <IconFolderDynamic resourceId={resourceId} className="w-20 h-20 text-muted-foreground/60 drop-shadow-lg" />
        </div>
      );
  }
  
  if (type === 'VIDEO_PLAYLIST') {
      return (
          <div className="flex h-full w-full items-center justify-center p-4 bg-gradient-to-br from-primary/20 to-primary/30">
              <IconVideoPlaylist className="w-28 h-28 text-muted-foreground/60" />
          </div>
      )
  }

  const isActuallyImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(finalThumbnailUrl || '');
  
  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-black", className)}>
       {isActuallyImage && finalThumbnailUrl ? (
          <>
            <Image src={finalThumbnailUrl} alt={type} fill className="object-cover transition-transform duration-300 group-hover:scale-105" quality={80} />
             {(isYoutube) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                    <PlayCircle className="h-10 w-10 text-white/70 drop-shadow-lg" />
                </div>
            )}
          </>
       ) : isVideoFile && finalThumbnailUrl ? (
          <>
            <video src={finalThumbnailUrl} className="w-full h-full object-cover" muted preload="metadata" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
              <PlayCircle className="h-10 w-10 text-white/70 drop-shadow-lg" />
            </div>
          </>
       ) : (
          <div className="flex h-full w-full items-center justify-center p-4">
              {renderIconPath(type, 'w-16 h-16 text-white/80')}
          </div>
       )}
    </div>
  );
};

export const getFileTypeDetails = (type: string) => {
  if (!type) return { label: 'FILE', bgColor: '#757575' };
  const upperType = type.toUpperCase();
  const extension = upperType.split('.').pop() || 'DEFAULT';
  const fileTypeMap: Record<string, { label: string, bgColor: string }> = {
      PDF: { label: 'PDF', bgColor: '#D94336' },
      DOCX: { label: 'DOCX', bgColor: '#2A5699' },
      DOC: { label: 'DOC', bgColor: '#2A5699' },
      XLSX: { label: 'XLSX', bgColor: '#0F7D40' },
      XLS: { label: 'XLS', bgColor: '#0F7D40' },
      YOUTUBE: { label: 'YT', bgColor: '#FF3D00' },
      MP4: { label: 'MP4', bgColor: '#00796B' },
      WEBM: { label: 'WEBM', bgColor: '#00796B' },
      DEFAULT: { label: 'FILE', bgColor: '#757575' },
  };
  return fileTypeMap[extension] || { label: extension.substring(0,4), bgColor: '#757575' };
};