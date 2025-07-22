
'use client';

import { useState, type FormEvent, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import Image from 'next/image';

const PasswordToggle = memo(({ isVisible, onClick }: { isVisible: boolean, onClick: () => void }) => (
    <button type="button" className="password-toggle" onClick={onClick} aria-label={isVisible ? "Ocultar contraseña" : "Mostrar contraseña"}>
        {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
));
PasswordToggle.displayName = 'PasswordToggle';

export default function SignInPage() {
  const router = useRouter();
  const { user, login, settings } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [show2fa, setShow2fa] = useState(false);
  const [userIdFor2fa, setUserIdFor2fa] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      const params = new URLSearchParams(window.location.search);
      const redirectedFrom = params.get('redirectedFrom');
      router.replace(redirectedFrom || '/dashboard');
    }
  }, [user, router]);

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign in.');
      }
      
      if (data.twoFactorRequired) {
        setUserIdFor2fa(data.userId);
        setShow2fa(true);
      } else {
        toast({ title: 'Inicio de sesión exitoso', description: `Bienvenido de nuevo.` });
        login(data.user);
      }

    } catch (error) {
      toast({
        title: 'Error de inicio de sesión',
        description: (error as Error).message || 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handle2faSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (token.length < 6) return;
    setIsLoading(true);

    try {
        const response = await fetch('/api/auth/2fa?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userIdFor2fa, token }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al verificar el código 2FA.');
        }
        
        toast({ title: 'Inicio de sesión exitoso', description: `Bienvenido de nuevo.` });
        login(data.user);

    } catch (error) {
      toast({
        title: 'Error de Verificación',
        description: (error as Error).message || 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };


  const LoginForm = () => (
    <form onSubmit={handlePasswordSubmit}>
        <div className="auth-header">
            <h1 className="auth-title">Iniciar Sesión</h1>
            <p className="auth-subtitle">Ingresa a tu cuenta de NexusAlpri</p>
        </div>
        
        <div className="form-group">
    <label className="form-label" htmlFor="loginEmail">Correo Electrónico</label>
    <input type="email" id="loginEmail" className="form-input" placeholder="tu@email.com" required 
           value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
</div>

<div className="form-group">
    <label className="form-label" htmlFor="loginPassword">Contraseña</label>
    <div style={{position: 'relative'}}>
        <input type={showPassword ? 'text' : 'password'} id="loginPassword" className="form-input" placeholder="••••••••" required
               value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}/>
        <PasswordToggle isVisible={showPassword} onClick={() => setShowPassword(!showPassword)} />
    </div>
</div>
        
        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin" />}
          Ingresar
        </button>
        
        {settings?.allowPublicRegistration && (
          <div className="form-footer">
              ¿No tienes una cuenta? <Link href="/sign-up" className="form-link">Regístrate</Link>
          </div>
        )}
    </form>
  )
  
  const TwoFactorForm = () => (
     <form onSubmit={handle2faSubmit}>
        <div className="auth-header">
            <ShieldCheck className="mx-auto h-12 w-12 text-[var(--auth-gold)] mb-4" />
            <h1 className="auth-title">Verificación</h1>
            <p className="auth-subtitle">Ingresa el código de tu app de autenticación.</p>
        </div>
        <div className="form-group flex justify-center">
            <InputOTP maxLength={6} value={token} onChange={setToken} disabled={isLoading}>
                <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                </InputOTPGroup>
            </InputOTP>
        </div>
        <button type="submit" className="submit-btn" disabled={isLoading || token.length < 6}>
           {isLoading && <Loader2 className="animate-spin" />}
           Verificar
        </button>
        <div className="form-footer">
            <button type="button" className="form-link" onClick={() => setShow2fa(false)}>Volver a inicio de sesión</button>
        </div>
     </form>
  )

  return (
    <div className="auth-container">
        <div className="auth-logo">
             <Image
                src="/uploads/images/logo-nexusalpri.png"
                alt="NexusAlpri Logo"
                width={120}
                height={97.5}
                priority
                data-ai-hint="logo education"
              />
        </div>
        
        {show2fa ? <TwoFactorForm /> : <LoginForm />}
    </div>
  );
}
