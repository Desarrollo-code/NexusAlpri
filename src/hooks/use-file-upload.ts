// src/hooks/use-file-upload.ts
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app as firebaseApp } from '@/lib/firebase';

const storage = getStorage(firebaseApp);

export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = (file: File, path: string = 'general'): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No se proporcionó ningún archivo."));
        return;
      }

      setIsUploading(true);
      setProgress(0);

      const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const currentProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(currentProgress));
        },
        (error) => {
          console.error("Error de subida en Firebase:", error);
          setIsUploading(false);
          toast({
            title: 'Error de Subida',
            description: `No se pudo subir el archivo: ${error.message}`,
            variant: 'destructive',
          });
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setIsUploading(false);
            resolve(downloadURL);
          } catch (error) {
             console.error("Error al obtener URL de descarga:", error);
             setIsUploading(false);
             toast({
                title: 'Error de Subida',
                description: 'El archivo se subió pero no se pudo obtener la URL.',
                variant: 'destructive',
            });
             reject(error);
          }
        }
      );
    });
  };

  return { isUploading, progress, uploadFile };
}
