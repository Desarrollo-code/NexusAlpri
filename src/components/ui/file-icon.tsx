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
      <div
        className={cn(
          "w-full h-full rounded-lg shadow-sm overflow-hidden relative",
          "before:absolute before:top-0 before:right-0 before:border-l-[24px] before:border-b-[24px]",
          "before:border-l-transparent before:border-b-white/80 dark:before:border-b-black/50 before:rounded-bl-lg before:shadow-[-2px_2px_4px_rgba(0,0,0,0.05)]"
        )}
        style={{ backgroundColor: bgColor }}
      >
        {thumbnailUrl ? (
          <div className="relative w-full h-full">
            <Image src={thumbnailUrl} alt={label} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        ) : null}
        
        <div className={cn(
          "absolute bottom-2 left-2 right-2 p-1.5 rounded-md text-center",
          "bg-white/70 backdrop-blur-sm border border-black/5"
        )}>
          <span className={cn("text-xs font-bold uppercase tracking-wider")} style={{ color: textColor }}>{label}</span>
        </div>
      </div>
    </div>
  );
};
