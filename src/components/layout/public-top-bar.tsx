
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Mountain } from 'lucide-react';
import Image from 'next/image';

export function PublicTopBar() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b">
      <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
        <Image src="/uploads/images/logo-nexusalpri.png" alt="NexusAlpri Logo" width={32} height={32} data-ai-hint="logo" />
        <span className="text-xl font-semibold font-headline-alt bg-gradient-to-r from-primary to-purple-500 text-transparent bg-clip-text">
          NexusAlpri
        </span>
      </Link>
      <nav className="ml-auto hidden gap-4 sm:gap-6 lg:flex">
        <Link
          href="/"
          className="text-sm font-medium hover:underline underline-offset-4"
          prefetch={false}
        >
          Inicio
        </Link>
        <Link
          href="/about"
          className="text-sm font-medium hover:underline underline-offset-4"
          prefetch={false}
        >
          Nosotros
        </Link>
        <Button asChild>
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
