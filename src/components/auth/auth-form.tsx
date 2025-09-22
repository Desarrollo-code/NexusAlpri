// src/components/auth/auth-form.tsx
'use client';

import React from 'react';
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
import AuthFormContainer from './auth-form-container';

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
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} className="pl-10 h-12 bg-slate-900/50 border-slate-700 text-white"/>
                </div>
                 <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        type={showPassword ? "text" : "password"} 
                        placeholder="Contraseña" 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        disabled={isLoading}
                        className="pl-10 h-12 bg-slate-900/50 border-slate-700 text-white"
                    />
                     <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                    </Button>
                 </div>
                <Button type="submit" className="w-full !mt-6 h-12 text-base" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Ingresar'}
                </Button>
            </form>
        </motion.div>
    );

    const SignUpForm = (
         <motion.div key="signUp" variants={formVariants} initial="hidden" animate="visible" exit="exit">
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input type="text" placeholder="Nombre" required value={name} onChange={e => setName(e.target.value)} disabled={isLoading} className="pl-10 h-12 bg-slate-900/50 border-slate-700 text-white" />
                </div>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} className="pl-10 h-12 bg-slate-900/50 border-slate-700 text-white" />
                </div>
                 <div className="space-y-2">
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Contraseña" 
                            required 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            disabled={isLoading} 
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => !password && setIsPasswordFocused(false)}
                            className="pl-10 h-12 bg-slate-900/50 border-slate-700 text-white"
                        />
                         <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                        </Button>
                    </div>
                     <AnimatePresence>
                         <PasswordStrengthIndicator password={password} isVisible={isPasswordFocused || password.length > 0} />
                    </AnimatePresence>
                 </div>
                <Button type="submit" className="w-full !mt-6 h-12 text-base" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Crear Cuenta'}
                </Button>
            </form>
        </motion.div>
    );

    return (
        <AuthFormContainer>
            <div className="text-center mb-6">
                 {settings?.logoUrl && (
                    <Image src={settings.logoUrl} alt="Logo" width={64} height={64} className="mx-auto mb-4" quality={100} />
                 )}
                <h1 className="text-3xl font-bold font-headline text-white">
                    {view === 'signIn' ? 'Bienvenido de Nuevo' : 'Únete a la Plataforma'}
                </h1>
                <p className="text-slate-400">
                    {view === 'signIn' ? 'Ingresa tus credenciales para continuar.' : 'Completa tus datos para empezar a aprender.'}
                </p>
            </div>
            
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Error de Autenticación</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <AnimatePresence mode="wait">
                {view === 'signIn' ? SignInForm : SignUpForm}
            </AnimatePresence>

            <div className="text-center text-sm mt-6">
                {view === 'signIn' ? (
                    <>
                       <span className="text-slate-400">¿No tienes una cuenta?</span>{' '}
                        <Button variant="link" className="p-0 h-auto !text-blue-400" onClick={() => { setView('signUp'); resetFields(); }}>
                            Regístrate
                        </Button>
                    </>
                ) : (
                     <>
                       <span className="text-slate-400">¿Ya tienes una cuenta?</span>{' '}
                        <Button variant="link" className="p-0 h-auto !text-blue-400" onClick={() => { setView('signIn'); resetFields(); }}>
                            Inicia Sesión
                        </Button>
                    </>
                )}
            </div>
        </AuthFormContainer>
    );
}
