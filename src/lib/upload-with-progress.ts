// src/lib/upload-with-progress.ts

/**
 * Sube un archivo a un endpoint de API usando XMLHttpRequest para poder
 * reportar el progreso de la subida.
 * @param url El endpoint de la API al que se subirá el archivo.
 * @param formData El objeto FormData que contiene el archivo.
 * @param onProgress Una función callback que se llama con el porcentaje de progreso.
 * @returns Una promesa que se resuelve con la respuesta JSON del servidor.
 */
export function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress: (percentage: number) => void
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Event listener para el progreso de la subida
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded * 100) / event.total);
        onProgress(percentage);
      }
    });

    // Event listener para cuando la petición se completa
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.message || 'El servidor devolvió un error.'));
          }
        } catch (e) {
          reject(new Error('Respuesta inválida del servidor.'));
        }
      } else {
        try {
            const response = JSON.parse(xhr.responseText);
            reject(new Error(response.message || `Error del servidor: ${xhr.statusText}`));
        } catch(e) {
             reject(new Error(`Error de comunicación con el servidor: ${xhr.status} ${xhr.statusText}`));
        }
      }
    });

    // Event listener para errores de red
    xhr.addEventListener("error", () => {
      reject(new Error("Error de red durante la subida."));
    });

    xhr.open("POST", url, true);
    xhr.send(formData);
  });
}
