// src/components/ui/file-icon.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { getFileTypeDetails } from '@/lib/resource-utils';
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
      {/* Main body of the file icon */}
      <div
        className="w-full h-full rounded-lg shadow-sm overflow-hidden relative"
        style={{ backgroundColor: bgColor }}
      >
        {/* The folded corner element, styled exactly as requested */}
        <div 
            className="absolute top-0 right-0 w-0 h-0 border-solid border-transparent"
            style={{
                borderWidth: '0px 24px 24px 0px',
                borderColor: `transparent transparent hsl(var(--card)) transparent`,
                filter: 'drop-shadow(-1px 1px 1px rgba(0,0,0,0.1))'
            }}
        />

        {/* Thumbnail or Icon */}
        {thumbnailUrl ? (
          <Image src={thumbnailUrl} alt={label} fill className="object-cover" />
        ) : (
          <div className="w-full h-full" />
        )}
        
        {/* Label at the bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-7 px-1 flex items-center justify-center bg-white/30 backdrop-blur-sm"
        >
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: textColor }}>{label}</span>
        </div>
      </div>
    </div>
  );
};
