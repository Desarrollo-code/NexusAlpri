// src/app/(app)/profile/page.tsx
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Camera, User, KeyRound, Shield, Eye, EyeOff, Save, CheckCircle, Award, Star, HelpCircle, Trophy, Palette } from 'lucide-react';
import React, { useState, ChangeEvent, FormEvent, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PasswordStrengthIndicator } from '@/components/password-strength-indicator';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useTitle } from '@/contexts/title-context';
import { Identicon } from '@/components/ui/identicon';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress as UploadProgress } from '@/components/ui/progress';
import { useTour } from '@/contexts/tour-context';
import { profileTour } from '@/lib/tour-steps';
import type { UserAchievement } from '@/types';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AchievementsView } from '@/components/gamification/achievements-view';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { AVAILABLE_THEMES } from '@/components/theme-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


// Gamification Level Calculation
const calculateLevel = (xp: number) => {
    const baseXP = 250;
    const exponent = 1.5;
    let level = 1;
    let requiredXP = baseXP;
    while (xp >= requiredXP) {
        level++;
        xp -= requiredXP;
        requiredXP = Math.floor(baseXP * Math.pow(level, exponent));
    }
    const xpForNextLevel = Math.floor(baseXP * Math.pow(level, exponent));
    const progressPercentage = Math.max(0, Math.min(100, (xp / xpForNextLevel) * 100));

    return { level, currentXPInLevel: xp, xpForNextLevel, progressPercentage };
};


// --- Components defined outside of the main component to prevent re-creation on render ---
const InfoCard = ({ user, updateUser }: { user: any, updateUser: (data: any) => void }) => {
    const [name, setName] = useState(user?.name || '');
    const [isSavingInfo, setIsSavingInfo] = useState(false);
    const { toast } = useToast();

    const handleInfoSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) return;
        setIsSavingInfo(true);
        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (!response.ok) throw new Error((await response.json()).message);
            const updatedUser = await response.json();
            updateUser(updatedUser);
            toast({ title: 'Éxito', description: 'Tu información ha sido actualizada.' });
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
        } finally {
            setIsSavingInfo(false);
        }
    };

    return (
        <Card id="info-card-desktop">
            <CardHeader>
                <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <form onSubmit={handleInfoSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} disabled={isSavingInfo} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user.email} disabled />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSavingInfo || name === user.name}>
                        {isSavingInfo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Información
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};

