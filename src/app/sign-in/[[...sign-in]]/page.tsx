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
    <button type="button" className="password-toggle" onClick={onClick} aria-label={isVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
        style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#A0A0A0' // Color para el icono del ojo, contrasta bien
        }}>
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
        <form onSubmit={handlePasswordSubmit} style={{
            backgroundColor: '#1A1A1A', // Fondo del formulario más oscuro que el fondo general
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0, 255, 0, 0.2)', // Sombra verde para destacar
            width: '100%',
            maxWidth: '400px',
            margin: 'auto'
        }}>
            <div className="auth-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 className="auth-title" style={{ color: '#E0E0E0', fontSize: '2em', marginBottom: '8px' }}>Iniciar Sesión</h1>
                <p className="auth-subtitle" style={{ color: '#A0A0A0', fontSize: '0.9em' }}>Ingresa a tu cuenta de NexusAlpri</p>
            </div>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" htmlFor="loginEmail" style={{ color: '#ADD8E6', marginBottom: '8px', display: 'block' }}>Correo Electrónico</label>
                <input type="email" id="loginEmail" className="form-input" placeholder="tu@email.com" required 
                        value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} 
                        style={{
                            width: 'calc(100% - 24px)', // Ajuste para padding
                            padding: '12px',
                            backgroundColor: '#2C2C2C', // Fondo del input
                            border: '1px solid #4CAF50', // Borde verde para resaltar
                            borderRadius: '4px',
                            color: '#E0E0E0', // Texto del input
                            fontSize: '1em'
                        }}
                    />
            </div>
            
            <div className="form-group" style={{ marginBottom: '30px' }}>
                <label className="form-label" htmlFor="loginPassword" style={{ color: '#ADD8E6', marginBottom: '8px', display: 'block' }}>Contraseña</label>
                <div style={{position: 'relative'}}>
                    <input type={showPassword ? 'text' : 'password'} id="loginPassword" className="form-input" placeholder="••••••••" required
                            value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                            style={{
                                width: 'calc(100% - 24px)',
                                padding: '12px',
                                backgroundColor: '#2C2C2C',
                                border: '1px solid #4CAF50',
                                borderRadius: '4px',
                                color: '#E0E0E0',
                                fontSize: '1em'
                            }}
                        />
                    <PasswordToggle isVisible={showPassword} onClick={() => setShowPassword(!showPassword)} />
                </div>
            </div>
            
            <button type="submit" className="submit-btn" disabled={isLoading}
                style={{
                    width: '100%',
                    padding: '12px 20px',
                    backgroundColor: '#4CAF50', // Botón verde vibrante
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '1.1em',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}>
                {isLoading && <Loader2 className="animate-spin" style={{ color: '#FFF' }} />}
                Ingresar
            </button>
            
            {settings?.allowPublicRegistration && (
                <div className="form-footer" style={{ textAlign: 'center', marginTop: '20px', color: '#A0A0A0' }}>
                    ¿No tienes una cuenta? <Link href="/sign-up" className="form-link" style={{ color: '#00BFFF', textDecoration: 'none' }}>Regístrate</Link>
                </div>
            )}
        </form>
    )
    
    const TwoFactorForm = () => (
        <form onSubmit={handle2faSubmit} style={{
            backgroundColor: '#1A1A1A', // Fondo del formulario más oscuro que el fondo general
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0, 255, 0, 0.2)', // Sombra verde para destacar
            width: '100%',
            maxWidth: '400px',
            margin: 'auto'
        }}>
            <div className="auth-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
                <ShieldCheck className="mx-auto h-12 w-12 text-[var(--auth-gold)] mb-4" style={{ color: '#FFD700' }} /> {/* Icono dorado */}
                <h1 className="auth-title" style={{ color: '#E0E0E0', fontSize: '2em', marginBottom: '8px' }}>Verificación</h1>
                <p className="auth-subtitle" style={{ color: '#A0A0A0', fontSize: '0.9em' }}>Ingresa el código de tu app de autenticación.</p>
            </div>
            <div className="form-group flex justify-center" style={{ marginBottom: '30px' }}>
                {/* Asegúrate de que tu componente InputOTP y InputOTPSlot permitan personalizar estilos */}
                <InputOTP maxLength={6} value={token} onChange={setToken} disabled={isLoading}
                    // Estos estilos son generales para InputOTP. Necesitarías modificarlos en tu componente InputOTP y InputOTPSlot si no están expuestos.
                    // Para este ejemplo, asumo que InputOTPSlot debería heredar o tener sus propios estilos.
                    style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'center',
                        // Los estilos individuales de los slots se definirían dentro de InputOTPSlot
                    }}>
                    <InputOTPGroup>
                        <InputOTPSlot index={0} style={{ backgroundColor: '#2C2C2C', border: '1px solid #4CAF50', color: '#E0E0E0', borderRadius: '4px', width: '40px', height: '40px', fontSize: '1.2em', textAlign: 'center' }} />
                        <InputOTPSlot index={1} style={{ backgroundColor: '#2C2C2C', border: '1px solid #4CAF50', color: '#E0E0E0', borderRadius: '4px', width: '40px', height: '40px', fontSize: '1.2em', textAlign: 'center' }} />
                        <InputOTPSlot index={2} style={{ backgroundColor: '#2C2C2C', border: '1px solid #4CAF50', color: '#E0E0E0', borderRadius: '4px', width: '40px', height: '40px', fontSize: '1.2em', textAlign: 'center' }} />
                        <InputOTPSlot index={3} style={{ backgroundColor: '#2C2C2C', border: '1px solid #4CAF50', color: '#E0E0E0', borderRadius: '4px', width: '40px', height: '40px', fontSize: '1.2em', textAlign: 'center' }} />
                        <InputOTPSlot index={4} style={{ backgroundColor: '#2C2C2C', border: '1px solid #4CAF50', color: '#E0E0E0', borderRadius: '4px', width: '40px', height: '40px', fontSize: '1.2em', textAlign: 'center' }} />
                        <InputOTPSlot index={5} style={{ backgroundColor: '#2C2C2C', border: '1px solid #4CAF50', color: '#E0E0E0', borderRadius: '4px', width: '40px', height: '40px', fontSize: '1.2em', textAlign: 'center' }} />
                    </InputOTPGroup>
                </InputOTP>
            </div>
            <button type="submit" className="submit-btn" disabled={isLoading || token.length < 6}
                style={{
                    width: '100%',
                    padding: '12px 20px',
                    backgroundColor: '#4CAF50', // Botón verde vibrante
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '1.1em',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}>
                {isLoading && <Loader2 className="animate-spin" style={{ color: '#FFF' }} />}
                Verificar
            </button>
            <div className="form-footer" style={{ textAlign: 'center', marginTop: '20px', color: '#A0A0A0' }}>
                <button type="button" className="form-link" onClick={() => setShow2fa(false)} style={{ color: '#00BFFF', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'none' }}>Volver a inicio de sesión</button>
            </div>
        </form>
    )

    return (
        <div className="auth-container" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#0A0A0A', // Fondo general negro
            padding: '20px'
        }}>
            <div className="auth-logo" style={{ marginBottom: '40px' }}>
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