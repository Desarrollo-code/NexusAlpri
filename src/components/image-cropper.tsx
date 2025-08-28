// src/components/image-cropper.tsx
'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { getCroppedImg } from '@/lib/crop-image';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Crop, Check } from 'lucide-react';
import { uploadWithProgress } from '@/lib/upload-with-progress';

interface ImageCropperProps {
  imageSrc: string | null;
  onCropComplete: (croppedFileUrl: string) => void;
  onClose: () => void;
  uploadUrl: string;
}

export function ImageCropper({ imageSrc, onCropComplete, onClose, uploadUrl }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const onCropCompleteInternal = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedImageBlob) {
        throw new Error("No se pudo crear la imagen recortada.");
      }

      const formData = new FormData();
      formData.append('file', croppedImageBlob, 'cropped-image.jpeg');

      const result: { url: string } = await uploadWithProgress(uploadUrl, formData, (progress) => {
        // You could use this progress if needed, e.g., for a progress bar inside the modal.
      });

      toast({ title: 'Imagen Recortada', description: 'La imagen ha sido recortada y subida con éxito.' });
      onCropComplete(result.url);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error al Recortar', description: 'No se pudo procesar la imagen.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={!!imageSrc} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Recortar Imagen</DialogTitle>
          <DialogDescription>Ajusta el encuadre y el zoom para la imagen de portada.</DialogDescription>
        </DialogHeader>
        <div className="relative flex-1">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropCompleteInternal}
            />
          )}
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Zoom</Label>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
              disabled={isProcessing}
            />
          </div>
        </div>
        <DialogFooter className="p-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
          <Button onClick={handleCrop} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Confirmar y Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
