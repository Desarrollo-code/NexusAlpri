// src/components/auth/auth-form-container.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';


const FormInput = ({ icon: Icon, ...props }: { icon: React.ElementType } & React.ComponentProps<typeof Input>) => (
    <div className="relative flex items-center">
        <Icon className="absolute left-3 h-5 w-5 text-gray-400" />
        <Input className="pl-10 bg-muted/30 border-muted-foreground/50 focus:bg-muted/50" {...props} />
    </div>
);

export default function AuthForm({ defaultView }: { defaultView: 'signIn' | 'signUp' }) {
    const { login } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const [isSignUpActive, setIsSignUpActive] = useState(defaultView === 'signUp');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const resetFields = () => {
        setName('');
        setEmail('');
        setPassword('');
        setError(null);
    }

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

    return (
        <div className={cn(
            "relative w-full overflow-hidden rounded-lg bg-card shadow-2xl transition-all duration-700",
            "md:max-w-4xl md:min-h-[480px]",
            isSignUpActive && "right-panel-active"
        )} id="container">

            {/* Sign Up Form */}
            <div className={cn(
                "form-container sign-up-container",
                isSignUpActive ? "opacity-100 z-20" : "opacity-0 z-10"
            )}>
                 <form onSubmit={handleSignUpSubmit} className="auth-form">
                    <h1 className="text-3xl font-bold font-headline text-foreground mb-4">Crear Cuenta</h1>
                    {error && isSignUpActive && <Alert variant="destructive" className="text-xs text-left"><AlertDescription>{error}</AlertDescription></Alert>}
                    <FormInput icon={User} type="text" placeholder="Nombre" required value={name} onChange={e => setName(e.target.value)} disabled={isLoading} />
                    <FormInput icon={Mail} type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
                    <FormInput icon={Lock} type="password" placeholder="Contraseña" required value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
                    <Button type="submit" className="w-full max-w-xs mt-4" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Registrarse'}
                    </Button>
                </form>
            </div>
            
            {/* Sign In Form */}
            <div className={cn(
                "form-container sign-in-container",
                isSignUpActive ? "opacity-0 z-10" : "opacity-100 z-20"
            )}>
                 <form onSubmit={handleSignInSubmit} className="auth-form">
                    <h1 className="text-3xl font-bold font-headline text-foreground mb-4">Iniciar Sesión</h1>
                    {error && !isSignUpActive && <Alert variant="destructive" className="text-xs text-left"><AlertDescription>{error}</AlertDescription></Alert>}
                    <FormInput icon={Mail} type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
                    <FormInput icon={Lock} type="password" placeholder="Contraseña" required value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
                    <Button type="submit" className="w-full max-w-xs mt-4" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ingresar'}
                    </Button>
                </form>
            </div>

            {/* Overlay Container */}
            <div className="overlay-container">
                <div className="overlay">
                    {/* Sign In Overlay */}
                    <div className="overlay-panel overlay-left">
                        <h1 className="text-3xl font-bold font-headline">¡Bienvenido de Nuevo!</h1>
                        <p className="mt-4 text-sm font-light leading-relaxed">Para mantenerte conectado, por favor inicia sesión con tu información personal.</p>
                        <Button variant="outline" className="mt-6 ghost" onClick={() => { setIsSignUpActive(false); resetFields(); }}>
                            Iniciar Sesión
                        </Button>
                    </div>

                    {/* Sign Up Overlay */}
                     <div className="overlay-panel overlay-right">
                        <h1 className="text-3xl font-bold font-headline">¡Hola, Amigo!</h1>
                        <p className="mt-4 text-sm font-light leading-relaxed">Ingresa tus datos personales y comienza tu viaje con nosotros.</p>
                        <Button variant="outline" className="mt-6 ghost" onClick={() => { setIsSignUpActive(true); resetFields(); }}>
                            Registrarse
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    );
}
