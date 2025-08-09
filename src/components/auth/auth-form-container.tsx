// src/components/auth/auth-form-container.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, LogIn, Eye, EyeOff, UserCircle, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type AuthView = 'signIn' | 'signUp';

export default function AuthForm({ defaultView }: { defaultView: AuthView }) {
    const { login, settings } = useAuth();
    const { toast } = useToast();

    const [activeView, setActiveView] = useState<AuthView>(defaultView);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (activeView === 'signUp') {
            if (password !== confirmPassword) {
                setError("Las contraseñas no coinciden.");
                setIsLoading(false);
                return;
            }
            if (settings) {
                const passwordPolicyError = getPasswordPolicyError(password, settings);
                if (passwordPolicyError) {
                    setError(passwordPolicyError);
                    setIsLoading(false);
                    return;
                }
            }
        }

        const endpoint = activeView === 'signIn' ? '/api/auth/login' : '/api/auth/register';
        const payload = activeView === 'signIn' ? { email, password } : { name, email, password };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ocurrió un error inesperado.');
            }
            
            if (data.twoFactorRequired) {
                // This design doesn't support 2FA yet. We can add it later.
                // For now, let's treat it as a successful login step.
                toast({ title: 'Verificación requerida', description: 'Por favor, revisa tu app de autenticación.' });
                // Here you would typically show a 2FA input form.
            } else {
                toast({ title: '¡Éxito!', description: activeView === 'signIn' ? 'Bienvenido de nuevo.' : 'Tu cuenta ha sido creada.' });
                login(data.user);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const getPasswordPolicyError = (pass: string, policy: typeof settings) => {
      if (!policy) return null;
      if (pass.length < policy.passwordMinLength) return `La contraseña debe tener al menos ${policy.passwordMinLength} caracteres.`;
      if (policy.passwordRequireUppercase && !/[A-Z]/.test(pass)) return "La contraseña debe contener al menos una letra mayúscula.";
      if (policy.passwordRequireLowercase && !/[a-z]/.test(pass)) return "La contraseña debe contener al menos una letra minúscula.";
      if (policy.passwordRequireNumber && !/\d/.test(pass)) return "La contraseña debe contener al menos un número.";
      if (policy.passwordRequireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) return "La contraseña debe contener al menos un carácter especial.";
      return null;
  }

    const FormContent = ({ isSignIn }: { isSignIn: boolean }) => (
        <form onSubmit={handleFormSubmit} className="flex flex-col items-center justify-center h-full px-4 sm:px-12 text-center space-y-4">
             <h1 className="text-3xl font-bold font-headline text-foreground">
                {isSignIn ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <div className="flex items-center space-x-2">
                 <div className="h-px w-8 bg-border" />
                 <span className="text-muted-foreground text-xs">{isSignIn ? 'ACCEDE A TU PLATAFORMA' : 'COMPLETA TUS DATOS'}</span>
                 <div className="h-px w-8 bg-border" />
            </div>

            {error && (
                <Alert variant="destructive" className="text-xs text-left">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!isSignIn && (
                 <div className="w-full space-y-1 text-left">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" type="text" placeholder="Tu Nombre Completo" required value={name} onChange={e => setName(e.target.value)} disabled={isLoading} />
                 </div>
            )}
            <div className="w-full space-y-1 text-left">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="tu@email.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
            </div>
             <div className="w-full space-y-1 text-left">
                <Label htmlFor="password">Contraseña</Label>
                 <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                 </div>
            </div>
            {!isSignIn && (
                <div className="w-full space-y-1 text-left">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                     <div className="relative">
                        <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={isLoading} className="pr-10" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            )}
            <Button type="submit" className="w-40">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignIn ? 'Ingresar' : 'Registrarse'}
            </Button>
        </form>
    );

    const OverlayPanel = ({ forSignIn }: { forSignIn: boolean }) => (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center text-primary-foreground h-full">
            <Image src="/uploads/images/logo-nexusalpri.png" alt="Logo" width={80} height={80} data-ai-hint="logo"/>
            <h1 className="text-3xl font-bold font-headline mt-4">
                {forSignIn ? '¡Bienvenido de Nuevo!' : '¡Hola, Amigo!'}
            </h1>
            <div className="h-1 w-10 bg-primary-foreground/50 my-4 rounded-full" />
            <p className="max-w-xs">
                {forSignIn
                    ? 'Para mantenerte conectado con nosotros, por favor inicia sesión con tu información personal.'
                    : 'Ingresa tus datos personales y comienza tu viaje con nosotros.'}
            </p>
            <Button
                variant="outline"
                onClick={() => setActiveView(forSignIn ? 'signIn' : 'signUp')}
                className="mt-8 bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
                {forSignIn ? 'Iniciar Sesión' : 'Registrarse'}
            </Button>
        </div>
    );

    return (
        <div className={cn(
            "relative w-full max-w-4xl min-h-[550px] bg-card rounded-2xl shadow-2xl overflow-hidden",
            "transition-all duration-700 ease-in-out"
        )}>
            {/* Form Containers */}
            <div className={cn(
                "absolute top-0 h-full w-1/2 left-0 transition-all duration-700 ease-in-out",
                activeView === 'signUp' && "transform translate-x-full z-10",
                activeView === 'signIn' && "z-20"
            )}>
                <FormContent isSignIn={true} />
            </div>
            <div className={cn(
                "absolute top-0 h-full w-1/2 left-0 transition-all duration-700 ease-in-out",
                activeView === 'signIn' && "transform -translate-x-full z-10",
                activeView === 'signUp' && "z-20"
            )}>
                 <FormContent isSignIn={false} />
            </div>

             {/* Overlay Container */}
            <div className={cn(
                "absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-40",
                 activeView === 'signUp' && "-translate-x-full"
            )}>
                <div className={cn(
                    "relative -left-full h-full w-[200%] bg-gradient-to-r from-accent to-primary text-primary-foreground",
                    "transition-transform duration-700 ease-in-out",
                     activeView === 'signUp' && "translate-x-1/2"
                )}>
                    {/* Panel for Sign In */}
                    <div className="absolute top-0 left-0 h-full w-1/2">
                         <OverlayPanel forSignIn={false} />
                    </div>
                    {/* Panel for Sign Up */}
                    <div className="absolute top-0 right-0 h-full w-1/2">
                        <OverlayPanel forSignIn={true} />
                    </div>
                </div>
            </div>
        </div>
    );
}