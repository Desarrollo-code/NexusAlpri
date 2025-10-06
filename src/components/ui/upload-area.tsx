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
}

export function UploadArea({ onFileSelect, disabled, className, inputId = "file-upload" }: UploadAreaProps) {
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
        "group w-full h-32 flex flex-col items-center justify-center p-4 bg-card border-2 border-dashed border-border/50 rounded-lg cursor-pointer transition-all duration-300",
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
      />
      <div className="flex flex-col items-center justify-center gap-2 transition-transform duration-300 group-hover:scale-105">
         <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-background/50 dark:bg-black/30 border">
            <UploadCloud className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
         </div>
         <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
                {isDragging ? 'Suelta el archivo aquí' : 'Arrastra y suelta o haz clic'}
            </p>
             <p className="text-xs text-muted-foreground">
                Sube un archivo para adjuntar
            </p>
         </div>
      </div>
    </div>
  );
}
