// src/app/error.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, AlertCircle, Home } from 'lucide-react';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Componente del búho confundido animado
const ConfusedOwl = () => {
  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Cuerpo del búho */}
        <ellipse cx="100" cy="120" rx="60" ry="70" fill="#8B7355" className="drop-shadow-lg"/>
        
        {/* Barriga más clara */}
        <ellipse cx="100" cy="130" rx="40" ry="50" fill="#D4A574"/>
        
        {/* Alas caídas (confundido) */}
        <ellipse cx="50" cy="120" rx="25" ry="45" fill="#6B5644" className="animate-[wing_3s_ease-in-out_infinite]" style={{transformOrigin: '50px 120px'}}/>
        <ellipse cx="150" cy="120" rx="25" ry="45" fill="#6B5644" className="animate-[wing_3s_ease-in-out_infinite_0.5s]" style={{transformOrigin: '150px 120px'}}/>
        
        {/* Cabeza */}
        <circle cx="100" cy="70" r="45" fill="#8B7355" className="drop-shadow-lg"/>
        
        {/* Orejas/plumas superiores */}
        <path d="M 70 35 Q 65 20 75 25 Q 70 15 80 20 L 75 40 Z" fill="#6B5644"/>
        <path d="M 130 35 Q 135 20 125 25 Q 130 15 120 20 L 125 40 Z" fill="#6B5644"/>
        
        {/* Ojos grandes (confundidos) */}
        <g className="animate-[blink_4s_ease-in-out_infinite]">
          {/* Ojo izquierdo */}
          <circle cx="85" cy="65" r="18" fill="white"/>
          <circle cx="85" cy="65" r="12" fill="#2C2C2C"/>
          <circle cx="88" cy="62" r="5" fill="white" className="animate-[look_3s_ease-in-out_infinite]"/>
          
          {/* Ojo derecho */}
          <circle cx="115" cy="65" r="18" fill="white"/>
          <circle cx="115" cy="65" r="12" fill="#2C2C2C"/>
          <circle cx="118" cy="62" r="5" fill="white" className="animate-[look_3s_ease-in-out_infinite]"/>
        </g>
        
        {/* Cejas preocupadas */}
        <path d="M 70 50 Q 80 45 90 50" stroke="#2C2C2C" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 110 50 Q 120 45 130 50" stroke="#2C2C2C" strokeWidth="3" fill="none" strokeLinecap="round"/>
        
        {/* Pico pequeño */}
        <path d="M 100 75 L 95 85 L 105 85 Z" fill="#FFA500"/>
        
        {/* Patas */}
        <g>
          <ellipse cx="85" cy="185" rx="12" ry="8" fill="#FFA500"/>
          <ellipse cx="115" cy="185" rx="12" ry="8" fill="#FFA500"/>
        </g>
        
        {/* Lentes torcidos */}
        <g className="animate-[tilt_2s_ease-in-out_infinite]" style={{transformOrigin: '100px 65px'}}>
          {/* Marco izquierdo */}
          <circle cx="85" cy="65" r="20" fill="none" stroke="#333" strokeWidth="2.5"/>
          {/* Marco derecho */}
          <circle cx="115" cy="65" r="20" fill="none" stroke="#333" strokeWidth="2.5"/>
          {/* Puente */}
          <line x1="105" y1="65" x2="95" y2="65" stroke="#333" strokeWidth="2.5"/>
          {/* Patillas */}
          <line x1="65" y1="65" x2="50" y2="60" stroke="#333" strokeWidth="2.5"/>
          <line x1="135" y1="65" x2="150" y2="60" stroke="#333" strokeWidth="2.5"/>
        </g>
      </svg>
      
      {/* Estrellitas de confusión */}
      <div className="absolute top-0 right-4 animate-[spin_3s_linear_infinite]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
        </svg>
      </div>
      <div className="absolute top-8 left-2 animate-[spin_4s_linear_infinite_reverse]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
        </svg>
      </div>
      <div className="absolute bottom-4 left-8 animate-[spin_3.5s_linear_infinite]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
        </svg>
      </div>
      
      <style jsx>{`
        @keyframes blink {
          0%, 45%, 55%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.1); }
        }
        @keyframes tilt {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes look {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-2px, 0); }
          75% { transform: translate(2px, 0); }
        }
        @keyframes wing {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-10deg); }
        }
      `}</style>
    </div>
  );
};

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
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    reset();
    setIsRetrying(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-amber-50/20 dark:to-amber-950/10 p-4 text-center overflow-hidden">
      <DecorativeHeaderBackground />
      
      {/* Elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.7s'}} />
      </div>

      <Card className="z-10 w-full max-w-2xl bg-card/95 backdrop-blur-md shadow-2xl border-2 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
        <CardHeader className="space-y-6 pb-4">
          {/* Búho animado */}
          <div className="animate-in zoom-in-50 duration-500">
            <ConfusedOwl />
          </div>

          {/* Código de error */}
          <div className="space-y-2">
            <h1 className="text-7xl font-extrabold tracking-tighter bg-gradient-to-br from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent font-headline">
              500
            </h1>
            <CardTitle className="text-3xl font-bold font-headline text-foreground">
              ¡Vaya! Hasta el búho más sabio se confunde
            </CardTitle>
          </div>

          <CardDescription className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            Hemos encontrado un problema inesperado en nuestra plataforma de aprendizaje. Nuestro equipo técnico ya está investigando qué salió mal.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Información adicional */}
          <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm text-foreground flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              ¿Qué puedes hacer mientras tanto?
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">📚</span>
                <span>Intenta recargar la página para continuar con tu aprendizaje</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">🏠</span>
                <span>Regresa al panel principal y accede a tus cursos desde allí</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">💬</span>
                <span>Si el problema persiste, nuestro equipo de soporte está listo para ayudarte</span>
              </li>
            </ul>
          </div>

          {/* Detalles técnicos */}
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
            className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
            size="lg"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Reintentando...' : 'Reintentar'}
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            className="w-full sm:w-auto border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/20"
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
            className="w-full sm:w-auto hover:bg-amber-50 dark:hover:bg-amber-950/20"
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
          className="text-sm text-amber-600 dark:text-amber-400 hover:underline underline-offset-4 font-medium"
        >
          Contactar Soporte Técnico
        </a>
      </div>
    </div>
  );
}