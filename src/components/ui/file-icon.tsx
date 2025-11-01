// src/components/ui/file-icon.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { getFileTypeDetails, FileTypeDetails } from '@/lib/resource-utils';

interface FileIconProps {
  type: string;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ type, className }) => {
  const { label, color, icon: Icon } = getFileTypeDetails(type);

  return (
    <div className={cn("relative w-20 h-24", className)}>
      {/* Main file body */}
      <div
        className={cn("w-full h-full rounded-lg shadow-sm")}
        style={{ backgroundColor: color }}
      >
         {/* Etiqueta con la extensión del archivo */}
        <div className="absolute bottom-2 left-2 right-2 p-1 bg-white/80 rounded-md text-center">
            <span className="text-xs font-bold" style={{ color }}>{label}</span>
        </div>
      </div>
      
      {/* Esquina doblada */}
      <div 
        className="absolute top-0 right-0 w-0 h-0 border-solid border-transparent"
        style={{
            borderWidth: '0 24px 24px 0',
            borderColor: `transparent transparent hsl(var(--card)) transparent`,
            filter: 'drop-shadow(-1px 1px 1px rgba(0,0,0,0.1))'
        }}
      />
    </div>
  );
};
