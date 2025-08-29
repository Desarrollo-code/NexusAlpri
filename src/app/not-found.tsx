// src/app/not-found.tsx
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import React from 'react';
import { DecorativeHeaderBackground } from '@/components/layout/decorative-header-background';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Un monstruo SVG más amigable y detallado
const LostMonsterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
        <feOffset dx="2" dy="4" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.5" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#shadow)" className="animate-bloom" style={{ animationDelay: '0.2s' }}>
      {/* Cuerpo */}
      <path d="M45,110 C25,120 20,80 40,70 S50,40 75,40 S100,60 110,70 S125,100 105,110 Z" fill="hsl(var(--primary))" />
      {/* Ojos */}
      <g>
        <circle cx="60" cy="70" r="12" fill="hsl(var(--background))" />
        <circle cx="62" cy="72" r="5" fill="hsl(var(--foreground))" />
        <circle cx="90" cy="70" r="12" fill="hsl(var(--background))" />
        <circle cx="88" cy="72" r="5" fill="hsl(var(--foreground))" />
      </g>
      {/* Antena */}
      <path d="M75,40 Q80,20 85,25" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="85" cy="25" r="7" fill="hsl(var(--accent))" />
    </g>
  </svg>
);


export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center overflow-hidden">
        <DecorativeHeaderBackground />
        <Card className="z-10 w-full max-w-lg bg-card/80 backdrop-blur-sm shadow-2xl">
            <CardHeader>
                <div className="mx-auto w-40 h-40">
                    <LostMonsterIcon data-ai-hint="cute monster mascot" />
                </div>
                 <h1 className="text-6xl font-extrabold tracking-tighter text-primary font-headline">404</h1>
                 <CardTitle className="text-3xl font-bold font-headline text-foreground">
                    Página No Encontrada
                 </CardTitle>
                 <CardDescription className="text-base text-muted-foreground">
                    El recurso que buscas no existe o ha sido movido. Es posible que el enlace esté roto o que la dirección sea incorrecta.
                 </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Te recomendamos volver a un lugar seguro o explorar nuestros cursos para encontrar lo que necesitas.
                </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4">
                 <Button asChild className="w-full sm:w-auto">
                    <Link href="/dashboard">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver al Panel Principal
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" className="w-full sm:w-auto">
                    <Link href="/courses">
                      <Search className="mr-2 h-4 w-4" />
                      Explorar Cursos
                    </Link>
                  </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
