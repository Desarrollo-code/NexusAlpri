
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function SignInPage() {
  const router = useRouter();
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
        const response = await fetch('/api/auth/2fa-login', {
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
          <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline">Iniciar Sesión</CardTitle>
                <CardDescription>Ingresa a tu cuenta de NexusAlpri</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? 'Ingresando...' : 'Ingresar'}
                  </Button>
                   {settings?.allowPublicRegistration && (
                     <div className="mt-4 text-center text-sm">
                        <span className="text-muted-foreground">¿No tienes una cuenta?</span>{" "}
                        <Link href="/sign-up" className="font-semibold text-primary hover:underline">
                            Regístrate
                        </Link>
                     </div>
                   )}
                </form>
              </CardContent>
          </Card>
        ) : (
          <Card>
              <CardHeader className="text-center space-y-4">
                <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-headline">Verificación de Dos Factores</CardTitle>
                  <CardDescription>Ingresa el código de 6 dígitos de tu aplicación de autenticación.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handle2faSubmit} className="grid gap-4">
                  <div className="grid gap-2">
                    <InputOTP
                      maxLength={6}
                      value={token}
                      onChange={(value) => setToken(value)}
                      disabled={isLoading}
                    >
                      <InputOTPGroup className="mx-auto">
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    <Label htmlFor="token" className="sr-only">Código de 6 dígitos</Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading || token.length < 6}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? 'Verificando...' : 'Verificar y Entrar'}
                  </Button>
                </form>
                 <div className="mt-4 text-center text-sm">
                  <Button variant="link" onClick={() => { setShow2fa(false); setUserIdFor2fa(null); setPassword(''); }} className="text-muted-foreground">
                    Volver al inicio de sesión
                  </Button>
                </div>
              </CardContent>
          </Card>
        )}
      </div>
  );
}
