'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Loader2, ShieldAlert, Eye, EyeOff, LockKeyhole, UserCircle, Mail } from 'lucide-react';

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
      if (policy.passwordRequireNumber && !/\d/.test(pass)) return "La contraseña debe contener al menos un número.";
      if (policy.passwordRequireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) return "La contraseña debe contener al menos un carácter especial.";
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
        <div className="auth-card text-center">
            <h1 className="text-2xl font-bold">Registro Deshabilitado</h1>
            <div className="mt-4 p-4 border border-yellow-400/30 bg-yellow-500/10 rounded-md">
              <ShieldAlert className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
              <p className="text-sm text-yellow-800">El registro de nuevas cuentas está deshabilitado. Contacta a un administrador.</p>
            </div>
            <div className="mt-4 text-center text-sm">
                <Link href="/sign-in" className="auth-link">Volver a Inicio de Sesión</Link>
            </div>
        </div>
      );
  }

  return (
    <div className="w-full h-full flex flex-col">
       <div className="text-left mb-8">
        <h1 className="text-2xl font-bold">Crear una Cuenta</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 border border-red-500/30 bg-red-500/10 rounded-md text-xs text-red-700 text-center">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="registerName" className="auth-label">Nombre Completo</label>
           <div className="auth-input-container">
              <UserCircle className="auth-input-icon" />
              <input type="text" id="registerName" placeholder="Tu nombre completo" required 
                     value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} className="auth-input auth-input-with-icon"/>
           </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="registerEmail" className="auth-label">Correo Electrónico</label>
           <div className="auth-input-container">
              <Mail className="auth-input-icon" />
              <input type="email" id="registerEmail" placeholder="tu@email.com" required 
                     value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="auth-input auth-input-with-icon"/>
           </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="registerPassword" className="auth-label">Contraseña</label>
          <div className="auth-input-container">
            <LockKeyhole className="auth-input-icon" />
            <input type={showPassword ? "text" : "password"} id="registerPassword" placeholder="••••••••" required
                   value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="auth-input auth-input-with-icon auth-input-password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="auth-label">Confirmar Contraseña</label>
          <div className="auth-input-container">
             <LockKeyhole className="auth-input-icon" />
            <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" placeholder="••••••••" required
                   value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} className="auth-input auth-input-with-icon auth-input-password" />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700">
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <button type="submit" className="auth-button" disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin mr-2" />}
          Registrarse
        </button>
      </form>
        <div className="auth-page-footer">
            <div className="auth-form-switch-link">
             <span className="auth-text-secondary">¿Ya tienes una cuenta?</span>{' '}
             <Link href="/sign-in" className="auth-link">Inicia sesión</Link>
          </div>
        </div>
    </div>
  );
}
