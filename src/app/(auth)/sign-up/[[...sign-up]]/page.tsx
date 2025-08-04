'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Loader2, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


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
        toast({ title: 'Error', description: 'Las contraseñas no coinciden.', variant: 'destructive'});
        return;
    }

    if (settings) {
        const passwordPolicyError = getPasswordPolicyError(password, settings);
        if (passwordPolicyError) {
          setError(passwordPolicyError);
          toast({ title: 'Contraseña Inválida', description: passwordPolicyError, variant: 'destructive'});
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
       toast({ title: 'Error de Registro', description: errorMessage, variant: 'destructive'});
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordPolicyError = (pass: string, policy: typeof settings) => {
      if (!policy) return null;
      if (pass.length < policy.passwordMinLength) return `La contraseña debe tener al menos ${policy.passwordMinLength} caracteres.`;
      if (policy.passwordRequireUppercase && !/[A-Z]/.test(pass)) return "La contraseña debe contener al menos una letra mayúscula.";
      if (policy.passwordRequireLowercase && !/[a-z]/.test(pass)) return "La contraseña debe contener al menos una letra minúscula.";
      if (policy.passwordRequireNumber && !/\\d/.test(pass)) return "La contraseña debe contener al menos un número.";
      if (policy.passwordRequireSpecialChar && !/[!@#$%^&*()_+\-=\\[\\]{};':"\\\\|,.<>\\/?]/.test(pass)) return "La contraseña debe contener al menos un carácter especial.";
      return null;
  }

  if (isAuthLoading || !settings) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!settings.allowPublicRegistration) {
      return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline">Registro Deshabilitado</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Acción no permitida</AlertTitle>
                  <AlertDescription>
                    El registro de nuevas cuentas está deshabilitado. Contacta a un administrador para que cree una cuenta para ti.
                  </AlertDescription>
                </Alert>
                <div className="mt-4 text-center text-sm">
                    <Link href="/sign-in" className="underline text-accent-foreground hover:text-primary">Volver a Inicio de Sesión</Link>
                </div>
            </CardContent>
        </Card>
      );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline">Crear una Cuenta</CardTitle>
        <CardDescription>Regístrate para empezar a aprender</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && (
            <Alert variant="destructive" className="text-xs">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Error de Registro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="registerName">Nombre Completo</Label>
            <Input type="text" id="registerName" placeholder="Tu nombre completo" required 
                   value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="registerEmail">Correo Electrónico</Label>
            <Input type="email" id="registerEmail" placeholder="tu@email.com" required 
                   value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="registerPassword">Contraseña</Label>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} id="registerPassword" placeholder="••••••••" required
                     value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative">
              <Input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" placeholder="••••••••" required
                     value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} className="pr-10" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin mr-2" />}
            Registrarse
          </Button>
          <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta? <Link href="/sign-in" className="underline text-accent-foreground hover:text-primary">Inicia sesión</Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
