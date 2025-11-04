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
  const { label, bgColor, labelColor } = getFileTypeDetails(type);
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
  
  // --- Vista de Cuadrícula (Grid View) con "dog-ear" ---
  return (
    <div
      className={cn("w-full h-full relative group", className)}
    >
      <div 
        className="w-full h-full rounded-md" 
        style={{ backgroundColor: bgColor }}
      />
      {/* Dog-ear effect */}
      <div 
        className="absolute top-0 right-0 w-0 h-0 border-solid opacity-80"
        style={{
          borderWidth: '0 24px 24px 0',
          borderColor: `transparent hsla(0,0%,100%,.4) transparent transparent`,
        }}
      />
      
       <div className="absolute inset-0 flex items-center justify-center">
            <div 
                className="w-4/5 h-1/3 rounded-sm flex items-center justify-center"
                style={{ backgroundColor: labelColor }}
            >
                <span className="text-white font-bold text-sm md:text-base tracking-widest">
                    {label}
                </span>
            </div>
      </div>
    </div>
  );
};
