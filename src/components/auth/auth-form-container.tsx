'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuthFormContainer({ children }: { children: React.ReactNode }) {
    const { settings } = useAuth();
    const authImageUrl = settings?.authImageUrl || "https://placehold.co/800x1200/1e232c/ffffff?text=NexusAlpri&font=sans";

    return (
        // Mantengo 'bg-white' en el contenedor principal para cubrir el fondo cuadriculado en todo el módulo.
        <div className="rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl mx-auto md:grid md:grid-cols-2 bg-white">
            {/* Columna de la Imagen */}
            <div className="hidden md:block relative min-h-[480px]">
                <Image 
                    src={authImageUrl} 
                    alt="Bienvenida a NexusAlpri" 
                    fill 
                    className="object-cover"
                    data-ai-hint="workplace students"
                    quality={100}
                    priority
                />
            </div>
            
            {/* Columna del Formulario */}
            {/* ESTE ES EL CAMBIO CLAVE: Añado bg-white o lo fuerzo en caso de que bg-card no sea un color sólido por defecto.
               Si 'bg-card' ya es blanco o un color sólido, puedes intentar solo reemplazar 'bg-card' por 'bg-white' si el problema persiste. 
               Por ahora, lo forzaré a 'bg-white' para garantizar la limpieza. */}
            <div className="w-full p-6 sm:p-10 flex flex-col justify-center bg-white">
                {children}
            </div>
        </div>
    );
}