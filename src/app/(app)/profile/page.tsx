
// src/app/(app)/profile/page.tsx
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Camera, User, KeyRound, Shield, Eye, EyeOff, Save, CheckCircle, Award, Star, HelpCircle } from 'lucide-react';
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
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';

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


function ProfilePageContent() {
    const { user, updateUser, logout } = useAuth();
    const { toast } = useToast();
    const { setPageTitle } = useTitle();
    const { startTour, forceStartTour } = useTour();

    // State for info
    const [name, setName] = useState(user?.name || '');
    const [isSavingInfo, setIsSavingInfo] = useState(false);

    // State for password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    // State for 2FA
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [isActivating2FA, setIsActivating2FA] = useState(false);
    const [passwordForDisable2FA, setPasswordForDisable2FA] = useState('');
    const [isDisabling2FA, setIsDisabling2FA] = useState(false);
    
    // State for avatar upload
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // State for gamification
    const [achievements, setAchievements] = useState<UserAchievement[]>([]);
    const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);

    useEffect(() => {
        setPageTitle('Mi Perfil');
        startTour('profile', profileTour);
    }, [setPageTitle, startTour]);

    const fetchAchievements = useCallback(async () => {
        if (!user) return;
        setIsLoadingAchievements(true);
        try {
            const res = await fetch(`/api/users/${user.id}/achievements`);
            if (res.ok) {
                const data = await res.json();
                setAchievements(data);
            }
        } catch (error) {
            console.error("Failed to fetch achievements", error);
        } finally {
            setIsLoadingAchievements(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAchievements();
    }, [fetchAchievements]);


    const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && user) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            
            setIsUploading(true);
            setUploadProgress(0);

            try {
                const result = await uploadWithProgress('/api/upload/avatar', formData, setUploadProgress);
                
                // Now update the user profile with the new URL
                const updateUserResponse = await fetch(`/api/users/${user.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ avatar: result.url }),
                });

                if (!updateUserResponse.ok) throw new Error('No se pudo guardar la nueva imagen de perfil.');

                const updatedUser = await updateUserResponse.json();
                updateUser(updatedUser); // Update context
                toast({ title: "Avatar Actualizado", description: "Tu nueva foto de perfil ha sido guardada." });

            } catch (error) {
                toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
            } finally {
                setIsUploading(false);
            }
        }
    };
    
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
            // Reset fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
        } finally {
            setIsSavingPassword(false);
        }
    };
    
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
        if (!user || !passwordForDisable2FA) {
            toast({ description: "Por favor, ingresa tu contraseña.", variant: 'destructive' });
            return;
        }
        setIsDisabling2FA(true);
        try {
            const response = await fetch(`/api/auth/2fa?action=disable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, password: passwordForDisable2FA }),
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
    
    const { level, currentXPInLevel, xpForNextLevel, progressPercentage } = useMemo(() => calculateLevel(user?.xp || 0), [user?.xp]);


    if (!user) return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>;

    const ProfileCard = () => (
         <Card className="profile-card card-border-animated" id="profile-card-display">
            <div className="card__img">
                <div className="card__img--gradient" />
            </div>
            <div className="card__avatar">
                <Avatar className="h-full w-full">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} quality={100} />
                    <AvatarFallback><Identicon userId={user.id}/></AvatarFallback>
                </Avatar>
                 <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 h-9 w-9 bg-card text-card-foreground rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-muted transition-colors">
                    <Camera className="h-5 w-5" />
                    <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isUploading}/>
                </label>
            </div>
             <CardHeader className="pt-2 pb-0">
                <CardTitle className="text-2xl font-headline">{user.name}</CardTitle>
                <CardDescription className="card__subtitle">{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
                {isUploading && (
                    <div className="px-4 pt-2">
                        <UploadProgress value={uploadProgress} className="h-1.5"/>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const InfoCard = () => (
        <Card id="info-card-desktop">
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="text-primary"/>Información Personal</CardTitle></CardHeader>
            <form onSubmit={handleInfoSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-1"><Label htmlFor="name">Nombre</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSavingInfo} /></div>
                    <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" value={user.email} disabled /></div>
                </CardContent>
                <CardFooter><Button type="submit" disabled={isSavingInfo || name === user.name}>{isSavingInfo ? <Loader2 className="animate-spin" /> : 'Guardar Información'}</Button></CardFooter>
            </form>
        </Card>
    );
    
    const SecurityCard = () => (
        <Card id="security-card-desktop">
            <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="text-primary"/>Cambiar Contraseña</CardTitle></CardHeader>
            <form onSubmit={handlePasswordSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="currentPassword">Contraseña Actual</Label>
                        <div className="relative">
                            <Input id="currentPassword" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 bottom-1 h-7 w-7" onClick={()=>setShowCurrentPassword(!showCurrentPassword)}>{showCurrentPassword ? <EyeOff /> : <Eye />}</Button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                        <div className="relative">
                            <Input id="newPassword" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 bottom-1 h-7 w-7" onClick={()=>setShowNewPassword(!showNewPassword)}>{showNewPassword ? <EyeOff /> : <Eye />}</Button>
                        </div>
                    </div>
                    <PasswordStrengthIndicator password={newPassword} isVisible={newPassword.length > 0} />
                     <div className="space-y-1">
                        <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                        <div className="relative">
                            <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                             <Button type="button" variant="ghost" size="icon" className="absolute right-1 bottom-1 h-7 w-7" onClick={()=>setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff /> : <Eye />}</Button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter><Button type="submit" disabled={isSavingPassword}>{isSavingPassword ? <Loader2 className="animate-spin"/> : 'Cambiar Contraseña'}</Button></CardFooter>
            </form>
        </Card>
    );

    const TwoFactorCard = () => (
         <Card id="card-2fa-desktop">
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="text-primary"/>Autenticación de Dos Factores (2FA)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
            {user.isTwoFactorEnabled ? (
                <div>
                    <div className="flex items-center gap-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-3 rounded-lg">
                        <CheckCircle className="h-5 w-5"/>
                        <p className="font-semibold text-sm">2FA está activado en tu cuenta.</p>
                    </div>
                     <div className="mt-4 space-y-2">
                        <Label htmlFor="passwordForDisable">Contraseña</Label>
                        <Input id="passwordForDisable" type="password" value={passwordForDisable2FA} onChange={(e) => setPasswordForDisable2FA(e.target.value)} placeholder="Ingresa tu contraseña para desactivar" />
                        <Button variant="destructive" onClick={handleDisable2FA} disabled={isDisabling2FA}>{isDisabling2FA ? <Loader2 className="animate-spin"/> : 'Desactivar 2FA'}</Button>
                     </div>
                </div>
            ) : qrCode ? (
                 <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">Escanea este código QR con tu aplicación de autenticación (ej. Google Authenticator).</p>
                    <div className="flex justify-center p-2 bg-white rounded-md"><Image src={qrCode} alt="Código QR para 2FA" width={200} height={200} quality={100} /></div>
                    <Label htmlFor="verificationCode">Código de Verificación</Label>
                    <Input id="verificationCode" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="123456" maxLength={6} className="w-40 mx-auto text-center tracking-widest"/>
                    <Button onClick={handleVerify2FA} disabled={isActivating2FA}>{isActivating2FA ? <Loader2 className="animate-spin"/> : 'Activar y Verificar'}</Button>
                </div>
            ) : (
                <div>
                    <p className="text-sm text-muted-foreground mb-4">Añade una capa extra de seguridad a tu cuenta. Se te pedirá un código de verificación al iniciar sesión.</p>
                    <Button onClick={handleEnable2FA} disabled={isActivating2FA}>{isActivating2FA ? <Loader2 className="animate-spin"/> : 'Habilitar 2FA'}</Button>
                </div>
            )}
            </CardContent>
        </Card>
    );
    
    const GamificationCard = () => (
         <Card id="gamification-card-desktop">
            <CardHeader><CardTitle className="flex items-center gap-2"><Award className="text-primary"/>Progreso y Logros</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Nivel {level}</p>
                    <p className="text-4xl font-bold text-primary">{user.xp || 0} XP</p>
                </div>
                 <div className="space-y-1">
                    <Progress value={progressPercentage} />
                    <p className="text-xs text-muted-foreground text-right">{currentXPInLevel} / {xpForNextLevel} XP para el siguiente nivel</p>
                 </div>
                 <Separator />
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Logros Desbloqueados</h4>
                    {isLoadingAchievements ? (
                        <div className="flex justify-center"><Loader2 className="animate-spin"/></div>
                    ) : achievements.length > 0 ? (
                        <TooltipProvider>
                            <div className="flex flex-wrap gap-4">
                                {achievements.map(({ achievement }) => (
                                    <Tooltip key={achievement.id}>
                                        <TooltipTrigger>
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 flex items-center justify-center text-white shadow-md">
                                                <Star className="h-7 w-7" fill="currentColor"/>
                                            </div>
                                        </TooltipTrigger>
                                         <TooltipContent>
                                            <p className="font-bold">{achievement.name}</p>
                                            <p className="text-xs">{achievement.description}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        </TooltipProvider>
                    ) : (
                        <p className="text-xs text-muted-foreground text-center italic">Aún no has desbloqueado logros. ¡Sigue aprendiendo!</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );


    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div><p className="text-muted-foreground">Gestiona tu información personal y la seguridad de tu cuenta.</p></div>
                 <Button variant="outline" size="sm" onClick={() => forceStartTour('profile', profileTour)}>
                    <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
                </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <ProfileCard/>
                    <div className={cn(useIsMobile() ? "hidden" : "block")}><GamificationCard /></div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <InfoCard/>
                    <div className={cn(useIsMobile() ? "block" : "hidden")}><GamificationCard /></div>
                    <div className={cn(useIsMobile() ? "hidden" : "block")}><SecurityCard/></div>
                    <div className={cn(useIsMobile() ? "hidden" : "block")}><TwoFactorCard/></div>
                </div>
                 {useIsMobile() && (
                    <div className="lg:col-span-3 space-y-8">
                        <SecurityCard/>
                        <TwoFactorCard/>
                    </div>
                 )}
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const { isLoading, user } = useAuth();
    if (isLoading || !user) {
        return <div className="flex h-screen w-screen items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>;
    }
    return <ProfilePageContent />;
}
