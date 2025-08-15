

'use client';

import { cn } from "@/lib/utils";
import React, { useRef } from 'react';
import { UploadCloud, FileUp } from 'lucide-react';

interface UploadAreaProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export function UploadArea({ onFileSelect, disabled }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
    } else {
      onFileSelect(null);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div 
      className={cn(
        "group relative w-full h-40 flex flex-col items-center justify-center bg-card border-2 border-dashed border-border rounded-lg cursor-pointer transition-colors hover:border-primary hover:bg-muted/30",
        disabled && "cursor-not-allowed opacity-50"
      )}
      onClick={!disabled ? handleClick : undefined}
    >
      <div className="relative w-[100px] h-[100px] flex items-center justify-center group-active:animate-press">
         <UploadCloud className="h-16 w-16 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:scale-110" />
         <FileUp className="absolute h-12 w-12 text-primary opacity-0 transition-all duration-300 group-active:animate-throw" />
      </div>
      <p className="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors">
        Seleccionar Archivo
      </p>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
