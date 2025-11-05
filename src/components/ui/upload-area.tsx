// src/components/ui/upload-area.tsx
'use client';
import { cn } from "@/lib/utils";
import React, { useRef, useState, useCallback } from 'react';
import { IconUploadCloud } from '@/components/icons/icon-upload-cloud';

interface UploadAreaProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
  inputId?: string;
  children?: React.ReactNode;
  compact?: boolean;
}

export function UploadArea({ onFileSelect, disabled, className, inputId = "file-upload", children, compact = false }: UploadAreaProps) {
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
        "group relative w-full flex flex-col items-center justify-center p-4 bg-card border-2 border-dashed border-border/50 rounded-lg cursor-pointer transition-all duration-300",
        "hover:border-primary/70 hover:bg-primary/5",
        isDragging && "border-primary bg-primary/10 ring-2 ring-primary/50",
        disabled && "cursor-not-allowed opacity-60",
        compact ? "h-24" : "h-32",
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
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity duration-300 z-0">
          <IconUploadCloud className={cn("text-muted-foreground transition-colors group-hover:text-primary", isDragging && "text-primary", compact ? "h-8 w-8" : "h-10 w-10")} />
          {!compact && (
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                  {isDragging ? 'Suelta el archivo aquí' : 'Arrastra y suelta o haz clic'}
              </p>
               <p className="text-xs text-muted-foreground">
                  Sube un archivo para adjuntar
              </p>
            </div>
          )}
      </div>
      {children && (
        <div className={cn("relative z-10 w-full h-full", isDragging && "opacity-20")}>
            {children}
        </div>
      )}
    </div>
  );
}
