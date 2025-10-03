// src/lib/upload-with-progress.ts
/**
 * Sube un archivo directamente a una URL firmada de Supabase con reporte de progreso.
 * @param apiPath La ruta de la API para obtener la URL firmada.
 * @param file El archivo a subir.
 * @param onProgress Una función callback que se llama con el porcentaje de progreso.
 * @returns Una promesa que se resuelve con el objeto de respuesta de la API (debe incluir la URL pública).
 */
export async function uploadWithProgress(
  apiPath: string,
  file: File,
  onProgress: (percentage: number) => void
): Promise<{ url: string }> {
  // --- Paso 1: Obtener la URL firmada desde nuestra API ---
  let signedUrlResponse;
  try {
    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error al obtener la URL de subida: ${response.statusText}`);
    }
    signedUrlResponse = await response.json();
    
    // CORRECCIÓN: La respuesta de la API debería ser { url: '...' } pero recibimos { publicUrl: '...' }
    // Este cambio lo hace compatible.
    if (!signedUrlResponse.uploadUrl || !(signedUrlResponse.publicUrl || signedUrlResponse.url)) {
      throw new Error('La API no devolvió una URL de subida o pública válida.');
    }
  } catch (error) {
    console.error("Error en el Paso 1 (Obtener URL firmada):", error);
    throw error; // Propaga el error para que sea manejado por el llamador
  }
  
  // --- Paso 2: Subir el archivo directamente a la URL firmada de Supabase ---
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.open('PUT', signedUrlResponse.uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded * 100) / event.total);
        onProgress(percentage);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // La subida fue exitosa, resolvemos con la URL pública que obtuvimos en el paso 1
        resolve({ url: signedUrlResponse.publicUrl || signedUrlResponse.url });
      } else {
        // El servidor de Supabase devolvió un error
        reject(new Error(`Error en la subida directa: ${xhr.status} ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Error de red al intentar subir directamente el archivo.'));
    };

    xhr.send(file);
  });
}
