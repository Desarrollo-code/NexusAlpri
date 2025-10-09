// src/app/layout.tsx
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import React from 'react';
import { TitleProvider } from '@/contexts/title-context';
import { cn } from '@/lib/utils';
import { getFontVariables } from '@/lib/fonts';
import { ThemeProvider } from '@/components/theme-provider';
import AppWatermark from '@/components/layout/app-watermark';
import { pdfjs } from 'react-pdf';

// CONFIGURACIÓN GLOBAL DEL PDF WORKER
// Apunta a la copia local que se crea en la carpeta `public` durante el `postinstall`.
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

// This function is now simplified to not call the DB directly.
async function getLayoutSettings() {
    return {
        fontVariables: getFontVariables() // No longer an async DB call
    };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { fontVariables } = await getLayoutSettings();
  
  return (
    <html lang="es" suppressHydrationWarning className={fontVariables}>
      <head />
      <body className={cn("min-h-screen bg-background font-body antialiased")}>
        <AuthProvider>
          <ThemeProvider>
              <TitleProvider>
                  {children}
                  <AppWatermark />
                  <Toaster />
              </TitleProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
