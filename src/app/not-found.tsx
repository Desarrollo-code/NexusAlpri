// src/app/not-found.tsx
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import React from 'react';

// Monstruo SVG mejorado que usa los colores del tema y tiene una animación de respiración.
const MonsterIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M45.57,26.51c-4.48,0-8.11,3.63-8.11,8.11v43.25c0,4.48,3.63,8.11,8.11,8.11h48.86c4.48,0,8.11-3.63,8.11-8.11V34.62c0-4.48-3.63-8.11-8.11-8.11H45.57Z" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="3"/>
        <path d="M37.46,54.14c-5.46-1.57-9.5-6.59-9.5-12.44,0-7.23,5.86-13.09,13.09-13.09h52.9c7.23,0,13.09,5.86,13.09,13.09,0,5.85-4.04,10.87-9.5,12.44" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" strokeWidth="3" />
        <path d="M107.54,86.01s-2.18,12.02-17.45,12.02c-15.28,0-17.45-12.02-17.45-12.02" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M42.46,112.51v-12.02c0-5.52,4.48-10,10-10h35.09c5.52,0,10,4.48,10,10v12.02" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60.32" cy="62.48" r="4.71" fill="hsl(var(--background))" />
        <circle cx="79.68" cy="62.48" r="4.71" fill="hsl(var(--background))" />
    </svg>
);


export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-6 text-center">
      <div className="flex items-center justify-center text-7xl md:text-9xl font-bold text-primary -ml-4 md:-ml-8">
        <span>4</span>
        <MonsterIcon className="h-28 w-28 md:h-40 md:w-40 mx-1 md:mx-4 text-primary animate-bloom" data-ai-hint="cute monster" />
        <span>4</span>
      </div>
      <h1 className="mt-8 text-3xl md:text-4xl font-headline font-bold text-foreground">
        ¡Oops! Página No Encontrada
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Parece que el monstruo de los enlaces rotos se ha comido esta página. No te preocupes, te ayudamos a volver al camino.
      </p>
      <Button asChild className="mt-8">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Panel Principal
        </Link>
      </Button>
    </div>
  );
}
