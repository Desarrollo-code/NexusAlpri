// src/app/(public)/sign-up/[[...sign-up]]/page.tsx
'use client';

import AuthForm from '@/components/auth/auth-form-container';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SignUpPage() {
    const { settings, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && settings && !settings.allowPublicRegistration) {
            router.replace('/sign-in');
        }
    }, [settings, isLoading, router]);

    if (isLoading) {
        return null; 
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
