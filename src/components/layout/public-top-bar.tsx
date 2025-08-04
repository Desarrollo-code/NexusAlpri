'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import Image from 'next/image';

export function PublicTopBar() {
  return (
    <header className="px-4 lg:px-6 h-24 flex items-center bg-sidebar backdrop-blur-sm sticky top-0 z-50 border-b border-sidebar-border shadow-md">
      <Link href="/" className="flex items-center justify-center gap-3" prefetch={false}>
        <Image src="/uploads/images/logo-nexusalpri.png" alt="NexusAlpri Logo" width={48} height={48} data-ai-hint="logo" />
        <span className="text-3xl font-semibold font-headline-alt bg-gradient-to-r from-primary to-purple-500 text-transparent bg-clip-text">
          NexusAlpri
        </span>
      </Link>
      <nav className="ml-auto hidden items-center gap-6 sm:gap-8 lg:flex">
        <Link
          href="/"
          className="text-lg font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground transition-colors"
          prefetch={false}
        >
          Inicio
        </Link>
        <Link
          href="/about"
          className="text-lg font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground transition-colors"
          prefetch={false}
        >
          Nosotros
        </Link>
        <Button asChild size="lg" className="bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground shadow-lg">
          <Link href="/sign-in">Acceder</Link>
        </Button>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden ml-auto">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold"
              prefetch={false}
            >
              <Image src="/uploads/images/logo-nexusalpri.png" alt="NexusAlpri Logo" width={24} height={24} data-ai-hint="logo" />
              <span className="sr-only">NexusAlpri</span>
            </Link>
            <Link href="/" className="hover:text-foreground" prefetch={false}>
              Inicio
            </Link>
            <Link
              href="/about"
              className="text-muted-foreground hover:text-foreground"
              prefetch={false}
            >
              Nosotros
            </Link>
            <Button asChild className="mt-4">
                <Link href="/sign-in">Acceder / Registro</Link>
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
