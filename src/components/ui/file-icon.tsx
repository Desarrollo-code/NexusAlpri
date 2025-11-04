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

  // --- Vista de Lista (Etiqueta Minimalista) ---
  if (displayMode === 'list') {
    return (
      <div
        className={cn(
          "w-16 h-10 flex items-center justify-center rounded-lg overflow-hidden group",
          className
        )}
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
            <div className="absolute bottom-1 left-1 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                  {label}
              </span>
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

  // --- Vista de Cuadrícula (Icono con Esquina Doblada) ---
  return (
    <div
      className={cn("w-full h-full flex items-center justify-center rounded-lg relative overflow-hidden group", className)}
      style={{ backgroundColor: bgColor }}
    >
      {/* Dog-ear effect */}
      <div 
        className="absolute top-0 right-0 w-0 h-0 border-solid"
        style={{
          borderWidth: '0 24px 24px 0',
          borderColor: `transparent hsla(0,0%,100%,.4) transparent transparent`,
        }}
      />
      <span 
        className="font-bold uppercase tracking-wider text-white text-base"
        style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.25)' }}
      >
        {label}
      </span>
    </div>
  );
};
