'use client';

import { useState, type FormEvent, useEffect } from 'react';
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
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

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


  const PasswordToggle = ({ onClick }: { onClick: () => void}) => {
    return (
      <button type="button" className="password-toggle" onClick={onClick}>
        {showPassword ? '🙈' : '👁️'}
      </button>
    )
  }

  const LoginForm = () => (
    <form onSubmit={handlePasswordSubmit}>
        <div className="form-header">
            <h1 className="form-title">Iniciar Sesión</h1>
            <p className="form-subtitle">Ingresa a tu cuenta de NexusAlpri</p>
        </div>
        
        <div className="form-group" style={{animationDelay: '0.1s'}}>
            <label className="form-label" htmlFor="loginEmail">Correo Electrónico</label>
            <input type="email" id="loginEmail" className="form-input" placeholder="tu@email.com" required 
                   value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
        </div>
        
        <div className="form-group" style={{animationDelay: '0.2s'}}>
            <label className="form-label" htmlFor="loginPassword">Contraseña</label>
            <div style={{position: 'relative'}}>
                <input type={showPassword ? 'text' : 'password'} id="loginPassword" className="form-input" placeholder="••••••••" required
                       value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}/>
                <PasswordToggle onClick={() => setShowPassword(!showPassword)} />
            </div>
        </div>
        
        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? <Loader2 className="inline mr-2 h-4 w-4 animate-spin" /> : null}
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
        <div className="form-header">
            <h1 className="form-title">Verificación</h1>
            <p className="form-subtitle">Ingresa el código de tu app de autenticación.</p>
        </div>
        <div className="form-group flex justify-center">
            <InputOTP maxLength={6} value={token} onChange={setToken}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
               <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
        </div>
        <button type="submit" className="submit-btn" disabled={isLoading || token.length < 6}>
           {isLoading ? <Loader2 className="inline mr-2 h-4 w-4 animate-spin" /> : null}
           Verificar
        </button>
        <div className="form-footer">
            <button type="button" className="form-link" onClick={() => setShow2fa(false)}>Volver a inicio de sesión</button>
        </div>
     </form>
  )

  return (
    <div className="auth-container">
        <div className="logo">
            <div className="logo-icon"></div>
        </div>
        
        {show2fa ? <TwoFactorForm /> : <LoginForm />}
    </div>
  );
}
