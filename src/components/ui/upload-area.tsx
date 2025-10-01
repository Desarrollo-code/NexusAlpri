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
      setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          onFileSelect(e.dataTransfer.files[0]);
      }
  }, [onFileSelect]);


  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div 
      className={cn(
        "group relative w-full h-32 flex flex-col items-center justify-center bg-card border-2 border-dashed border-border rounded-lg cursor-pointer transition-colors",
        isDragging && "border-primary bg-primary/10",
        !disabled && "hover:border-primary hover:bg-muted/30",
        disabled && "cursor-not-allowed opacity-50",
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
      <div className="flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
         <UploadCloud className="h-10 w-10 text-muted-foreground group-hover:text-primary" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground group-hover:text-primary transition-colors text-center">
        {isDragging ? 'Suelta el archivo aquí' : 'Arrastra un archivo o haz clic para seleccionar'}
      </p>
    </div>
  );
}
