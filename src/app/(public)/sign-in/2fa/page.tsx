
// src/app/(public)/sign-in/2fa/page.tsx
'use client';

import TwoFactorAuthForm from '@/components/auth/2fa-form';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';

export default function TwoFactorAuthPage() {
    const { settings } = useAuth();
    
    return (
       <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl mx-auto md:grid md:grid-cols-2">
                <div className="hidden md:flex p-8 lg:p-12 relative text-white btn-primary-gradient flex-col justify-between">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold font-headline">{settings?.platformName || 'NexusAlpri'}</h2>
                        <p className="mt-2 text-white/80 max-w-sm">Un último paso para proteger tu cuenta.</p>
                    </div>
                     {settings?.authImageUrl ? 
                        <Image src={settings.authImageUrl} alt="Decorative background" fill className="object-cover opacity-20" data-ai-hint="abstract security" quality={100} />
                        : <div className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 bg-white/10 rounded-full" />
                     }
                </div>

                <div className="w-full p-6 sm:p-10 flex flex-col justify-center">
                     <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold font-headline text-foreground">
                           Verificación de Dos Pasos
                        </h1>
                        <p className="text-muted-foreground">
                           Ingresa el código de tu aplicación de autenticación.
                        </p>
                    </div>
                    <TwoFactorAuthForm />
                </div>
            </div>
        </div>
    );
}
