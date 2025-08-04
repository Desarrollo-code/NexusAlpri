
import React from 'react';

// Este layout ahora es más simple y solo necesita pasar los hijos.
// La barra de navegación pública y el centrado del contenido se manejan
// en el layout raíz y en las páginas específicas.
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div className="flex-grow flex items-center justify-center p-4">
          {children}
      </div>
  );
}
