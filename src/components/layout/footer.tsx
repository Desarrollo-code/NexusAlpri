
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

export function Footer() {
  return (
    <footer className="bg-muted/30 text-foreground/80 relative">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-center">
            <p className="text-sm">&copy; {new Date().getFullYear()} NexusAlpri. Todos los derechos reservados.</p>
        </div>
      </div>
      <div className="absolute bottom-4 right-6 hidden md:flex items-center gap-2 text-xs text-muted-foreground/50 opacity-80 hover:opacity-100 transition-opacity">
          <span>Desarrollado por</span>
          <Image src="https://placehold.co/80x25.png" alt="Alprigrama Logo" width={60} height={18} data-ai-hint="company logo"/>
      </div>
    </footer>
  );
}
