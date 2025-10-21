// src/app/error.tsx
'use client'; // Los archivos de error deben ser Componentes de Cliente

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { IconServer } from '@/components/icons/icon-server';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Aquí se podría registrar el error en un sistema de monitoreo
    console.error(error);
  }, [error]);

  const handleReset = () => {
    console.log("Intentando recuperar del error. Llamando a la función reset() de Next.js...");
    reset();
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center overflow-hidden">
        <DecorativeHeaderBackground />
        <Card className="z-10 w-full max-w-lg bg-card/80 backdrop-blur-sm shadow-2xl">
            <CardHeader>
                <div className="mx-auto w-40 h-40">
                     <IconServer className="w-full h-full text-destructive" data-ai-hint="server error" />
                </div>
                 <h1 className="text-6xl font-extrabold tracking-tighter text-destructive font-headline">500</h1>
                 <CardTitle className="text-3xl font-bold font-headline text-foreground">
                    Error Interno del Servidor
                 </CardTitle>
                 <CardDescription className="text-base text-muted-foreground">
                    ¡Ups! Algo no salió bien de nuestro lado. Nuestro equipo técnico ya ha sido notificado del problema.
                 </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Lamentamos las molestias. Puedes intentar recargar la página o volver al inicio.
                </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4">
                 <Button onClick={handleReset} className="w-full sm:w-auto">
                   <RefreshCw className="mr-2 h-4 w-4" />
                   Reintentar
                 </Button>
                  <Button asChild variant="secondary" className="w-full sm:w-auto">
                    <a href="/dashboard">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver al Panel Principal
                    </a>
                  </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
