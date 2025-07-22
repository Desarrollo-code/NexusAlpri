
'use client';

import { cn } from "@/lib/utils";
import React, { useRef } from 'react';

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
         <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted-foreground transition-colors group-hover:text-primary" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M14 2v6h6m-4 5v6m-3-3h6" />
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute h-12 w-12 text-primary opacity-0 group-active:animate-bounce" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-muted-foreground group-hover:text-primary">
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
