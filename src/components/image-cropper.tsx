'use client';

import React, { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import getCroppedImg from '@/lib/crop-image';
import { Crop, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageCropperProps {
  imageSrc: string | null;
  onCropComplete: (croppedFile: File) => void;
  onClose: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onClose }) => {
  const { toast } = useToast();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropCompleteCallback = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      return;
    }
    try {
      const result = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if(result) {
        onCropComplete(result.file);
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error al Recortar',
        description: 'No se pudo procesar la imagen. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  if (!imageSrc) {
    return null;
  }

  return (
    <Dialog open={!!imageSrc} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Recortar Imagen</DialogTitle>
          <DialogDescription>Ajusta el zoom y la rotación para obtener el recorte perfecto.</DialogDescription>
        </DialogHeader>
        <div className="relative flex-grow">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={16 / 9}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropCompleteCallback}
          />
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <ZoomOut className="h-5 w-5" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
              aria-label="Zoom"
            />
            <ZoomIn className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-4">
            <RotateCw className="h-5 w-5" />
            <Slider
              value={[rotation]}
              min={0}
              max={360}
              step={1}
              onValueChange={(value) => setRotation(value[0])}
              aria-label="Rotation"
            />
          </div>
        </div>
        <DialogFooter className="p-6 border-t bg-background">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleCrop}>
            <Crop className="mr-2 h-4 w-4" />
            Aplicar Recorte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
