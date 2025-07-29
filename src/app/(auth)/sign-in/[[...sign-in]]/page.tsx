'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Loader2, ShieldCheck, Eye, EyeOff, UserCircle, LockKeyhole, Languages } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, login, settings } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [show2fa, setShow2fa] = useState(false);
  const [userIdFor2fa, setUserIdFor2fa] = useState<string | null>(null);

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


  return (
      <div className="w-full">
        {!show2fa ? (
          <>
              <div className="text-left mb-8">
                <h1 className="text-2xl font-bold">Iniciar Sesión</h1>
              </div>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="auth-label">Correo Electrónico</label>
                   <div className="auth-input-container">
                      <UserCircle className="auth-input-icon" />
                      <input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="auth-input auth-input-with-icon"
                      />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="auth-label">Contraseña</label>
                  <div className="auth-input-container">
                    <LockKeyhole className="auth-input-icon" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="auth-input auth-input-with-icon auth-input-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="auth-button" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isLoading ? 'Ingresando...' : 'Ingresar'}
                </button>
              </form>
              <div className="auth-form-switch-link">
                {settings?.allowPublicRegistration && (
                    <span className="auth-text-secondary">
                        ¿No tienes una cuenta?{' '}
                        <Link href="/sign-up" className="auth-link">
                            Regístrate ahora
                        </Link>
                    </span>
                )}
              </div>
          </>
        ) : (
          <>
              <div className="text-center mb-6 space-y-4">
                <ShieldCheck className="mx-auto h-12 w-12 text-teal-500" />
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold">Verificación de Dos Factores</h1>
                  <p className="auth-text-secondary">Ingresa el código de 6 dígitos de tu aplicación de autenticación.</p>
                </div>
              </div>
              <form onSubmit={handle2faSubmit} className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={token}
                    onChange={(value) => setToken(value)}
                    disabled={isLoading}
                    containerClassName="otp-group"
                  >
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
                <button type="submit" className="auth-button" disabled={isLoading || token.length < 6}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isLoading ? 'Verificando...' : 'Verificar y Entrar'}
                </button>
              </form>
               <div className="mt-4 text-center text-sm">
                <button onClick={() => { setShow2fa(false); setUserIdFor2fa(null); setPassword(''); }} className="auth-link">
                  Volver al inicio de sesión
                </button>
              </div>
          </>
        )}
      </div>
  );
}
