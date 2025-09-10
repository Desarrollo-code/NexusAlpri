// src/components/auth/auth-form-container.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';

export default function AuthFormContainer({ children }: { children: React.ReactNode }) {
    const { settings } = useAuth();

    return (
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl mx-auto md:grid md:grid-cols-2">
            <div className="hidden md:flex p-8 lg:p-12 relative text-white btn-primary-gradient flex-col justify-between">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold font-headline">{settings?.platformName || 'NexusAlpri'}</h2>
                    <p className="mt-2 text-white/80 max-w-sm">La plataforma para potenciar el talento de tu equipo.</p>
                </div>
                {settings?.authImageUrl ? 
                    <Image src={settings.authImageUrl} alt="Decorative background" fill className="object-cover opacity-20" data-ai-hint="abstract geometric" />
                    : <div className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 bg-white/10 rounded-full" />
                }
            </div>
            <div className="w-full p-6 sm:p-10 flex flex-col justify-center">
                {children}
            </div>
        </div>
    );
}
