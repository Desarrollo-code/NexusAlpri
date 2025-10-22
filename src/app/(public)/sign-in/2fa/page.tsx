// src/app/(public)/sign-in/2fa/page.tsx
'use client';

import React, { Suspense } from 'react';
import TwoFactorAuthForm from '@/components/auth/2fa-form';
import AuthFormContainer from '@/components/auth/auth-form-container';
import { Loader2 } from 'lucide-react';

function TwoFactorAuthPageComponent() {
    return (
       <AuthFormContainer>
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold font-headline text-foreground">
                    Verificación de Dos Pasos
                </h1>
                <p className="text-muted-foreground">
                    Ingresa el código de tu aplicación de autenticación.
                </p>
            </div>
            <TwoFactorAuthForm />
       </AuthFormContainer>
    );
}


export default function TwoFactorAuthPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <TwoFactorAuthPageComponent />
        </Suspense>
    );
}
