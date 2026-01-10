'use client';

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  UploadCloud, 
  X, 
  Check, 
  AlertCircle, 
  File as FileIcon, 
  Image as ImageIcon, 
  Video, 
  Loader2,
  Eye,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface FileUploaderProps {
  onUploadComplete: (url: string, fileData?: FileData) => void;
  accept?: string;
  maxSize?: number; // en bytes
  type?: 'image' | 'video' | 'file' | 'course-image';
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  preview?: boolean;
  multiple?: boolean;
  label?: string;
  description?: string;
  defaultValue?: string;
}

interface FileData {
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
}

export function FileUploader({
  onUploadComplete,
  accept = '*/*',
  maxSize = 5 * 1024 * 1024, // 5MB por defecto
  type = 'file',
  className,
  children,
  disabled = false,
  preview = true,
  multiple = false,
  label,
  description,
  defaultValue
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultValue || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (defaultValue) {
      setPreviewUrl(defaultValue);
    }
  }, [defaultValue]);

  const getTypeConfig = () => {
    switch (type) {
      case 'image':
      case 'course-image':
        return {
          icon: ImageIcon,
          color: 'text-green-600',
          bg: 'bg-green-100 dark:bg-green-900/30',
          accept: 'image/*',
          maxSizeMB: maxSize / (1024 * 1024),
          label: label || 'Subir imagen',
          description: description || 'JPG, PNG, GIF, WebP. Máx: 5MB'
        };
      case 'video':
        return {
          icon: Video,
          color: 'text-red-600',
          bg: 'bg-red-100 dark:bg-red-900/30',
          accept: 'video/*',
          maxSizeMB: maxSize / (1024 * 1024),
          label: label || 'Subir video',
          description: description || 'MP4, MOV, AVI, WebM. Máx: 100MB'
        };
      default:
        return {
          icon: FileIcon,
          color: 'text-blue-600',
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          accept: '*/*',
          maxSizeMB: maxSize / (1024 * 1024),
          label: label || 'Subir archivo',
          description: description || 'Cualquier tipo de archivo. Máx: 50MB'
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Validar tamaño
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `El archivo es demasiado grande. Tamaño máximo: ${config.maxSizeMB}MB`
      };
    }

    // Validar tipo si es específico
    if (type === 'image' || type === 'course-image') {
      if (!file.type.startsWith('image/')) {
        return {
          valid: false,
          error: 'Por favor selecciona un archivo de imagen válido'
        };
      }
    } else if (type === 'video') {
      if (!file.type.startsWith('video/')) {
        return {
          valid: false,
          error: 'Por favor selecciona un archivo de video válido'
        };
      }
    }

    return { valid: true };
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);

    // Validar todos los archivos primero
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error);
        toast({
          title: '❌ Error de validación',
          description: validation.error,
          variant: 'destructive'
        });
        return;
      }
    }

    // Subir cada archivo
    const uploadPromises = files.map(file => uploadFile(file));
    await Promise.all(uploadPromises);
  };

  const uploadFile = async (file: File): Promise<void> => {
    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Usar XMLHttpRequest para obtener progreso real
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded * 100) / event.total);
          setProgress(percentComplete);
        }
      });

      const uploadPromise = new Promise<FileData>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              if (result.success && result.url) {
                const fileData: FileData = {
                  fileName: result.fileName || file.name,
                  fileSize: result.fileSize || file.size,
                  fileType: result.fileType || file.type,
                  url: result.url
                };
                resolve(fileData);
              } else {
                reject(new Error(result.error || 'No se recibió URL del archivo'));
              }
            } catch (parseError) {
              reject(new Error('Error al procesar la respuesta del servidor'));
            }
          } else {
            reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Error de red'));
        xhr.ontimeout = () => reject(new Error('Tiempo de espera agotado'));
      });

      xhr.open('POST', `/api/upload?type=${type}`);
      xhr.send(formData);

      const fileData = await uploadPromise;
      
      // Actualizar estado
      setUploadedFiles(prev => [...prev, fileData]);
      setPreviewUrl(fileData.url);
      
      // Llamar al callback
      onUploadComplete(fileData.url, fileData);

      toast({
        title: '✅ Archivo subido',
        description: `${file.name} se ha subido correctamente.`,
      });

    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al subir archivo';
      setError(errorMessage);
      toast({
        title: '❌ Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1000);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0]; // Por ahora solo manejamos un archivo
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
      uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    if (uploadedFiles.length === 1) {
      setPreviewUrl(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return ImageIcon;
    if (fileType.startsWith('video/')) return Video;
    return FileIcon;
  };

  const handleBrowseClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={config.accept}
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        multiple={multiple}
      />

      {/* Área de subida */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg transition-all duration-300',
          'border-gray-300 dark:border-gray-700',
          'hover:border-primary/50 hover:bg-primary/5',
          'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
          disabled && 'opacity-50 cursor-not-allowed hover:border-gray-300 dark:hover:border-gray-700',
          error && 'border-destructive/50 bg-destructive/5'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleBrowseClick}
      >
        <div className="p-6 text-center">
          {isUploading ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse" />
                  <Loader2 className="h-10 w-10 text-primary animate-spin relative" />
                </div>
                <div className="w-full max-w-md space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subiendo...</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No cierres esta ventana mientras se sube el archivo
                  </p>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="space-y-3">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">Error al subir</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setError(null);
                }}
                className="mt-2"
              >
                Reintentar
              </Button>
            </div>
          ) : children ? (
            children
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-primary/10">
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="font-medium text-gray-900 dark:text-white">
                  {config.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrowseClick();
                }}
                disabled={disabled}
              >
                <UploadCloud className="h-4 w-4 mr-2" />
                Seleccionar archivo
              </Button>
              <p className="text-xs text-muted-foreground pt-2">
                O arrastra y suelta aquí
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Previsualización */}
      {preview && previewUrl && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <p className="text-sm font-medium">Vista previa</p>
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                {type === 'image' || type === 'course-image' ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-white/90 hover:bg-white"
                          onClick={() => window.open(previewUrl, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-white/90 hover:bg-white"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = previewUrl;
                            link.download = previewUrl.split('/').pop() || 'download';
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                      <FileIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {uploadedFiles[0]?.fileName || 'Archivo subido'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {uploadedFiles[0]?.fileSize && formatFileSize(uploadedFiles[0].fileSize)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(previewUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = previewUrl;
                          link.download = uploadedFiles[0]?.fileName || 'download';
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Lista de archivos subidos */}
      {uploadedFiles.length > 1 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Archivos subidos ({uploadedFiles.length})</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadedFiles.map((file, index) => {
              const FileIconComponent = getFileIcon(file.fileType);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="p-2 bg-primary/10 rounded">
                    <FileIconComponent className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.fileName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {formatFileSize(file.fileSize)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {file.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Check className="h-3 w-3 text-green-500" />
          <span>Subida segura y encriptada</span>
        </div>
        <span>Máx: {config.maxSizeMB}MB</span>
      </div>
    </div>
  );
}

// También exportamos una versión simplificada
export function SimpleFileUploader({
  onUploadComplete,
  accept = '*/*',
  maxSize = 5 * 1024 * 1024,
  type = 'file',
  disabled = false,
  className
}: {
  onUploadComplete: (url: string) => void;
  accept?: string;
  maxSize?: number;
  type?: 'image' | 'video' | 'file';
  disabled?: boolean;
  className?: string;
}) {
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