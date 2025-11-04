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
  const { label, bgColor, labelColor } = getFileTypeDetails(type);

  return (
    <div className={cn("relative w-20 h-24", className)}>
      <div
        className={cn(
          "w-full h-full rounded-lg shadow-sm overflow-hidden relative",
        )}
        style={{ backgroundColor: bgColor }}
      >
        {thumbnailUrl && (
            <Image src={thumbnailUrl} alt={label} fill className="object-cover" />
        )}
        <div 
          className="absolute top-0 right-0 border-l-[24px] border-b-[24px] border-l-transparent" 
          style={{ borderBottomColor: 'rgba(0,0,0,0.2)'}}
        />
        <div className="absolute bottom-0 left-0 right-0 h-8 px-2 flex items-center justify-center" style={{ backgroundColor: labelColor }}>
          <span className="text-white text-xs font-bold uppercase tracking-wider">{label}</span>
        </div>
      </div>
    </div>
  );
};
