// src/app/(app)/profile/page.tsx
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

// --- Components defined outside of the main component to prevent re-creation on render ---

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
        
            
                Información Personal
            
            
                
                    
                        Nombre
                        
                    
                    
                        Email
                        
                    
                
                
                    
                
            
        
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
        
            
                Cambiar Contraseña
            
            
                
                    
                        Contraseña Actual
                        
                            
                             
                                {showCurrentPassword ?  : }
                            
                        
                    
                    
                        Nueva Contraseña
                        
                            
                             
                                {showNewPassword ?  : }
                            
                        
                    
                    
                     
                    
                        Confirmar Nueva Contraseña
                        
                            
                             
                                {showConfirmPassword ?  : }
                            
                        
                    
                
                
                    Cambiar Contraseña
                
            
        
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
         
            
                Autenticación de Dos Factores (2FA)
            
            
            {user.isTwoFactorEnabled ? (
                
                    
                        
                        
                            2FA está activado en tu cuenta.
                        
                    
                    
                        
                            Contraseña
                            
                            
                            Desactivar 2FA
                        
                    
                
            ) : qrCode ? (
                 
                    
                        Escanea este código QR con tu aplicación de autenticación (ej. Google Authenticator).
                    
                    
                    
                        Código de Verificación
                        
                        
                    
                    Activar y Verificar
                
            ) : (
                
                    
                        Añade una capa extra de seguridad a tu cuenta. Se te pedirá un código de verificación al iniciar sesión.
                    
                    Habilitar 2FA
                
            )}
            
        
    );
};

const ProfileCard = ({ user, onAvatarChange, isUploading, uploadProgress }: { user: any, onAvatarChange: (e: any) => void, isUploading: boolean, uploadProgress: number }) => (
     
        
            
            
        
        
            
            
            
            
            
        
         
            
                {user.name}
                
                {user.email}
            
        
        
            {isUploading && (
                
                    
                
            )}
        
    
);

const GamificationCard = ({ user, achievements, isLoadingAchievements }: { user: any, achievements: any[], isLoadingAchievements: boolean }) => {
    const { level, currentXPInLevel, xpForNextLevel, progressPercentage } = useMemo(() => calculateLevel(user?.xp || 0), [user?.xp]);
    return (
     
        
            
                Progreso y Logros
            
        
        
             
                
                    Nivel {level}
                    {user.xp || 0} XP
                
            
             
                
                
                 / {xpForNextLevel} XP para el siguiente nivel
             
             
              
                
                    Logros Desbloqueados
                    {isLoadingAchievements ? (
                        
                    ) : achievements.length > 0 ? (
                        
                            
                                
                                    
                                        
                                            
                                        
                                    
                                    
                                        
                                            
                                            
                                        
                                    
                                
                            
                        
                    ) : (
                        
                            Aún no has desbloqueado logros. ¡Sigue aprendiendo!
                        
                    )}
                
            
        
    
)};


// Main component
function ProfilePageContent() {
    const { user, updateUser } = useAuth();
    const { toast } = useToast();
    const { setPageTitle } = useTitle();
    const { startTour, forceStartTour } = useTour();

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [achievements, setAchievements] = useState<UserAchievement[]>([]);
    const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

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


    const handleAvatarChange = async (e: ChangeEvent) => {
        if (e.target.files && e.target.files[0] && user) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            
            setIsUploading(true);
            setUploadProgress(0);

            try {
                const result = await uploadWithProgress('/api/upload/avatar', formData, setUploadProgress);
                
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
    
    if (!user) return  
    
    const isMobile = useIsMobile();

    return (
        
            
                
                    
                        Gestiona tu información personal y la seguridad de tu cuenta.
                    
                     Ver Guía
                
            
            
                
                    
                        
                        
                        
                    
                    
                        
                        
                            
                                user={user} 
                                newPassword={newPassword}
                                setNewPassword={setNewPassword}
                                confirmPassword={confirmPassword}
                                setConfirmPassword={setConfirmPassword}
                                currentPassword={currentPassword}
                                setCurrentPassword={setCurrentPassword}
                            />
                        
                        
                    
                     
                        
                            
                                user={user} 
                                newPassword={newPassword}
                                setNewPassword={setNewPassword}
                                confirmPassword={confirmPassword}
                                setConfirmPassword={setConfirmPassword}
                                currentPassword={currentPassword}
                                setCurrentPassword={setCurrentPassword}
                            />
                            
                        
                    
                
            
        
    );
}

export default function ProfilePage() {
    const { isLoading, user } = useAuth();
    if (isLoading || !user) {
        return ;
    }
    return ;
}
