// src/components/ui/file-icon.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { getFileTypeDetails, type FileTypeDetails } from '@/lib/resource-utils';
import Image from 'next/image';

interface FileIconProps {
  type: string;
  className?: string;
  thumbnailUrl?: string | null;
}

export const FileIcon: React.FC<FileIconProps> = ({ type, className, thumbnailUrl }) => {
  const { label, bgColor, textColor } = getFileTypeDetails(type);

  return (
    <div className={cn("relative w-20 h-24", className)}>
      {/* Main file body */}
      <div
        className={cn("w-full h-full rounded-lg shadow-sm overflow-hidden")}
        style={{ backgroundColor: bgColor }}
      >
        {thumbnailUrl ? (
          <div className="relative w-full h-full">
            <Image src={thumbnailUrl} alt={label} fill className="object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        ) : null}
         {/* Etiqueta con la extensión del archivo */}
        <div className={cn(
          "absolute bottom-2 left-2 right-2 p-1 rounded-md text-center",
           "bg-white/80"
        )}>
            <span className={cn("text-xs font-bold")} style={{ color: textColor }}>{label}</span>
        </div>
      </div>
      
      {/* Esquina doblada */}
      <div 
        className="absolute top-0 right-0 w-0 h-0 border-solid border-transparent"
        style={{
            borderWidth: '0 24px 24px 0',
            borderColor: `transparent hsl(var(--card)) hsl(var(--card)) transparent`,
            filter: 'drop-shadow(-1px 1px 1px rgba(0,0,0,0.1))'
        }}
      />
    </div>
  );
};
