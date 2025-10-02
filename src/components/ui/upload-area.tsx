// src/components/ui/upload-area.tsx
'use client';

import { cn } from "@/lib/utils";
import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud } from 'lucide-react';

interface UploadAreaProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
  inputId?: string;
  title?: string;
  description?: string;
}

export function UploadArea({ 
    onFileSelect, 
    disabled, 
    className, 
    inputId = "file-upload",
    title = "Arrastra y suelta o haz clic",
    description = "Sube un archivo para adjuntar"
}: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
    } else {
      onFileSelect(null);
    }
    if(event.target) {
        event.target.value = '';
    }
  };
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if(disabled) return;
      setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if(disabled) return;
      setIsDragging(false);
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if(disabled) return;
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          onFileSelect(e.dataTransfer.files[0]);
      }
  }, [onFileSelect, disabled]);


  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div 
      className={cn(
        "group relative w-full h-24 flex flex-row items-center justify-center p-4 bg-card border-2 border-dashed border-border/50 rounded-lg cursor-pointer transition-all duration-300",
        "hover:border-primary/70 hover:bg-primary/5",
        isDragging && "border-primary bg-primary/10",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      onClick={!disabled ? handleClick : undefined}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id={inputId}
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
        accept="image/png, image/jpeg, image/svg+xml, image/webp"
      />
      <div className="flex items-center justify-center gap-4 transition-transform duration-300 group-hover:scale-105">
         <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-background/50 dark:bg-black/30 border flex-shrink-0">
            <UploadCloud className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
         </div>
         <div className="text-left hidden md:block">
            <p className="text-sm font-semibold text-foreground">
                {isDragging ? 'Suelta el archivo aquí' : title}
            </p>
             <p className="text-xs text-muted-foreground">
                {description}
            </p>
         </div>
      </div>
    </div>
  );
}
