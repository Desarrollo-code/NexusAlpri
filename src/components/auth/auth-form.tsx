// src/components/auth/auth-form.tsx
'use client';

import React from 'react';
import { useState, type FormEvent, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { PasswordStrengthIndicator } from '@/components/password-strength-indicator';
import AuthFormContainer from './auth-form-container';
import { Skeleton } from '../ui/skeleton';

const formVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.98 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: 20, scale: 0.98, transition: { duration: 0.3, ease: "easeIn" } }
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { 
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
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
        if (!settings) return true;

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
                const redirectedFrom = searchParams.get('redirectedFrom');
                const redirectPath = `/sign-in/2fa?userId=${data.userId}${redirectedFrom ? `&redirectedFrom=${encodeURIComponent(redirectedFrom)}` : ''}`;
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
        <motion.div 
            key="signIn" 
            variants={formVariants} 
            initial="hidden" 
            animate="visible" 
            exit="exit"
        >
            <form onSubmit={handleSignInSubmit} className="space-y-5">
                <motion.div variants={itemVariants} className="group relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <Mail className="h-5 w-5" />
                    </div>
                    <Input 
                        type="email" 
                        placeholder="tu@email.com" 
                        required 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        disabled={isLoading} 
                        className="pl-11 h-13 bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base rounded-xl" 
                        autoComplete="email"
                    />
                </motion.div>
                
                <motion.div variants={itemVariants} className="group relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <Lock className="h-5 w-5" />
                    </div>
                    <Input
                        type={showPassword ? "text" : "password"} 
                        placeholder="Contraseña" 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        disabled={isLoading}
                        className="pl-11 pr-11 h-13 bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base rounded-xl"
                        autoComplete="current-password"
                    />
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 text-slate-400 hover:text-slate-700 hover:bg-transparent transition-colors" 
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <Eye className="h-5 w-5"/> : <EyeOff className="h-5 w-5"/>}
                    </Button>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                    <Button 
                        type="submit" 
                        className="w-full !mt-7 h-13 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group" 
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                        ) : (
                            <>
                                <LogIn className="mr-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform"/>
                                Ingresar
                            </>
                        )}
                    </Button>
                </motion.div>
            </form>
        </motion.div>
    );

    const SignUpForm = (
        <motion.div 
            key="signUp" 
            variants={formVariants} 
            initial="hidden" 
            animate="visible" 
            exit="exit"
        >
            <form onSubmit={handleSignUpSubmit} className="space-y-5">
                <motion.div variants={itemVariants} className="group relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-purple-600 transition-colors">
                        <User className="h-5 w-5" />
                    </div>
                    <Input 
                        type="text" 
                        placeholder="Tu nombre completo" 
                        required 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        disabled={isLoading} 
                        className="pl-11 h-13 bg-slate-50/50 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-base rounded-xl" 
                        autoComplete="name" 
                    />
                </motion.div>
                
                <motion.div variants={itemVariants} className="group relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-purple-600 transition-colors">
                        <Mail className="h-5 w-5" />
                    </div>
                    <Input 
                        type="email" 
                        placeholder="tu@email.com" 
                        required 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        disabled={isLoading} 
                        className="pl-11 h-13 bg-slate-50/50 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-base rounded-xl" 
                        autoComplete="email"
                    />
                </motion.div>
                
                <motion.div variants={itemVariants} className="space-y-2">
                    <div className="group relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-purple-600 transition-colors">
                            <Lock className="h-5 w-5" />
                        </div>
                        <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Crea una contraseña segura" 
                            required 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            disabled={isLoading} 
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => !password && setIsPasswordFocused(false)}
                            className="pl-11 pr-11 h-13 bg-slate-50/50 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-base rounded-xl"
                            autoComplete="new-password"
                        />
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 text-slate-400 hover:text-slate-700 hover:bg-transparent transition-colors" 
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <Eye className="h-5 w-5"/> : <EyeOff className="h-5 w-5"/>}
                        </Button>
                    </div>
                    <AnimatePresence>
                        <PasswordStrengthIndicator password={password} isVisible={isPasswordFocused || password.length > 0} />
                    </AnimatePresence>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                    <Button 
                        type="submit" 
                        className="w-full !mt-7 h-13 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group" 
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                        ) : (
                            <>
                                <UserPlus className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform"/>
                                Crear Cuenta
                            </>
                        )}
                    </Button>
                </motion.div>
            </form>
        </motion.div>
    );

    return (
        <AuthFormContainer>
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
            >
                <motion.div variants={itemVariants} className="text-center">
                    {settings?.logoUrl ? (
                        <div className="relative mx-auto mb-5 w-20 h-20 group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                            <Image 
                                src={settings.logoUrl} 
                                alt="Logo" 
                                width={80} 
                                height={80} 
                                className="relative rounded-2xl shadow-lg" 
                                quality={100} 
                            />
                        </div>
                    ) : (
                        <Skeleton className="w-20 h-20 rounded-2xl mx-auto mb-5"/>
                    )}
                    
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold font-headline bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                            {view === 'signIn' ? 'Bienvenido de Nuevo' : 'Únete a la Plataforma'}
                        </h1>
                        <p className="text-slate-600 text-base">
                            {view === 'signIn' ? 'Ingresa tus credenciales para continuar.' : 'Completa tus datos para empezar a aprender.'}
                        </p>
                    </div>
                </motion.div>
                
                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <Alert variant="destructive" className="border-red-200 bg-red-50">
                                <AlertTitle className="text-red-900 font-semibold">Error de Autenticación</AlertTitle>
                                <AlertDescription className="text-red-700">{error}</AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {view === 'signIn' ? SignInForm : SignUpForm}
                </AnimatePresence>

                <motion.div variants={itemVariants}>
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-3 text-slate-500 font-medium">
                                {view === 'signIn' ? 'o regístrate' : 'o inicia sesión'}
                            </span>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="text-center">
                    {view === 'signIn' ? (
                        <>
                            {settings?.allowPublicRegistration && (
                                <div className="space-y-3">
                                    <p className="text-sm text-slate-600">
                                        ¿No tienes una cuenta?
                                    </p>
                                    <Button 
                                        variant="outline" 
                                        className="w-full h-12 border-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition-all rounded-xl font-semibold" 
                                        onClick={() => { setView('signUp'); resetFields(); }}
                                    >
                                        <UserPlus className="mr-2 h-5 w-5" />
                                        Crear Nueva Cuenta
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600">
                                ¿Ya tienes una cuenta?
                            </p>
                            <Button 
                                variant="outline" 
                                className="w-full h-12 border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-all rounded-xl font-semibold" 
                                onClick={() => { setView('signIn'); resetFields(); }}
                            >
                                <LogIn className="mr-2 h-5 w-5" />
                                Iniciar Sesión
                            </Button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AuthFormContainer>
    );
}