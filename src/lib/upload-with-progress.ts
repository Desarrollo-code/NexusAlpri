
'use client';

export const uploadWithProgress = (
  url: string,
  formData: FormData,
  onProgress: (progress: number) => void
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', url, true);

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };

    // Handle completion
    xhr.onload = () => {
      onProgress(100); // Ensure it completes to 100%
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const jsonResponse = JSON.parse(xhr.responseText);
          resolve(jsonResponse);
        } catch (e) {
          reject(new Error('Failed to parse server response.'));
        }
      } else {
        try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.message || `Request failed with status ${xhr.status}`));
        } catch (e) {
            reject(new Error(`Request failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      }
    };

    // Handle errors
    xhr.onerror = () => {
      reject(new Error('Network error during upload.'));
    };
    
    xhr.ontimeout = () => {
        reject(new Error('The request timed out.'));
    };

    xhr.send(formData);
  });
};