const SecurityCard = ({ user, newPassword, setNewPassword, confirmPassword, setConfirmPassword, currentPassword, setCurrentPassword }: 
{ user: any, newPassword: any, setNewPassword: any, confirmPassword: any, setConfirmPassword: any, currentPassword: any, setCurrentPassword: any }) => {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const { toast } = useToast();

    const handlePasswordSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast({ title: 'Error', description: 'Las nuevas contraseñas no coinciden.', variant: 'destructive' });
            return;
        }
        if (!user) return;
        setIsSavingPassword(true);
        try {
            const response = await fetch(`/api/users/${user.id}/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
            });
            if (!response.ok) throw new Error((await response.json()).message);
            toast({ title: 'Contraseña Cambiada', description: 'Tu contraseña ha sido actualizada exitosamente.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
        } finally {
            setIsSavingPassword(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Cambiar Contraseña</CardTitle>
            </CardHeader>
            <form onSubmit={handlePasswordSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Contraseña Actual</Label>
                        <div className="relative">
                            <Input id="current-password" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required disabled={isSavingPassword} />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                                {showCurrentPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">Nueva Contraseña</Label>
                        <div className="relative">
                             <Input id="new-password" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} required disabled={isSavingPassword}/>
                             <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowNewPassword(!showNewPassword)}>
                                {showNewPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                            </Button>
                        </div>
                    </div>
                     <PasswordStrengthIndicator password={newPassword} isVisible={true} />
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                         <div className="relative">
                            <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={isSavingPassword}/>
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                            </Button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSavingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}>
                        {isSavingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Cambiar Contraseña
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};

const TwoFactorCard = ({ user, updateUser }: { user: any, updateUser: (data: any) => void }) => {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [isActivating2FA, setIsActivating2FA] = useState(false);
    const [passwordForDisable, setPasswordForDisable2FA] = useState('');
    const [isDisabling2FA, setIsDisabling2FA] = useState(false);
    const { toast } = useToast();

     const handleEnable2FA = async () => {
        if (!user) return;
        setIsActivating2FA(true);
        try {
            const response = await fetch(`/api/auth/2fa?action=generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            if (!response.ok) throw new Error((await response.json()).message);
            const { dataUrl } = await response.json();
            setQrCode(dataUrl);
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
        } finally {
            setIsActivating2FA(false);
        }
    };

    const handleVerify2FA = async () => {
        if (!user || !verificationCode) return;
        setIsActivating2FA(true);
        try {
            const response = await fetch(`/api/auth/2fa?action=verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, token: verificationCode }),
            });
            if (!response.ok) throw new Error((await response.json()).message);
            const data = await response.json();
            updateUser(data.user);
            setQrCode(null);
            setVerificationCode('');
            toast({ title: '¡Éxito!', description: 'La autenticación de dos factores ha sido activada.' });
        } catch (error) {
            toast({ title: 'Error de Verificación', description: (error as Error).message, variant: 'destructive' });
        } finally {
            setIsActivating2FA(false);
        }
    };
    
    const handleDisable2FA = async () => {
        if (!user || !passwordForDisable) {
            toast({ description: "Por favor, ingresa tu contraseña.", variant: 'destructive' });
            return;
        }
        setIsDisabling2FA(true);
        try {
            const response = await fetch(`/api/auth/2fa?action=disable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, password: passwordForDisable }),
            });
            if (!response.ok) throw new Error((await response.json()).message);
            const data = await response.json();
            updateUser(data.user);
            toast({ title: '2FA Desactivado', description: 'La autenticación de dos factores ha sido desactivada.', variant: 'destructive' });
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
        } finally {
            setIsDisabling2FA(false);
            setPasswordForDisable2FA('');
        }
    };

    return (
         <Card id="card-2fa-desktop">
            <CardHeader>
                <CardTitle>Autenticación de Dos Factores (2FA)</CardTitle>
            </CardHeader>
            {user.isTwoFactorEnabled ? (
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800">
                        <CheckCircle className="h-5 w-5" />
                        <p className="font-medium text-sm">2FA está activado en tu cuenta.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password-disable-2fa">Contraseña</Label>
                        <Input id="password-disable-2fa" type="password" value={passwordForDisable} onChange={e => setPasswordForDisable2FA(e.target.value)} placeholder="Ingresa tu contraseña para desactivar" />
                        <Button variant="destructive" onClick={handleDisable2FA} disabled={isDisabling2FA || !passwordForDisable}>
                            {isDisabling2FA ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Shield className="mr-2 h-4 w-4"/>}
                            Desactivar 2FA
                        </Button>
                    </div>
                </CardContent>
            ) : qrCode ? (
                 <CardContent className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">Escanea este código QR con tu aplicación de autenticación (ej. Google Authenticator).</p>
                    <Image src={qrCode} alt="Código QR para 2FA" width={200} height={200} className="mx-auto" quality={100} />
                    <div className="space-y-2">
                        <Label htmlFor="verification-code">Código de Verificación</Label>
                        <Input id="verification-code" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} placeholder="123456" maxLength={6}/>
                    </div>
                    <Button onClick={handleVerify2FA} disabled={isActivating2FA || verificationCode.length < 6}>
                        {isActivating2FA ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4"/>}
                        Activar y Verificar
                    </Button>
                </CardContent>
            ) : (
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad a tu cuenta. Se te pedirá un código de verificación al iniciar sesión.</p>
                    <Button onClick={handleEnable2FA} disabled={isActivating2FA}>
                        {isActivating2FA ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4"/>}
                        Habilitar 2FA
                    </Button>
                </CardContent>
            )}
            
        </Card>
    );
};

const ProfileCard = ({ user, onAvatarChange, isUploading, uploadProgress }: { user: any, onAvatarChange: (e: any) => void, isUploading: boolean, uploadProgress: number }) => {
    const { level, currentXPInLevel, xpForNextLevel, progressPercentage } = useMemo(() => calculateLevel(user?.xp || 0), [user?.xp]);
    return (
     <Card className="profile-card" id="profile-card-display">
        <div className="card__img">
            <div className="card__img--gradient" />
        </div>
        <div className="card__avatar">
            <Avatar className="avatar">
                 <AvatarImage src={user.avatar || undefined} />
                 <AvatarFallback><Identicon userId={user.id}/></AvatarFallback>
            </Avatar>
            <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 bg-background text-foreground rounded-full p-1.5 cursor-pointer hover:bg-muted transition-colors shadow-md">
                <Camera className="h-5 w-5" />
                <input id="avatar-upload" type="file" className="hidden" onChange={onAvatarChange} accept="image/*" disabled={isUploading}/>
            </label>
        </div>
         <CardContent className="px-6 pb-6 pt-4">
            <CardTitle className="text-2xl font-bold font-headline flex items-center justify-center gap-2">
                {user.name}
                <VerifiedBadge role={user.role} />
            </CardTitle>
            <CardDescription className="card__subtitle">
                {user.email}
            </CardDescription>
             <div className="mt-6">
                <div className="flex justify-between items-end mb-1">
                    <p className="font-semibold text-primary">Nivel {level}</p>
                    <p className="text-sm text-muted-foreground">{user.xp || 0} XP</p>
                </div>
                <Progress value={progressPercentage} className="h-2"/>
                <p className="text-xs text-right text-muted-foreground mt-1">
                    {xpForNextLevel - currentXPInLevel} XP para el siguiente nivel
                </p>
            </div>
             <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/leaderboard"><Trophy className="mr-2 h-4 w-4"/> Ver Ranking</Link>
             </Button>
        </CardContent>
        <CardFooter className="p-0">
            {isUploading && (
                <div className="w-full">
                    <UploadProgress value={uploadProgress} className="h-1 rounded-none" />
                </div>
            )}
        </CardFooter>
    </Card>
)};

