// src/components/ui/file-icon.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { getFileTypeDetails, getYoutubeVideoId } from '@/lib/resource-utils';
import Image from 'next/image';
import { PlayCircle, FileText, BarChart3, Music, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

interface FileIconProps {
  type: string;
  className?: string;
  thumbnailUrl?: string | null;
  displayMode?: 'grid' | 'list';
}

const renderIconPath = (type: string) => {
    switch (type.toLowerCase()) {
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'webp':
            return <ImageIcon className="w-1/2 h-1/2" />;
        case 'mp4':
        case 'webm':
        case 'mov':
            return <VideoIcon className="w-1/2 h-1/2" />;
        case 'mp3':
        case 'wav':
            return <Music className="w-1/2 h-1/2" />;
        case 'xls':
        case 'xlsx':
        case 'csv':
            return <BarChart3 className="w-1/2 h-1/2" />;
        default:
            return <FileText className="w-1/2 h-1/2" />;
    }
};


export const FileIcon: React.FC<FileIconProps> = ({ type, className, thumbnailUrl, displayMode = 'grid' }) => {
  const { label, bgColor } = getFileTypeDetails(type);
  const isYoutube = type.toLowerCase() === 'youtube';
  const isVideo = type.toLowerCase() === 'mp4' || type.toLowerCase() === 'webm';
  const finalThumbnailUrl = isYoutube ? `https://img.youtube.com/vi/${getYoutubeVideoId(thumbnailUrl)}/mqdefault.jpg` : thumbnailUrl;
  
  if (displayMode === 'list') {
     return (
        <div className={cn("w-full h-full flex items-center justify-center rounded-md overflow-hidden group relative", className)}>
            {finalThumbnailUrl ? (
                <>
                    <Image src={finalThumbnailUrl} alt={label} fill className="object-cover transition-transform duration-300 group-hover:scale-105" quality={75} />
                    {(isVideo || isYoutube) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                            <PlayCircle className="h-6 w-6 text-white/80 drop-shadow-lg" />
                        </div>
                    )}
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center rounded-md" style={{ backgroundColor: bgColor }}>
                    <span className="text-xs font-bold uppercase tracking-wider text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
                        {label}
                    </span>
                </div>
            )}
        </div>
    );
  }

  // Grid View Logic
  return (
    <div className={cn("relative w-full h-full", className)}>
      <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-sm">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.1" />
          </filter>
        </defs>
        
        {/* Main Body */}
        <path d="M10,0 L70,0 L90,20 L90,110 C90,115.523 85.523,120 80,120 L10,120 C4.477,120 0,115.523 0,110 L0,10 C0,4.477 4.477,0 10,0 Z" fill="hsl(var(--card))" filter="url(#shadow)" />
        
        {/* Folded Corner */}
        <path d="M70,0 L90,20 L70,20 Z" fill="hsl(var(--border))" fillOpacity="0.5" />
        
        {/* Color Label */}
        <path d="M0,80 L90,80 L90,110 C90,115.523 85.523,120 80,120 L10,120 C4.477,120 0,115.523 0,110 L0,80 Z" fill={bgColor} />
        
        {/* File Type Text */}
        <text x="45" y="102" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
          {label}
        </text>
        
        {/* Content Icon */}
        <foreignObject x="25" y="25" width="50" height="50">
            <div className="w-full h-full flex items-center justify-center text-muted-foreground opacity-70">
                {renderIconPath(type)}
            </div>
        </foreignObject>
      </svg>
    </div>
  );
};