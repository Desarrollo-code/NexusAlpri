// src/app/error.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, AlertCircle, Home } from 'lucide-react';
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
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error('Error capturado:', error);
  }, [error]);

  const handleReset = async () => {
    setIsRetrying(true);
    console.log("Intentando recuperar del error...");
    
    // Pequeña pausa para feedback visual
    await new Promise(resolve => setTimeout(resolve, 500));
    
    reset();
    setIsRetrying(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 text-center overflow-hidden">
      {/* Background decorativo mejorado */}
      <DecorativeHeaderBackground />
      
      {/* Elementos decorativos adicionales */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-destructive/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Card principal con animación */}
      <Card className="z-10 w-full max-w-2xl bg-card/95 backdrop-blur-md shadow-2xl border-2 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
        <CardHeader className="space-y-6">
          {/* Ícono animado */}
          <div className="mx-auto relative">
            <div className="w-32 h-32 animate-in zoom-in-50 duration-500">
              <IconServer 
                className="w-full h-full text-destructive drop-shadow-lg" 
                data-ai-hint="server error" 
              />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-destructive rounded-full flex items-center justify-center animate-bounce">
              <AlertCircle className="w-5 h-5 text-destructive-foreground" />
            </div>
          </div>

          {/* Código de error */}
          <div className="space-y-2">
            <h1 className="text-7xl font-extrabold tracking-tighter bg-gradient-to-br from-destructive to-destructive/60 bg-clip-text text-transparent font-headline">
              500
            </h1>
            <CardTitle className="text-3xl font-bold font-headline text-foreground">
              Error Interno del Servidor
            </CardTitle>
          </div>

          <CardDescription className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            Hemos encontrado un problema inesperado. Nuestro equipo ha sido notificado automáticamente y está trabajando en solucionarlo.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Información adicional */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm text-foreground flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              ¿Qué puedes hacer?
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Intenta recargar la página usando el botón de abajo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Regresa al panel principal y vuelve a intentarlo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Si el problema persiste, contacta a soporte técnico</span>
              </li>
            </ul>
          </div>

          {/* Detalles técnicos (expandible) */}
          {error.digest && (
            <div className="space-y-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
              >
                {showDetails ? 'Ocultar' : 'Ver'} detalles técnicos
              </button>
              
              {showDetails && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <div className="bg-muted rounded-md p-3 text-left">
                    <code className="text-xs text-muted-foreground break-all">
                      Error ID: {error.digest}
                    </code>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
          <Button 
            onClick={handleReset} 
            disabled={isRetrying}
            className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Reintentando...' : 'Reintentar'}
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            className="w-full sm:w-auto"
            size="lg"
          >
            <a href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Ir al Inicio
            </a>
          </Button>

          <Button 
            asChild 
            variant="ghost" 
            className="w-full sm:w-auto"
            size="lg"
          >
            <a href="javascript:history.back()">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </a>
          </Button>
        </CardFooter>
      </Card>

      {/* Footer de ayuda */}
      <div className="z-10 mt-8 text-center space-y-2 animate-in fade-in-0 duration-1000 delay-300">
        <p className="text-sm text-muted-foreground">
          ¿Necesitas ayuda inmediata?
        </p>
        <a 
          href="mailto:soporte@tuempresa.com" 
          className="text-sm text-primary hover:underline underline-offset-4 font-medium"
        >
          Contactar Soporte Técnico
        </a>
      </div>
    </div>
  );
}