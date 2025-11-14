// src/components/auth/2fa-form.tsx
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export default function TwoFactorAuthForm() {
    const { login } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const userId = searchParams.get('userId');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!userId || token.length < 6) {
            setError('Por favor, ingresa el código de 6 dígitos.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/2fa?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, token }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Error de verificación');
            }

            toast({ title: '¡Verificación Exitosa!', description: 'Has iniciado sesión correctamente.' });
            login(data.user);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    if (!userId) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error de Flujo</AlertTitle>
                <AlertDescription>No se encontró el identificador de usuario. Por favor, intenta iniciar sesión de nuevo.</AlertDescription>
            </Alert>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4">
                <InputOTP
                    maxLength={6}
                    value={token}
                    onChange={setToken}
                    disabled={isLoading}
                    autoFocus
                >
                    <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                    </InputOTPGroup>
                </InputOTP>
                 {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={isLoading || token.length < 6}
            >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <ShieldCheck className="mr-2 h-5 w-5" />}
                Verificar Código
            </Button>
        </form>
    );
}
