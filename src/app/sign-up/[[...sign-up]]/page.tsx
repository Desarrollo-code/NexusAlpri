'use client';

import { useState, type FormEvent, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Loader2, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

const PasswordToggle = memo(({ isVisible, onClick }: { isVisible: boolean, onClick: () => void }) => (
    <button type="button" className="password-toggle" onClick={onClick} aria-label={isVisible ? "Ocultar contraseña" : "Mostrar contraseña"}>
        {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
));
PasswordToggle.displayName = 'PasswordToggle';


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
          <div className="auth-header">
              <h1 className="auth-title">Registro Deshabilitado</h1>
          </div>
           <div className="auth-alert">
              <ShieldAlert />
              El registro de nuevas cuentas está deshabilitado. Contacta a un administrador para que cree una cuenta para ti.
            </div>
          <div className="form-footer">
            <Link href="/sign-in" className="form-link">Volver a Inicio de Sesión</Link>
          </div>
        </div>
      );
  }

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
        
        <form onSubmit={handleSubmit}>
            <div className="auth-header">
                <h1 className="auth-title">Crear una Cuenta</h1>
                <p className="auth-subtitle">Regístrate para empezar a aprender</p>
            </div>

            {error && (
              <div className="auth-alert">
                  <ShieldAlert />
                  <span>{error}</span>
              </div>
            )}
            
            <div className="form-group">
                <label className="form-label" htmlFor="registerName">Nombre Completo</label>
                <input type="text" id="registerName" className="form-input" placeholder="Tu nombre completo" required 
                       value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
            </div>
            
            <div className="form-group">
                <label className="form-label" htmlFor="registerEmail">Correo Electrónico</label>
                <input type="email" id="registerEmail" className="form-input" placeholder="tu@email.com" required 
                       value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
            </div>
            
            <div className="form-group">
                <label className="form-label" htmlFor="registerPassword">Contraseña</label>
                <div style={{position: 'relative'}}>
                    <input type={showPassword ? "text" : "password"} id="registerPassword" className="form-input" placeholder="••••••••" required
                           value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
                    <PasswordToggle isVisible={showPassword} onClick={() => setShowPassword(!showPassword)} />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirmar Contraseña</label>
                <div style={{position: 'relative'}}>
                    <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" className="form-input" placeholder="••••••••" required
                           value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} />
                    <PasswordToggle isVisible={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
                </div>
            </div>
            
            <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading && <Loader2 className="animate-spin" />}
                Registrarse
            </button>
            
            <div className="form-footer">
                ¿Ya tienes una cuenta? <Link href="/sign-in" className="form-link">Inicia sesión</Link>
            </div>
        </form>
    </div>
  );
}
