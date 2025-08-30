// src/components/image-cropper.tsx
'use client';

import React, { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { getCroppedImg } from '@/lib/crop-image';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Crop, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from './ui/progress';

interface ImageCropperProps {
  imageSrc: string | null;
  uploadUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onClose: () => void;
}

export function ImageCropper({ imageSrc, uploadUrl, onCropComplete, onClose }: ImageCropperProps) {
  const { toast } = useToast();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onCropPixelsChange = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (!croppedImageBlob) {
        throw new Error('No se pudo crear la imagen recortada.');
      }

      const formData = new FormData();
      // Usamos un nombre de archivo genérico, ya que el servidor generará uno único
      formData.append('file', croppedImageBlob, 'cropped-image.png');

      const result = await uploadWithProgress(uploadUrl, formData, setUploadProgress);

      onCropComplete(result.url);
      toast({ title: 'Imagen Recortada', description: 'La imagen ha sido recortada y subida con éxito.' });
      onClose();

    } catch (error) {
      toast({
        title: 'Error al Recortar',
        description: error instanceof Error ? error.message : 'No se pudo procesar la imagen.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!imageSrc) return null;

  return (
    <Dialog open={!!imageSrc} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6">
          <DialogTitle>Recortar Imagen</DialogTitle>
          <DialogDescription>
            Ajusta la imagen para que se vea perfecta. Mueve y haz zoom para encontrar el encuadre ideal.
          </DialogDescription>
        </DialogHeader>
        <div className="relative flex-1 bg-muted">
            <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropPixelsChange}
            />
        </div>
        <div className="p-6 space-y-4 bg-card border-t">
          <div className="flex items-center gap-4">
             <ZoomOut className="h-5 w-5 text-muted-foreground" />
             <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={(val) => setZoom(val[0])} disabled={isProcessing} />
             <ZoomIn className="h-5 w-5 text-muted-foreground" />
          </div>
           <div className="flex items-center gap-4">
             <RotateCw className="h-5 w-5 text-muted-foreground" />
             <Slider value={[rotation]} min={0} max={360} step={1} onValueChange={(val) => setRotation(val[0])} disabled={isProcessing} />
          </div>
          {isProcessing && uploadProgress > 0 && <Progress value={uploadProgress} />}
        </div>
        <DialogFooter className="p-6">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
          <Button onClick={handleCrop} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Crop className="mr-2 h-4 w-4" />}
            {isProcessing ? 'Procesando...' : 'Aplicar y Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
