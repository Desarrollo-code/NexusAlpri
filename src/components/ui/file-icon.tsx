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
}

export const FileIcon: React.FC<FileIconProps> = ({ type, className, thumbnailUrl }) => {
  const { label, bgColor, labelColor } = getFileTypeDetails(type);

  return (
    <div className={cn("relative w-20 h-24 rounded-lg overflow-hidden", className)} style={{ backgroundColor: bgColor }}>
        <div className="absolute top-0 right-0 w-0 h-0 border-solid border-transparent" style={{borderWidth: '0px 24px 24px 0px', borderColor: `transparent transparent hsl(var(--card)) transparent`, filter: 'drop-shadow(-1px 1px 1px rgba(0,0,0,0.1))'}} />

        {thumbnailUrl && (
          <>
            <Image src={thumbnailUrl} alt={label} fill className="object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                <PlayCircle className="h-10 w-10 text-white/80 drop-shadow-lg transition-transform duration-300 group-hover:scale-110" />
            </div>
          </>
        )}

        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-7 px-1 flex items-center justify-center rounded-b-lg",
            thumbnailUrl ? "bg-black/40 backdrop-blur-sm" : ""
          )}
          style={!thumbnailUrl ? { backgroundColor: labelColor } : {}}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            {label}
          </span>
        </div>
    </div>
  );
};
