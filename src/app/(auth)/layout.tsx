// src/app/(auth)/layout.tsx
import React from 'react';

// Este layout ahora es mucho más simple.
// La lógica de si mostrar el layout público o privado se ha movido al componente AppContent.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
