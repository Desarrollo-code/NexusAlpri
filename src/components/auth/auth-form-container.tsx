// src/components/auth/auth-form-container.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function AuthForm({ defaultView }: { defaultView: 'signIn' | 'signUp' }) {
    const { login } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Common fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Sign Up specific field
    const [name, setName] = useState('');

    const handleSignUpSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ocurrió un error inesperado.');
            
            toast({ title: '¡Cuenta Creada!', description: 'Bienvenido. Has iniciado sesión correctamente.' });
            login(data.user);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSignInSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ocurrió un error inesperado.');
            
            if (data.twoFactorRequired) {
                 const redirectPath = `/sign-in/2fa?userId=${data.userId}&redirectedFrom=${encodeURIComponent(searchParams.get('redirectedFrom') || '/dashboard')}`;
                 window.location.href = redirectPath;
            } else {
                toast({ title: '¡Bienvenido de nuevo!' });
                login(data.user);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }

    if (defaultView === 'signUp') {
        return (
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center bg-primary text-primary-foreground p-8 rounded-t-lg">
                    <h1 className="text-3xl font-bold">¡Hola, Amigo!</h1>
                    <p className="mt-2 text-sm">Ingresa tus datos personales y comienza tu viaje con nosotros.</p>
                </div>
                <form onSubmit={handleSignUpSubmit} className="space-y-4 p-8 pt-4 bg-card rounded-b-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-center text-foreground">Registrarse</h2>
                     {error && (
                        <Alert variant="destructive" className="text-xs text-left"><AlertDescription>{error}</AlertDescription></Alert>
                    )}
                    <div className="space-y-2">
                        <Input type="text" placeholder="Nombre" required value={name} onChange={e => setName(e.target.value)} disabled={isLoading} />
                    </div>
                     <div className="space-y-2">
                        <Input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <Input type="password" placeholder="Contraseña" required value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Registrarse'}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground pt-2">
                        ¿Ya tienes una cuenta? <Link href="/sign-in" className="font-semibold text-primary hover:underline">Inicia Sesión</Link>
                    </p>
                </form>
            </div>
        );
    }

    return (
        <div className="w-full max-w-sm space-y-6">
            <div className="text-center bg-primary text-primary-foreground p-8 rounded-t-lg">
                <h1 className="text-3xl font-bold">¡Bienvenido!</h1>
                <p className="mt-2 text-sm">Regístrate con tus datos personales para usar todas las funciones del sitio.</p>
                <Button asChild variant="outline" className="mt-4 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                    <Link href="/sign-up">Registrarse</Link>
                </Button>
            </div>
            <form onSubmit={handleSignInSubmit} className="space-y-4 p-8 pt-4 bg-card rounded-b-lg shadow-lg">
                <h2 className="text-2xl font-bold text-center text-foreground">Iniciar Sesión</h2>
                {error && (
                    <Alert variant="destructive" className="text-xs text-left"><AlertDescription>{error}</AlertDescription></Alert>
                )}
                 <div className="space-y-2">
                    <Input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                    <Input type="password" placeholder="Contraseña" required value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ingresar'}
                </Button>
            </form>
        </div>
    );
}
