
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

export function Footer() {
  return (
    <footer className="bg-sidebar-border/20 text-sidebar-foreground/80">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" className="flex items-center justify-center gap-3" prefetch={false}>
                <Image src="/uploads/images/logo-nexusalpri.png" alt="NexusAlpri Logo" width={40} height={40} data-ai-hint="logo" />
                <span className="text-2xl font-semibold font-headline-alt bg-gradient-to-r from-primary to-purple-500 text-transparent bg-clip-text">
                NexusAlpri
                </span>
            </Link>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center md:text-left">
                <p>&copy; {new Date().getFullYear()} NexusAlpri. Todos los derechos reservados.</p>
                <Separator orientation="vertical" className="h-6 hidden sm:block"/>
                <div className="flex items-center gap-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
                    <span>Desarrollado por</span>
                    <Image src="https://placehold.co/80x25.png" alt="Alprigrama Logo" width={80} height={25} data-ai-hint="company logo"/>
                    <span className="font-semibold">Alprigrama S.A.S.</span>
                </div>
            </div>
        </div>
      </div>
    </footer>
  );
}
