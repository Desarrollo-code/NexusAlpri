'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleFileUploaderProps {
  onUploadComplete: (url: string) => void;
  accept?: string;
  maxSize?: number;
  type?: 'image' | 'video' | 'file';
  disabled?: boolean;
  className?: string;
}

export function SimpleFileUploader({
  onUploadComplete,
  accept = '*/*',
  maxSize = 5 * 1024 * 1024,
  type = 'file',
  disabled = false,
  className
}: SimpleFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación básica
    if (file.size > maxSize) {
      toast({
        title: 'Archivo demasiado grande',
        description: `El tamaño máximo es ${maxSize / (1024 * 1024)}MB`,
        variant: 'destructive'
      });
      return;
    }

    if (type === 'image' && !file.type.startsWith('image/')) {
      toast({
        title: 'Archivo no válido',
        description: 'Por favor selecciona una imagen',
        variant: 'destructive'
      });
      return;
    }

    if (type === 'video' && !file.type.startsWith('video/')) {
      toast({
        title: 'Archivo no válido',
        description: 'Por favor selecciona un video',
        variant: 'destructive'
      });
      return;
    }

    setFileName(file.name);
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simular progreso para demostración
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await fetch(`/api/upload?type=${type}`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.url) {
        onUploadComplete(result.url);
        toast({
          title: '✅ Archivo subido',
          description: `${file.name} se ha subido correctamente`,
        });
      } else {
        throw new Error(result.error || 'No se recibió URL del archivo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: '❌ Error',
        description: error instanceof Error ? error.message : 'Error al subir archivo',
        variant: 'destructive',
      });
      setFileName(null);
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-3', className)}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      <div className="flex flex-col items-center justify-center gap-3">
        {isUploading ? (
          <>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-md" />
              <Loader2 className="h-8 w-8 text-primary animate-spin relative" />
            </div>
            <div className="w-full max-w-xs space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Subiendo... {progress}%
              </p>
            </div>
          </>
        ) : fileName ? (
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Check className="h-3 w-3 text-green-500" />
                <span className="text-xs text-muted-foreground">Subido correctamente</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFileName(null)}
              className="h-7 w-7"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <UploadCloud className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium">Arrastra o selecciona un archivo</p>
              <p className="text-sm text-muted-foreground mt-1">
                {type === 'image' && 'JPG, PNG, GIF, etc.'}
                {type === 'video' && 'MP4, MOV, AVI, etc.'}
                {type === 'file' && 'Cualquier tipo de archivo'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleButtonClick}
              disabled={disabled}
              className="mt-2"
            >
              Seleccionar archivo
            </Button>
          </>
        )}
      </div>
    </div>
  );
}