// src/lib/upload-with-progress.ts
'use client';

// Utiliza la API fetch moderna en lugar de XMLHttpRequest para mayor robustez
// y compatibilidad con la infraestructura de red moderna (HTTP/3, QUIC).
// Aunque fetch no tiene un seguimiento de progreso nativo para subidas,
// esta implementación lo simula para mantener la experiencia de usuario.
export const uploadWithProgress = async (
  url: string,
  formData: FormData,
  onProgress: (progress: number) => void
): Promise<any> => {
  try {
    // Inicia el progreso para dar feedback inmediato al usuario.
    onProgress(10);
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    // Simula el progreso restante mientras esperamos la respuesta del servidor.
    onProgress(80);

    const jsonResponse = await response.json();
    
    // Una vez que tenemos respuesta, completamos el progreso.
    onProgress(100);

    if (!response.ok) {
      throw new Error(jsonResponse.message || `El servidor respondió con un estado ${response.status}`);
    }

    return jsonResponse;

  } catch (error) {
    onProgress(100); // Asegurarse de que la barra de progreso desaparezca en caso de error.
    if (error instanceof Error) {
        console.error('Error durante la subida:', error);
        throw error;
    } else {
        console.error('Error desconocido durante la subida:', error);
        throw new Error('Ocurrió un error inesperado durante la subida.');
    }
  }
};
