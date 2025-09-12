// src/lib/upload-with-progress.ts
/**
 * Sube un archivo a través de una API route de Next.js con reporte de progreso.
 * @param apiPath La ruta de la API que maneja la subida (ej. '/api/upload/avatar').
 * @param formData El objeto FormData que contiene el archivo.
 * @param onProgress Una función callback que se llama con el porcentaje de progreso.
 * @returns Una promesa que se resuelve con el objeto de respuesta de la API (debe incluir la URL).
 */
export function uploadWithProgress(
  apiPath: string,
  formData: FormData,
  onProgress: (percentage: number) => void
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', apiPath, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded * 100) / event.total);
        onProgress(percentage);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.message || 'La API de subida retornó un error.'));
          }
        } catch (e) {
          reject(new Error('Respuesta inválida desde la API de subida.'));
        }
      } else {
        try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.message || `Error del servidor: ${xhr.statusText}`));
        } catch (e) {
            reject(new Error(`Error del servidor: ${xhr.status} ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Error de red al intentar subir el archivo.'));
    };

    xhr.send(formData);
  });
}
