// src/components/layout/public-top-bar.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Info, LogIn } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function PublicTopBar() {
  return (
    <header className={cn(
        "px-4 lg:px-6 h-20 flex items-center sticky top-0 z-50",
        "bg-black/90 backdrop-blur-lg border-b border-border/50" // Fondo más oscuro y sólido
    )}>
      <Link href="/" className="flex items-center justify-center gap-3" prefetch={false}>
        <Image src="/uploads/images/logo-nexusalpri.png" alt="NexusAlpri Logo" width={48} height={48} data-ai-hint="logo"/>
        <span className="text-3xl font-semibold font-headline-alt bg-gradient-to-r from-primary to-blue-500 text-transparent bg-clip-text">
          NexusAlpri
        </span>
      </Link>
      <nav className="ml-auto hidden items-center gap-6 sm:gap-8 lg:flex">
        <Link
          href="/"
          className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2"
          prefetch={false}
        >
          <Home className="h-5 w-5" />
          Inicio
        </Link>
        <Link
          href="/about"
          className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2"
          prefetch={false}
        >
          <Info className="h-5 w-5" />
          Nosotros
        </Link>
        <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
          <Link href="/sign-in" className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Acceder
          </Link>
        </Button>
      </nav>
    </header>
  );
}