const ThemeSelectorCard = () => {
    const { theme, setTheme } = useTheme();
    const { user, updateUser } = useAuth();
  
    const handleThemeChange = async (newTheme: string) => {
        if (!user) {
          setTheme(newTheme);
          return;
        }
        setTheme(newTheme);
        updateUser({ theme: newTheme });

        try {
          await fetch(`/api/users/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme: newTheme }),
          });
        } catch (error) {
          console.error('Error saving theme preference:', error);
        }
    };
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tema de la Interfaz</CardTitle>
          <CardDescription>Elige tu paleta de colores preferida.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <button className="relative aspect-square rounded-full border-2 flex items-center justify-center bg-muted/50 cursor-not-allowed opacity-60">
                           <Palette className="h-6 w-6 text-muted-foreground" />
                        </button>
                    </TooltipTrigger>
                     <TooltipContent>
                        <p>Personalizar (Próximamente)</p>
                    </TooltipContent>
                </Tooltip>
              {AVAILABLE_THEMES.map((t) => (
                  <Tooltip key={t.value}>
                    <TooltipTrigger asChild>
                         <button
                            onClick={() => handleThemeChange(t.value)}
                            className={cn(
                                'relative aspect-square rounded-full border-2 transition-all hover:scale-105',
                                theme === t.value ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-transparent'
                            )}
                         >
                            <div className={cn('w-full h-full rounded-full', t.previewClass)} />
                            {theme === t.value && (
                                <div className="absolute top-0 right-0 h-5 w-5 bg-primary rounded-full text-primary-foreground flex items-center justify-center border-2 border-background">
                                    <Check className="h-3 w-3" />
                                </div>
                            )}
                         </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t.label}</p>
                    </TooltipContent>
                  </Tooltip>
              ))}
            </TooltipProvider>
        </CardContent>
      </Card>
    );
};


// Main component
function ProfilePageContent() {
    const { user, updateUser } = useAuth();
    const { toast } = useToast();
    const { setPageTitle } = useTitle();
    const { startTour, forceStartTour } = useTour();

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        setPageTitle('Mi Perfil');
        startTour('profile', profileTour);
    }, [setPageTitle, startTour]);

    const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && user) {
            const file = e.target.files[0];
            
            setIsUploading(true);
            setUploadProgress(0);

            try {
                const result = await uploadWithProgress('/api/upload/avatar', file, setUploadProgress);
                
                const updateUserResponse = await fetch(`/api/users/${user.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ avatar: result.url }),
                });

                if (!updateUserResponse.ok) throw new Error('No se pudo guardar la nueva imagen de perfil.');

                const updatedUser = await updateUserResponse.json();
                updateUser(updatedUser); 
                toast({ title: "Avatar Actualizado", description: "Tu nueva foto de perfil ha sido guardada." });

            } catch (error) {
                toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
            } finally {
                setIsUploading(false);
            }
        }
    };
    
    if (!user) return <Loader2 className="h-8 w-8 animate-spin" />;
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <p className="text-muted-foreground">Gestiona tu información personal, seguridad y logros.</p>
                </div>
                 <Button variant="outline" size="sm" onClick={() => forceStartTour('profile', profileTour)}>
                    <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
                </Button>
            </div>
            
             <Tabs defaultValue="profile">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="profile">Perfil y Seguridad</TabsTrigger>
                    <TabsTrigger value="achievements">Mis Logros</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="mt-6">
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                            <ProfileCard user={user} onAvatarChange={handleAvatarChange} isUploading={isUploading} uploadProgress={uploadProgress} />
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <InfoCard user={user} updateUser={updateUser} />
                            <ThemeSelectorCard />
                            <SecurityCard 
                                user={user} 
                                newPassword={newPassword}
                                setNewPassword={setNewPassword}
                                confirmPassword={confirmPassword}
                                setConfirmPassword={setConfirmPassword}
                                currentPassword={currentPassword}
                                setCurrentPassword={setCurrentPassword}
                            />
                             <TwoFactorCard user={user} updateUser={updateUser} />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="achievements" className="mt-6">
                    <AchievementsView />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function ProfilePage() {
    const { isLoading, user } = useAuth();
    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>;
    }
    return <ProfilePageContent />;
}
