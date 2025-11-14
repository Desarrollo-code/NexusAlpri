// src/components/image-cropper.tsx
'use client';

import React, { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw, Crop, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ColorfulLoader } from './ui/colorful-loader';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCropCancel: () => void;
}

export function ImageCropper({ image, onCropComplete, onCropCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((value: number) => {
    setZoom(value);
  }, []);
  
  const onRotationChange = useCallback((value: number) => {
    setRotation(value);
  }, []);

  const onCropFull = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const imageEl = new Image();
      imageEl.addEventListener('load', () => resolve(imageEl));
      imageEl.addEventListener('error', (error) => reject(error));
      imageEl.setAttribute('crossOrigin', 'anonymous');
      imageEl.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }
    
    // Set canvas size to match the cropped area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png'); // O 'image/jpeg'
    });
  };

  const handleCrop = async () => {
      if (!croppedAreaPixels) return;
      setIsProcessing(true);
      try {
          const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
          if (croppedImageBlob) {
            onCropComplete(croppedImageBlob);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsProcessing(false);
      }
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="relative flex-1 w-full h-full">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={16 / 9}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onRotationChange={onRotationChange}
          onCropComplete={onCropFull}
          showGrid={true}
          cropShape="rect"
        />
      </div>

       <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm">
         <Card className="p-3 bg-card/80 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1.5"><ZoomIn className="h-3.5 w-3.5"/>Zoom</Label>
                    <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={(val) => onZoomChange(val[0])} />
                </div>
                 <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5"/>Rotación</Label>
                    <Slider value={[rotation]} min={0} max={360} step={1} onValueChange={(val) => onRotationChange(val[0])} />
                </div>
            </div>
         </Card>
      </div>

      <div className="absolute bottom-4 right-4 z-20">
        <div className="flex gap-2">
           <Button type="button" variant="secondary" size="icon" className="rounded-full h-12 w-12 bg-card/80 text-card-foreground hover:bg-card shadow-lg flex items-center justify-center" onClick={() => onCropCancel()}>
              <X className="h-6 w-6" />
           </Button>
           <Button type="button" size="icon" className="rounded-full h-12 w-12 shadow-lg flex items-center justify-center" onClick={handleCrop} disabled={isProcessing}>
             {isProcessing ? <div className="w-6 h-6"><ColorfulLoader /></div> : <Check className="h-6 w-6" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
