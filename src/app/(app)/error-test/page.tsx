// src/app/(app)/error-test/page.tsx
'use client';

import { useEffect } from 'react';

// Este componente está diseñado para fallar y activar el error.tsx
export default function ErrorTestPage() {
  useEffect(() => {
    throw new Error('Este es un error de prueba para visualizar la página de error 500.');
  }, []);

  // Este contenido nunca se renderizará
  return <div>Si ves esto, el test de error ha fallado.</div>;
}
