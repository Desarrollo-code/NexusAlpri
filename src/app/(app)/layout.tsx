// src/app/(app)/layout.tsx
'use client';

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
} from '@/components/ui/sidebar';
import AppLayoutContent from './app-layout-content'; // Importamos el nuevo componente

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppLayoutContent>{children}</AppLayoutContent>
        </SidebarProvider>
    );
}

// Creamos un componente intermedio para poder usar los hooks del contexto
function AppLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-muted/30 dark:bg-gray-900/80">
      <Sidebar>
        {/* El contenido de la Sidebar como SidebarHeader, etc. se renderizará a través del nuevo AppLayoutContent */}
      </Sidebar>
      <div className="flex flex-col flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
