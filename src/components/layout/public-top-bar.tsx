// src/components/layout/public-top-bar.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function PublicTopBar() {
  return (
    <header className={cn(
        "px-4 lg:px-6 h-20 flex items-center sticky top-0 z-50",
        "bg-background/80 backdrop-blur-lg border-b"
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
          className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
          prefetch={false}
        >
          Inicio
        </Link>
        <Link
          href="/about"
          className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
          prefetch={false}
        >
          Nosotros
        </Link>
        <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
          <Link href="/sign-in">Acceder</Link>
        </Button>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden ml-auto h-10 w-10 text-foreground hover:bg-muted">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-background border-r p-0">
            <div className="flex items-center justify-between border-b p-4 h-20">
                <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
                    <Image src="/uploads/images/logo-nexusalpri.png" alt="NexusAlpri Logo" width={32} height={32} data-ai-hint="logo" />
                     <span className="text-xl font-semibold font-headline-alt bg-gradient-to-r from-primary to-purple-500 text-transparent bg-clip-text">
                        NexusAlpri
                    </span>
                </Link>
                 <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
            </div>
            <div className="p-4">
              <nav className="grid gap-4 text-lg font-medium">
                <Link href="/" className="p-3 rounded-md hover:bg-muted transition-colors" prefetch={false}>
                  Inicio
                </Link>
                <Link
                  href="/about"
                  className="p-3 rounded-md hover:bg-muted transition-colors"
                  prefetch={false}
                >
                  Nosotros
                </Link>
              </nav>
               <div className="mt-8">
                 <Button asChild size="lg" className="w-full rounded-full shadow-lg shadow-primary/20">
                    <Link href="/sign-in">Acceder</Link>
                </Button>
               </div>
            </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
