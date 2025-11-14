'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuthFormContainer({ children }: { children: React.ReactNode }) {
    const { settings, isLoading } = useAuth();
    const authImageUrl = settings?.authImageUrl || "https://placehold.co/800x1200/1e232c/ffffff?text=NexusAlpri&font=sans";

    return (
        <div className="rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl mx-auto md:grid md:grid-cols-2 bg-card">
            <div className="hidden md:block relative min-h-[480px]">
                 {isLoading ? (
                    <div className="w-full h-full bg-muted animate-pulse" />
                ) : (
                    <Image 
                        src={authImageUrl} 
                        alt="Una persona concentrada en un entorno de aprendizaje minimalista y futurista, interactuando con una interfaz de luz." 
                        fill 
                        className="object-cover"
                        data-ai-hint="futuristic learning environment"
                        quality={100}
                        priority
                    />
                )}
            </div>
            
            <div className="w-full p-6 sm:p-10 flex flex-col justify-center bg-card">
                {children}
            </div>
        </div>
    );
}
