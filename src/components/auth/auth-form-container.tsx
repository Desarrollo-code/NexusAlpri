// src/components/auth/auth-form-container.tsx
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, LogIn, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { User } from '@/types';
import { useRouter } from 'next/navigation';


export default function AuthForm({ defaultView }: { defaultView: 'signIn' | 'signUp' }) {
    const { login, settings } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [isSignUpActive, setIsSignUpActive] = useState(defaultView === 'signUp');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<{type: 'signIn' | 'signUp', message: string} | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [signInEmail, setSignInEmail] = useState('');
    const [signInPassword, setSignInPassword] = useState('');
    
    // Clear errors when switching panels
    useEffect(() => {
        setError(null);
    }, [isSignUpActive]);


    const handleSignUpSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (password.length < (settings?.passwordMinLength || 8)) {
            setError({ type: 'signUp', message: `La contraseña debe tener al menos ${settings?.passwordMinLength || 8} caracteres.` });
            return;
        }
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
            setError({ type: 'signUp', message: (err as Error).message });
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
                body: JSON.stringify({ email: signInEmail, password: signInPassword }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ocurrió un error inesperado.');

            if (data.twoFactorRequired) {
                // This would be the place to redirect to a 2FA verification page
                // For now, we assume it's part of a more complex flow not yet implemented
                // router.push(`/verify-2fa?userId=${data.userId}`);
                toast({ title: 'Verificación de dos factores requerida', description: 'Funcionalidad en desarrollo.'});
            } else {
                toast({ title: '¡Bienvenido de nuevo!' });
                login(data.user);
            }
        } catch (err) {
            setError({ type: 'signIn', message: (err as Error).message });
        } finally {
            setIsLoading(false);
        }
    }


    const SignUpForm = () => (
        <form onSubmit={handleSignUpSubmit} className="flex flex-col items-center justify-center px-12 text-center h-full space-y-4">
            <h1 className="text-3xl font-bold font-headline text-foreground">Crear Cuenta</h1>
            {error && error.type === 'signUp' && (
                <Alert variant="destructive" className="text-xs text-left"><AlertDescription>{error.message}</AlertDescription></Alert>
            )}
            <Input type="text" placeholder="Nombre" required value={name} onChange={e => setName(e.target.value)} disabled={isLoading} />
            <Input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
            <Input type="password" placeholder="Contraseña" required value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
            <Button type="submit" className="w-40 !mt-6" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Registrarse'}
            </Button>
        </form>
    );

    const SignInForm = () => (
         <form onSubmit={handleSignInSubmit} className="flex flex-col items-center justify-center px-12 text-center h-full space-y-4">
            <h1 className="text-3xl font-bold font-headline text-foreground">Iniciar Sesión</h1>
             {error && error.type === 'signIn' && (
                <Alert variant="destructive" className="text-xs text-left"><AlertDescription>{error.message}</AlertDescription></Alert>
            )}
            <Input type="email" placeholder="Email" required value={signInEmail} onChange={e => setSignInEmail(e.target.value)} disabled={isLoading} />
            <Input type="password" placeholder="Contraseña" required value={signInPassword} onChange={e => setSignInPassword(e.target.value)} disabled={isLoading} />
            <Button type="submit" className="w-40 !mt-6" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ingresar'}
            </Button>
        </form>
    );

    return (
        <div className={cn(
            "relative w-full max-w-4xl min-h-[480px] bg-card rounded-2xl shadow-2xl overflow-hidden",
            "transition-all duration-700 ease-in-out",
            isSignUpActive && "right-panel-active"
        )}>
            {/* Form Containers */}
            <div className={cn(
                "form-container sign-up-container",
                "absolute top-0 h-full w-1/2 left-0 transition-all duration-700 ease-in-out",
                isSignUpActive ? "transform translate-x-full opacity-100 z-20" : "opacity-0 z-10"
            )}>
                <SignUpForm />
            </div>
            <div className={cn(
                "form-container sign-in-container",
                "absolute top-0 h-full w-1/2 left-0 transition-all duration-700 ease-in-out",
                isSignUpActive ? "transform translate-x-full opacity-0 z-10" : "opacity-100 z-20"
            )}>
                 <SignInForm />
            </div>

            {/* Overlay Container */}
            <div className={cn(
                "overlay-container",
                "absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-40",
                 isSignUpActive && "-translate-x-full"
            )}>
                <div className={cn(
                    "overlay",
                    "relative -left-full h-full w-[200%] bg-gradient-to-r from-accent to-primary text-primary-foreground",
                    "transition-transform duration-700 ease-in-out",
                     isSignUpActive ? "translate-x-1/2" : "translate-x-0"
                )}>
                    {/* Panel for Sign Up */}
                    <div className={cn(
                        "overlay-panel overlay-left",
                        "absolute top-0 h-full w-1/2 flex flex-col items-center justify-center p-12 text-center",
                        "transition-transform duration-700 ease-in-out",
                        isSignUpActive ? "translate-x-0" : "-translate-x-[20%]"
                    )}>
                        <h1 className="text-3xl font-bold font-headline mt-4">¡Bienvenido de Nuevo!</h1>
                        <p className="max-w-xs mt-4">Para mantenerte conectado, por favor inicia sesión con tu información personal.</p>
                        <Button variant="outline" onClick={() => setIsSignUpActive(false)} className="mt-8 bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                            Iniciar Sesión
                        </Button>
                    </div>
                    {/* Panel for Sign In */}
                    <div className={cn(
                        "overlay-panel overlay-right",
                         "absolute top-0 right-0 h-full w-1/2 flex flex-col items-center justify-center p-12 text-center",
                         "transition-transform duration-700 ease-in-out",
                         isSignUpActive ? "translate-x-[20%]" : "translate-x-0"
                    )}>
                        <h1 className="text-3xl font-bold font-headline mt-4">¡Hola, Amigo!</h1>
                        <p className="max-w-xs mt-4">Ingresa tus datos personales y comienza tu viaje con nosotros.</p>
                        <Button variant="outline" onClick={() => setIsSignUpActive(true)} className="mt-8 bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                            Registrarse
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
