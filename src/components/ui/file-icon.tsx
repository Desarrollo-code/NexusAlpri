// src/components/ui/file-icon.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { getFileTypeDetails } from '@/lib/resource-utils';
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

  if (displayMode === 'list') {
    return (
      <div
        className={cn("w-10 h-10 flex items-center justify-center rounded-lg overflow-hidden group relative", className)}
      >
        {thumbnailUrl && isYoutube ? (
          <>
            <Image
              src={thumbnailUrl}
              alt={label}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              quality={75}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
              <PlayCircle className="h-6 w-6 text-white/80 drop-shadow-lg transition-transform duration-300 group-hover:scale-110" />
            </div>
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
      </div>
    );
  }

  // --- Vista de Cuadrícula (Grid View) ---
  return (
    <div
      className={cn(
        "relative w-20 h-24 rounded-lg overflow-hidden group",
        className
      )}
      style={{ backgroundColor: thumbnailUrl ? 'hsl(var(--muted))' : bgColor }}
    >
      {thumbnailUrl ? (
        <>
           <Image src={thumbnailUrl} alt={label} fill className="object-cover"/>
           <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
             <PlayCircle className="h-8 w-8 text-white/80 drop-shadow-lg transition-transform duration-300 group-hover:scale-110" />
           </div>
        </>
      ) : (
        <div
          className="absolute top-0 right-0 w-0 h-0 border-solid"
          style={{
            borderWidth: '0 24px 24px 0',
            borderColor: 'transparent hsl(var(--card)) transparent transparent',
            filter: 'drop-shadow(-1px 1px 1px rgba(0,0,0,0.1))',
          }}
        />
      )}
      <div className="absolute bottom-0 left-0 right-0 h-7 px-1 flex items-center justify-center rounded-b-lg">
        <span className="text-xs font-bold uppercase tracking-wider text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
          {label}
        </span>
      </div>
    </div>
  );
};
