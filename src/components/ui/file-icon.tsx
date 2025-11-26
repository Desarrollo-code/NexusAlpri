// src/components/ui/file-icon.tsx
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { getFileTypeDetails, getYoutubeVideoId } from '@/lib/resource-utils';
import Image from 'next/image';
import { PlayCircle } from 'lucide-react';

interface FileIconProps {
  type: string;
  className?: string;
  thumbnailUrl?: string | null;
  displayMode?: 'grid' | 'list';
}

export const FileIcon: React.FC<FileIconProps> = ({ type, className, thumbnailUrl, displayMode = 'grid' }) => {
  const { label, bgColor } = getFileTypeDetails(type);
  const isYoutube = type.toLowerCase() === 'youtube';
  const isVideo = type.toLowerCase() === 'mp4' || type.toLowerCase() === 'webm';
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (isVideo && thumbnailUrl && !thumbnailUrl.startsWith('blob:')) {
      const video = videoRef.current;
      if (video) {
        video.onloadeddata = () => {
          video.currentTime = 1; // Seek to 1 second
        };
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            setVideoThumbnail(canvas.toDataURL('image/jpeg'));
          }
        };
      }
    }
  }, [isVideo, thumbnailUrl]);
  
  const finalThumbnailUrl = isYoutube ? `https://img.youtube.com/vi/${getYoutubeVideoId(thumbnailUrl)}/mqdefault.jpg` : videoThumbnail || thumbnailUrl;


  if (displayMode === 'list') {
    return (
      <div
        className={cn("w-full h-full flex items-center justify-center rounded-lg overflow-hidden group relative", className)}
      >
        {finalThumbnailUrl ? (
          <>
            <Image
              src={finalThumbnailUrl}
              alt={label}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              quality={75}
            />
            {(isVideo || isYoutube) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                <PlayCircle className="h-6 w-6 text-white/80 drop-shadow-lg transition-transform duration-300 group-hover:scale-110" />
              </div>
            )}
          </>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center rounded-lg"
            style={{ backgroundColor: bgColor }}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
              {label}
            </span>
          </div>
        )}
        {isVideo && thumbnailUrl && !videoThumbnail && <video ref={videoRef} src={thumbnailUrl} muted playsInline crossOrigin="anonymous" className="hidden" />}
      </div>
    );
  }

  return (
    <div
      className={cn("relative w-20 h-24 rounded-lg overflow-hidden group shadow-sm", className)}
      style={{ backgroundColor: finalThumbnailUrl ? 'hsl(var(--muted))' : bgColor }}
    >
      <div 
        className="absolute top-0 right-0 w-0 h-0 border-solid border-transparent"
        style={{
            borderWidth: '0 24px 24px 0',
            borderColor: 'transparent transparent hsl(var(--card)) transparent',
            filter: 'drop-shadow(-1px 1px 1px rgba(0,0,0,0.1))'
        }}
      />
      <div className="flex flex-col items-center justify-center h-full">
        {finalThumbnailUrl ? (
          <div className="relative w-full h-full">
             <Image src={finalThumbnailUrl} alt={label} fill className="object-cover"/>
             {(isVideo || isYoutube) && (
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <PlayCircle className="h-8 w-8 text-white/80 drop-shadow-lg transition-transform duration-300 group-hover:scale-110" />
                </div>
             )}
          </div>
        ) : null}
         {isVideo && thumbnailUrl && !videoThumbnail && <video ref={videoRef} src={thumbnailUrl} muted playsInline crossOrigin="anonymous" className="hidden" />}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-7 px-1 flex items-center justify-center bg-black/10">
        <span className="text-xs font-bold uppercase tracking-wider text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
          {label}
        </span>
      </div>
    </div>
  );
};
