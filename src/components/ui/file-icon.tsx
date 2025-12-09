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
    <div className={cn("relative w-full h-full rounded-xl overflow-hidden", className)}>
       <div className="absolute inset-0 bg-black" />
       <div className="absolute inset-0 flex items-center justify-center p-4">
            <svg viewBox="0 0 80 100" className="w-full h-full drop-shadow-lg">
                <defs>
                    <filter id="icon-shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.3" />
                    </filter>
                </defs>
                <g filter="url(#icon-shadow)">
                    {/* Bottom colored part */}
                    <path d="M5,40 H75 V90 C75,95.523 70.523,100 65,100 H15 C9.477,100 5,95.523 5,90 V40 Z" fill={bgColor} />
                    {/* Top white part */}
                    <path d="M5,40 V10 C5,4.477 9.477,0 15,0 H55 L75,20 V40 H5 Z" fill="white" />
                    {/* Folded corner */}
                    <path d="M55,0 L75,20 L55,20 Z" fill="#e0e0e0" />

                    {/* Text Label */}
                    <text x="40" y="73" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="sans-serif">
                        {label}
                    </text>
                    
                    {/* Content Icon */}
                     <foreignObject x="25" y="10" width="30" height="30">
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                           {renderIconPath(type)}
                        </div>
                    </foreignObject>
                </g>
            </svg>
       </div>
    </div>
  );
};
