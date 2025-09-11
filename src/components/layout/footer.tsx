// src/components/layout/footer.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

export function Footer() {
  return (
    <footer className="bg-transparent text-slate-600 hidden md:block">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-center">
            <p className="text-sm">&copy; {new Date().getFullYear()} NexusAlpri. Todos los derechos reservados.</p>
            <Separator orientation="vertical" className="h-4 hidden md:block !bg-slate-300" />
            <div className="flex items-center gap-2 text-sm">
                <span>Desarrollado con ❤️ por</span>
                <span className="font-bold text-slate-700">Alprigrama</span>
            </div>
        </div>
      </div>
    </footer>
  );
}
