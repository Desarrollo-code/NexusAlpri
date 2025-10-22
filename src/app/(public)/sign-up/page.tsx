// src/app/(public)/sign-up/page.tsx
'use client';

import React, { Suspense } from 'react';
import AuthForm from '@/components/auth/auth-form';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

function SignUpPageComponent() {
    const { settings, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && settings && !settings.allowPublicRegistration) {
            router.replace('/sign-in');
        }
    }, [settings, isLoading, router]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (!settings?.allowPublicRegistration) {
       return (
         <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Registro Deshabilitado</CardTitle>
                <CardDescription>El registro de nuevas cuentas está actualmente deshabilitado por el administrador.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full">
                    <Link href="/sign-in">Volver a Inicio de Sesión</Link>
                </Button>
            </CardContent>
         </Card>
       )
    }

    return <AuthForm defaultView="signUp" />;
}

export default function SignUpPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SignUpPageComponent />
        </Suspense>
    )
}
