
import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acceso | NexusAlpri',
  description: 'Inicia sesión o regístrate en NexusAlpri.',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Este layout fuerza el modo oscuro para las páginas de autenticación,
  // asegurando una apariencia consistente independientemente del tema del sistema o del usuario.
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
