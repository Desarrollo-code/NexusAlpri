// src/app/(app)/layout.tsx
'use client';

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
} from '@/components/ui/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex h-screen bg-muted/30 dark:bg-gray-900/80">
              <Sidebar>
                {/* El contenido del Sidebar se renderiza desde el RootLayout */}
              </Sidebar>
              <div className="flex flex-col flex-1 overflow-hidden">
                {children}
              </div>
            </div>
        </SidebarProvider>
    );
}
