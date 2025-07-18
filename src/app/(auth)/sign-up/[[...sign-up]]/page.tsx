
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Loader2, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export default function SignUpPage() {
  const router = useRouter();
  const { user, login, settings, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);
  
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
    }

    if (settings) {
        if (password.length < settings.passwordMinLength) {
            setError(`La contraseña debe tener al menos ${settings.passwordMinLength} caracteres.`);
            return;
        }
        if (settings.passwordRequireUppercase && !/[A-Z]/.test(password)) {
            setError("La contraseña debe contener al menos una letra mayúscula.");
            return;
        }
        if (settings.passwordRequireLowercase && !/[a-z]/.test(password)) {
            setError("La contraseña debe contener al menos una letra minúscula.");
            return;
        }
        if (settings.passwordRequireNumber && !/\d/.test(password)) {
            setError("La contraseña debe contener al menos un número.");
            return;
        }
        if (settings.passwordRequireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            setError("La contraseña debe contener al menos un carácter especial.");
            return;
        }
    }


    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar la cuenta.');
      }
      
      toast({ title: 'Registro exitoso', description: '¡Bienvenido! Tu cuenta ha sido creada.' });
      login(data.user);

    } catch (error) {
       const errorMessage = (error as Error).message;
       setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading || !settings) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!settings.allowPublicRegistration) {
      return (
        <div className="auth-bg flex min-h-screen flex-col items-center justify-center p-4">
              <div className="mb-4 drop-shadow-[0_2px_4px_hsl(var(--primary)/0.4)]">
              <Image
                src="/uploads/images/logo-nexusalpri.png"
                alt="NexusAlpri Logo"
                width={120}
                height={97.5}
                priority
                data-ai-hint="logo education"
              />
            </div>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-center text-xl font-headline">Registro Deshabilitado</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-4" />
                    <p className="text-sm text-muted-foreground">
                        El registro de nuevas cuentas está deshabilitado. Solo un administrador puede crear una cuenta para ti.
                    </p>
                    <Button asChild variant="link" className="mt-4 text-primary">
                        <Link href="/sign-in">Volver a Inicio de Sesión</Link>
                    </Button>
                </CardContent>
            </Card>
             <div className="fixed bottom-4 right-4 z-0 pointer-events-none">
              <Image
                src="/uploads/images/watermark-alprigrama.png" 
                alt="Alprigrama S.A.S. Watermark"
                width={70} 
                height={70} 
                className="opacity-40" 
                data-ai-hint="company logo"
              />
            </div>
        </div>
      );
  }

  return (
    <div className="auth-bg flex min-h-screen flex-col items-center justify-center p-4">
      <div className="relative flex w-full max-w-sm flex-col items-center justify-center p-4">
        <div className="mb-4 drop-shadow-[0_2px_4px_hsl(var(--primary)/0.4)]">
          <Image
            src="/uploads/images/logo-nexusalpri.png"
            alt="NexusAlpri Logo"
            width={120}
            height={97.5}
            priority
            data-ai-hint="logo education"
          />
        </div>

        <Card className="w-full">
            <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Crear una Cuenta</CardTitle>
            <CardDescription>Regístrate para empezar a aprender</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="grid gap-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="Tu nombre completo"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
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
                <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isLoading}
                          className="pr-10"
                      />
                       <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? 'Registrando...' : 'Registrarse'}
                </Button>
                <div className="mt-4 text-center text-sm">
                    ¿Ya tienes una cuenta?{" "}
                    <Link href="/sign-in" className="underline">
                        Inicia sesión
                    </Link>
                </div>
            </form>
            </CardContent>
          </Card>
      </div>
       <div className="fixed bottom-4 right-4 z-0 pointer-events-none">
        <Image
          src="/uploads/images/watermark-alprigrama.png"
          alt="Alprigrama S.A.S. Watermark"
          width={70}
          height={70}
          className="opacity-40"
          data-ai-hint="company logo"
        />
      </div>
    </div>
  );
}
