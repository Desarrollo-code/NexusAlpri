// src/components/auth/auth-form-container.tsx
'use client';

import { useState, type FormEvent, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { PasswordStrengthIndicator } from '@/components/password-strength-indicator';

const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeInOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeInOut" } }
};

export default function AuthForm({ defaultView }: { defaultView: 'signIn' | 'signUp' }) {
    const { login, settings } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [view, setView] = useState(defaultView);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    
     useEffect(() => {
        setView(defaultView);
        resetFields();
    }, [defaultView]);

    const resetFields = () => {
        setName('');
        setEmail('');
        setPassword('');
        setError(null);
        setIsPasswordFocused(false);
    }
    
    const validatePassword = () => {
        if (!settings) return true; // Si no hay settings, no se puede validar.

        if (password.length < settings.passwordMinLength) return false;
        if (settings.passwordRequireUppercase && !/[A-Z]/.test(password)) return false;
        if (settings.passwordRequireLowercase && !/[a-z]/.test(password)) return false;
        if (settings.passwordRequireNumber && !/\d/.test(password)) return false;
        if (settings.passwordRequireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;

        return true;
    };


    const handleSignUpSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!validatePassword()) {
            setError("La contraseña no cumple con todos los requisitos de seguridad.");
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
                 router.push(redirectPath);
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
    
    const SignInForm = (
        <motion.div key="signIn" variants={formVariants} initial="hidden" animate="visible" exit="exit">
            <form onSubmit={handleSignInSubmit} className="space-y-4">
                 <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} className="pl-10"/>
                </div>
                 <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type={showPassword ? "text" : "password"} 
                        placeholder="Contraseña" 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        disabled={isLoading}
                        className="pl-10"
                    />
                     <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                    </Button>
                 </div>
                <Button type="submit" className="w-full !mt-6 h-12 text-base btn-primary-gradient" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Ingresar'}
                </Button>
            </form>
        </motion.div>
    );

    const SignUpForm = (
         <motion.div key="signUp" variants={formVariants} initial="hidden" animate="visible" exit="exit">
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="text" placeholder="Nombre" required value={name} onChange={e => setName(e.target.value)} disabled={isLoading} className="pl-10" />
                </div>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} className="pl-10" />
                </div>
                 <div className="space-y-2">
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Contraseña" 
                            required 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            disabled={isLoading} 
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => !password && setIsPasswordFocused(false)}
                            className="pl-10"
                        />
                         <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                        </Button>
                    </div>
                     <AnimatePresence>
                         <PasswordStrengthIndicator password={password} isVisible={isPasswordFocused || password.length > 0} />
                    </AnimatePresence>
                 </div>
                <Button type="submit" className="w-full !mt-6 h-12 text-base btn-primary-gradient" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Crear Cuenta'}
                </Button>
            </form>
        </motion.div>
    );

    return (
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl mx-auto md:grid md:grid-cols-2">
            <div className="hidden md:flex p-8 lg:p-12 relative text-white btn-primary-gradient flex-col justify-between">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold font-headline">{settings?.platformName || 'NexusAlpri'}</h2>
                    <p className="mt-2 text-white/80 max-w-sm">Tu portal de conocimiento corporativo. Aprende, crece y avanza con nosotros.</p>
                </div>
                 {settings?.authImageUrl ? 
                    <Image src={settings.authImageUrl} alt="Decorative background" fill className="object-cover opacity-20" data-ai-hint="abstract background" quality={100} />
                    : <div className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 bg-white/10 rounded-full" />
                 }
            </div>

            <div className="w-full p-6 sm:p-10 flex flex-col justify-center">
                 <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold font-headline text-foreground">
                        {view === 'signIn' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </h1>
                    <p className="text-muted-foreground">
                        {view === 'signIn' ? 'Bienvenido de nuevo' : 'Comienza tu viaje de aprendizaje'}
                    </p>
                </div>

                 {error && (
                    <Alert variant="destructive" className="mb-4">
                         <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <AnimatePresence mode="wait">
                    {view === 'signIn' ? SignInForm : SignUpForm}
                </AnimatePresence>
                
                 <Separator className="my-6" />

                <div className="text-center text-sm">
                    {view === 'signIn' ? (
                        <>
                           ¿No tienes una cuenta?{' '}
                            <Button variant="link" className="p-0 h-auto" onClick={() => { setView('signUp'); resetFields(); }}>
                                Registrarse
                            </Button>
                        </>
                    ) : (
                         <>
                           ¿Ya tienes una cuenta?{' '}
                            <Button variant="link" className="p-0 h-auto" onClick={() => { setView('signIn'); resetFields(); }}>
                                Iniciar Sesión
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
