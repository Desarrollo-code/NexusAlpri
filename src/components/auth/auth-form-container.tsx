// src/components/auth/auth-form-container.tsx
'use client';

import { useState, type FormEvent, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

const FormInput = ({ icon: Icon, ...props }: { icon: React.ElementType } & React.ComponentProps<typeof Input>) => (
    <div className="relative flex items-center">
        <Icon className="absolute left-3 h-5 w-5 text-muted-foreground" />
        <Input className="pl-10 h-11 bg-muted/30 border-muted-foreground/50 focus:bg-muted/50" {...props} />
         {props.type === 'password' && (
            <button
                type="button"
                className="absolute right-3 text-muted-foreground hover:text-foreground"
            >
            </button>
        )}
    </div>
);

const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeInOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeInOut" } }
};

interface PasswordChecklist {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    specialChar: boolean;
}

const PasswordStrengthIndicator = ({ password, isVisible }: { password?: string; isVisible: boolean }) => {
    const { settings } = useAuth();

    const checklist: PasswordChecklist = useMemo(() => {
        const pass = password || '';
        return {
            minLength: pass.length >= (settings?.passwordMinLength || 8),
            uppercase: settings?.passwordRequireUppercase ? /[A-Z]/.test(pass) : true,
            lowercase: settings?.passwordRequireLowercase ? /[a-z]/.test(pass) : true,
            number: settings?.passwordRequireNumber ? /\d/.test(pass) : true,
            specialChar: settings?.passwordRequireSpecialChar ? /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass) : true,
        };
    }, [password, settings]);

    const strength = useMemo(() => {
        return Object.values(checklist).filter(Boolean).length;
    }, [checklist]);
    
    const totalChecks = useMemo(() => {
        let count = 1; // minLength is always checked
        if (settings?.passwordRequireUppercase) count++;
        if (settings?.passwordRequireLowercase) count++;
        if (settings?.passwordRequireNumber) count++;
        if (settings?.passwordRequireSpecialChar) count++;
        return count;
    }, [settings]);

    const strengthPercentage = (strength / totalChecks) * 100;
    
    const getStrengthColor = () => {
        if (strengthPercentage < 50) return 'bg-destructive';
        if (strengthPercentage < 80) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStrengthText = () => {
        if (strengthPercentage < 50) return 'Débil';
        if (strengthPercentage < 100) return 'Buena';
        return 'Fuerte';
    };
    
    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
        >
            <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all duration-300", getStrengthColor())}
                        style={{ width: `${strengthPercentage}%` }}
                    />
                </div>
                <span className="text-xs font-semibold">{getStrengthText()}</span>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <p className={cn("flex items-center", checklist.minLength && "text-green-500")}>
                    {checklist.minLength ? <Check size={14} className="mr-1" /> : <AlertCircle size={14} className="mr-1" />}
                    Mínimo {settings?.passwordMinLength || 8} caracteres
                </p>
                {settings?.passwordRequireUppercase && (
                     <p className={cn("flex items-center", checklist.uppercase && "text-green-500")}>
                        {checklist.uppercase ? <Check size={14} className="mr-1" /> : <AlertCircle size={14} className="mr-1" />}
                        Una mayúscula
                    </p>
                )}
                {settings?.passwordRequireLowercase && (
                    <p className={cn("flex items-center", checklist.lowercase && "text-green-500")}>
                         {checklist.lowercase ? <Check size={14} className="mr-1" /> : <AlertCircle size={14} className="mr-1" />}
                        Una minúscula
                    </p>
                )}
                {settings?.passwordRequireNumber && (
                    <p className={cn("flex items-center", checklist.number && "text-green-500")}>
                        {checklist.number ? <Check size={14} className="mr-1" /> : <AlertCircle size={14} className="mr-1" />}
                        Un número
                    </p>
                )}
                 {settings?.passwordRequireSpecialChar && (
                    <p className={cn("flex items-center", checklist.specialChar && "text-green-500")}>
                         {checklist.specialChar ? <Check size={14} className="mr-1" /> : <AlertCircle size={14} className="mr-1" />}
                        Un caracter especial
                    </p>
                )}
            </div>
        </motion.div>
    );
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
                 <FormInput icon={Mail} type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
                 <div className="relative">
                    <FormInput icon={Lock} type={showPassword ? "text" : "password"} placeholder="Contraseña" required value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                    </button>
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
                 <FormInput icon={User} type="text" placeholder="Nombre" required value={name} onChange={e => setName(e.target.value)} disabled={isLoading} />
                 <FormInput icon={Mail} type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
                 <div className="space-y-2">
                    <div className="relative">
                        <FormInput 
                            icon={Lock} 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Contraseña" 
                            required 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            disabled={isLoading} 
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => !password && setIsPasswordFocused(false)}
                        />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                            {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                        </button>
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
        <Card className="w-full max-w-md shadow-2xl card-border-animated my-auto">
            <CardHeader className="text-center">
                 <CardTitle className="text-3xl font-bold font-headline text-foreground">
                    {view === 'signIn' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </CardTitle>
                <CardDescription>
                    {view === 'signIn' ? 'Bienvenido de nuevo a NexusAlpri' : 'Comienza tu viaje de aprendizaje con nosotros'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                 {error && (
                    <Alert variant="destructive" className="mb-4">
                         <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <AnimatePresence mode="wait">
                    {view === 'signIn' ? SignInForm : SignUpForm}
                </AnimatePresence>
            </CardContent>
            <CardFooter className="flex-col gap-4">
                <Separator />
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
            </CardFooter>
        </Card>
    );
}
