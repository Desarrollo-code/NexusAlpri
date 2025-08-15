
'use client';

import React, { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import getCroppedImg from '@/lib/crop-image';
import { Crop, RotateCw, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '@/components/ui/progress';

interface ImageCropperProps {
  imageSrc: string | null;
  onCropComplete: (croppedFileUrl: string) => void;
  onClose: () => void;
  uploadUrl: string;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onClose, uploadUrl }) => {
  const { toast } = useToast();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onCropCompleteCallback = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropAndUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      return;
    }
    if (croppedAreaPixels.width < 10 || croppedAreaPixels.height < 10) {
        toast({
            title: "Área de Recorte Pequeña",
            description: "Por favor, selecciona un área más grande para recortar.",
            variant: "destructive"
        });
        return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const croppedImageResult = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (!croppedImageResult) {
          throw new Error("No se pudo generar la imagen recortada.");
      }
      
      const formData = new FormData();
      formData.append('file', croppedImageResult.file, 'cropped-image.png');
      
      const result: { url: string } = await uploadWithProgress(uploadUrl, formData, setUploadProgress);
      
      toast({ title: "Imagen Subida", description: "La imagen se ha subido y guardado." });
      onCropComplete(result.url);

    } catch (e) {
      console.error(e);
      toast({
        title: 'Error al Subir',
        description: (e instanceof Error ? e.message : 'No se pudo procesar y subir la imagen.'),
        variant: 'destructive',
      });
    } finally {
        setIsUploading(false);
    }
  };

  if (!imageSrc) {
    return null;
  }

  return (
    <Dialog open={!!imageSrc} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Recortar Imagen</DialogTitle>
          <DialogDescription>Ajusta el zoom, la rotación y el área de recorte. Puedes alejar la imagen para seleccionarla completa.</DialogDescription>
        </DialogHeader>
        <div className="relative flex-grow">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={undefined} 
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropCompleteCallback}
          />
        </div>
        
        {isUploading ? (
            <div className="p-6 space-y-2">
                <p className="text-sm text-center text-muted-foreground">Subiendo imagen recortada...</p>
                <Progress value={uploadProgress} />
            </div>
        ) : (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <ZoomOut className="h-5 w-5" />
                <Slider
                  value={[zoom]}
                  min={0.1}
                  max={3}
                  step={0.01}
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
        )}

        <DialogFooter className="p-6 border-t bg-background">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>Cancelar</Button>
          <Button onClick={handleCropAndUpload} disabled={isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crop className="mr-2 h-4 w-4" />}
            {isUploading ? 'Subiendo...' : 'Aplicar y Subir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
