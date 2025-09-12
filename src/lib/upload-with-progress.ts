// src/lib/upload-with-progress.ts
import { supabase } from '@/lib/supabase-client';

/**
 * Sube un archivo directamente a un bucket de Supabase Storage con reporte de progreso.
 * @param bucketName El nombre del bucket de Supabase (ej. 'avatars').
 * @param file El archivo a subir.
 * @param onProgress Una función callback que se llama con el porcentaje de progreso.
 * @returns Una promesa que se resuelve con la URL pública del archivo subido.
 */
export function uploadWithProgress(
  bucketName: string,
  file: File,
  onProgress: (percentage: number) => void
): Promise<{ url: string }> {
  return new Promise(async (resolve, reject) => {
    
    // Crear un nombre de archivo único para evitar colisiones
    const safeFileName = file.name.replace(/[^a-zA-Z0-9-_\.]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const filePath = `${uniqueSuffix}-${safeFileName}`;

    const { data: uploadData, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    // Manejo de errores de Supabase
    if (error) {
      console.error('Supabase upload error:', error);
      return reject(new Error(`Error de Supabase: ${error.message}`));
    }
    
    // Obtener la URL pública del archivo subido
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uploadData.path);
      
    if (!publicUrlData) {
        return reject(new Error('No se pudo obtener la URL pública del archivo.'));
    }

    // Simular progreso ya que el SDK v2 no lo soporta nativamente en el cliente.
    // Una implementación más avanzada podría usar TUS para subidas reanudables y progreso real.
    onProgress(50);
    setTimeout(() => onProgress(100), 300);

    resolve({ url: publicUrlData.publicUrl });
  });
}
