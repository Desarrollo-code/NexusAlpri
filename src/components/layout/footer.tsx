'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

export function Footer() {
  return (
    // CAMBIOS: 
    // 1. bg-blue-600 (Azul) y text-white para contraste.
    // 2. md:fixed md:bottom-0 md:w-full para anclarlo en pantallas grandes.
    <footer className="bg-blue-600 text-white hidden md:block md:fixed md:bottom-0 md:left-0 md:w-full z-50">
      <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-center">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} NexusAlpri. 
            </p>
            {/* Cambié el color del separador a blanco para que se vea sobre el azul */}
            <Separator orientation="vertical" className="h-4 hidden md:block bg-white/30" />
            <div className="flex items-center gap-2 text-sm">
                <span>Desarrollado con ❤️ por</span>
                <span className="font-bold">Alprigrama</span>
            </div>
        </div>
      </div>
    </footer>
  );
}