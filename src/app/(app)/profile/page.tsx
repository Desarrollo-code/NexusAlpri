
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit3, Mail, Shield, User, Camera, KeyRound, Save, Loader2, Check, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"


export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [editableName, setEditableName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 2FA State
  const [show2faSetup, setShow2faSetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [is2faProcessing, setIs2faProcessing] = useState(false);
  const [showDisable2faDialog, setShowDisable2faDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  
  // Change Password State
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (user) {
      setEditableName(user.name || '');
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const getInitials = (name?: string | null) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    if (names.length === 1 && names[0]) return names[0].substring(0, 2).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async () => {
      if (!user) return;
      setIsSaving(true);
      
      const updatedUserData: any = {};
      let hasChanges = false;
      
      if (editableName !== user.name) {
        updatedUserData.name = editableName;
        hasChanges = true;
      }
      
      const file = avatarInputRef.current?.files?.[0];
      if (file) {
          setIsUploadingAvatar(true);
          setUploadProgress(0);
          const formData = new FormData();
          formData.append('file', file);
          try {
              const { url } = await uploadWithProgress('/api/upload/avatar', formData, setUploadProgress);
              updatedUserData.avatar = url;
              hasChanges = true;
          } catch(e) {
              toast({ title: 'Error de Subida', description: (e as Error).message, variant: 'destructive' });
              setIsSaving(false);
              setIsUploadingAvatar(false);
              return;
          } finally {
              setIsUploadingAvatar(false);
          }
      }

      if (!hasChanges) {
          toast({ title: 'Sin cambios', description: 'No se detectaron cambios para guardar.' });
          setIsSaving(false);
          return;
      }
      
      try {
          const response = await fetch(`/api/users/${user.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedUserData)
          });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Error al actualizar el perfil');
          }
          const savedUser = await response.json();
          updateUser(savedUser); // Update context
          toast({ title: 'Perfil Actualizado', description: 'Tus datos han sido guardados.' });
      } catch (error) {
          toast({ title: 'Error al Guardar', description: (error as Error).message, variant: 'destructive' });
      } finally {
          setIsSaving(false);
          if (avatarInputRef.current) avatarInputRef.current.value = "";
      }
  };

  const handleEnable2fa = async () => {
    if (!user) return;
    setIs2faProcessing(true);
    try {
      const res = await fetch('/api/auth/2fa?action=generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setQrCodeUrl(data.dataUrl);
      setShow2faSetup(true);
    } catch (error) {
      toast({ title: 'Error al iniciar 2FA', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIs2faProcessing(false);
    }
  };

  const handleVerify2fa = async () => {
    if (!user || !twoFactorToken) return;
    setIs2faProcessing(true);
    try {
      const res = await fetch('/api/auth/2fa?action=verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, token: twoFactorToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: '2FA Activado', description: 'La autenticación de dos factores ha sido habilitada.' });
      
      if (data.user) {
        updateUser(data.user);
      }
      
      setShow2faSetup(false);
      setQrCodeUrl('');
      setTwoFactorToken('');
    } catch (error) {
      toast({ title: 'Error de Verificación', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIs2faProcessing(false);
    }
  };
  
  const handleDisable2fa = async () => {
    if (!user || !disablePassword) return;
    setIs2faProcessing(true);
    try {
        const res = await fetch('/api/auth/2fa?action=disable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, password: disablePassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        toast({ title: '2FA Desactivado', description: 'La autenticación de dos factores ha sido deshabilitada.' });
        
        if (data.user) {
          updateUser(data.user);
        }

        setShowDisable2faDialog(false);
        setDisablePassword('');
    } catch (error) {
        toast({ title: 'Error al desactivar 2FA', description: (error as Error).message, variant: 'destructive' });
    } finally {
        setIs2faProcessing(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmPassword) {
        toast({ title: "Error", description: "Las nuevas contraseñas no coinciden.", variant: "destructive" });
        return;
    }
    
    setIsChangingPassword(true);
    try {
        const response = await fetch(`/api/users/${user.id}/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        toast({ title: 'Éxito', description: "Tu contraseña ha sido actualizada." });
        setShowChangePasswordDialog(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    } catch (error) {
        toast({ title: 'Error al cambiar contraseña', description: (error as Error).message, variant: 'destructive' });
    } finally {
        setIsChangingPassword(false);
    }
  };

  if (!user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/> Cargando perfil...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline mb-2">Mi Perfil</h1>
        <p className="text-muted-foreground">Visualiza y actualiza tu información personal y de cuenta.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <Card className="text-center">
            <CardHeader>
              <div className="relative mx-auto w-32 h-32 mb-4">
                <Avatar className="w-32 h-32 border-4 border-primary/20 shadow-md">
                  <AvatarImage src={avatarPreview || `https://placehold.co/128x128.png?text=${getInitials(user.name)}`} alt={user.name || ''} data-ai-hint="profile photo" />
                  <AvatarFallback className="text-4xl">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-background"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isSaving || isUploadingAvatar}
                    aria-label="Cambiar foto de perfil"
                >
                    <Camera className="h-4 w-4 text-primary" />
                </Button>
                <input 
                    type="file" 
                    ref={avatarInputRef} 
                    onChange={handleFileChange} 
                    accept="image/png, image/jpeg, image/gif, image/webp" 
                    className="hidden"
                />
              </div>
              {isUploadingAvatar && (
                <div className="px-4">
                  <Progress value={uploadProgress} className="h-1.5" />
                  <p className="text-xs mt-1 text-muted-foreground">{uploadProgress}%</p>
                </div>
              )}
              <CardTitle className="text-2xl font-headline mt-2">{user.name}</CardTitle>
              <Badge variant={user.role === 'ADMINISTRATOR' ? 'destructive' : user.role === 'INSTRUCTOR' ? 'default' : 'secondary'} className="capitalize mx-auto">
                {(user.role as string)?.toLowerCase() || 'student'}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2"><Mail className="h-4 w-4 text-primary"/> {user.email}</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary"/>Información Personal</CardTitle>
              <CardDescription>Estos datos son visibles en tu perfil público (si aplica).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input 
                  id="fullName" 
                  value={editableName} 
                  onChange={(e) => setEditableName(e.target.value)}
                  disabled={isSaving || isUploadingAvatar}
                />
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" value={user.email} disabled />
                <p className="text-xs text-muted-foreground mt-1">El correo electrónico no se puede cambiar desde aquí.</p>
              </div>
               <div className="pt-2">
                  <Button onClick={handleSaveChanges} disabled={isSaving || isUploadingAvatar} className="w-full">
                      {isSaving || isUploadingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {isSaving ? 'Guardando...' : (isUploadingAvatar ? 'Subiendo...' : 'Guardar Información')}
                  </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/>Seguridad de la Cuenta</CardTitle>
                <CardDescription>Gestiona la seguridad de tu acceso a NexusAlpri.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Autenticación de Dos Factores (2FA)</h4>
                  {user.isTwoFactorEnabled ? (
                      <div className="flex items-center justify-between mt-2 p-3 rounded-md bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                          <p className="text-sm text-green-800 dark:text-green-200">2FA está <strong>activado</strong> en tu cuenta.</p>
                          <Button variant="destructive" size="sm" onClick={() => setShowDisable2faDialog(true)} disabled={is2faProcessing}>Desactivar</Button>
                      </div>
                  ) : (
                      <div className="flex items-center justify-between mt-2 p-3 rounded-md bg-muted/50 border">
                          <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad.</p>
                          <Button onClick={handleEnable2fa} disabled={is2faProcessing}>
                            {is2faProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Activar 2FA
                          </Button>
                      </div>
                  )}
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Cambiar Contraseña</h4>
                    <div className="flex items-center justify-between mt-2 p-3 rounded-md bg-muted/50 border">
                        <p className="text-sm text-muted-foreground">Actualiza tu contraseña regularmente.</p>
                        <Button variant="outline" onClick={() => setShowChangePasswordDialog(true)}>Cambiar Contraseña</Button>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={show2faSetup} onOpenChange={setShow2faSetup}>
        <DialogContent className="w-[95vw] max-w-md rounded-lg">
            <DialogHeader>
                <DialogTitle>Configurar Autenticación de Dos Factores</DialogTitle>
                <DialogDescription>
                    Escanea el código QR con tu aplicación de autenticación (ej. Google Authenticator, Authy). Luego, ingresa el código de 6 dígitos para verificar.
                </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
                {qrCodeUrl ? (
                    <Image src={qrCodeUrl} alt="Código QR para 2FA" width={200} height={200} data-ai-hint="qr code"/>
                ) : <Loader2 className="h-8 w-8 animate-spin"/>}
                 <div className="w-full flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={twoFactorToken}
                      onChange={(value) => setTwoFactorToken(value)}
                      disabled={is2faProcessing}
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
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button variant="outline" onClick={() => setShow2faSetup(false)} disabled={is2faProcessing}>Cancelar</Button>
                <Button onClick={handleVerify2fa} disabled={!twoFactorToken || twoFactorToken.length < 6 || is2faProcessing}>
                    {is2faProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Verificar y Activar
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <AlertDialog open={showDisable2faDialog} onOpenChange={setShowDisable2faDialog}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar Autenticación de Dos Factores?</AlertDialogTitle>
            <AlertDialogDescription>
              Para confirmar, por favor ingresa tu contraseña actual. Esto eliminará la capa extra de seguridad de tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
              <Label htmlFor="disable-password">Contraseña</Label>
              <Input
                id="disable-password"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
              />
          </div>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <AlertDialogCancel onClick={() => setDisablePassword('')}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable2fa}
              disabled={!disablePassword || is2faProcessing}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {is2faProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              Sí, desactivar 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent className="w-[95vw] max-w-md rounded-lg">
            <DialogHeader>
                <DialogTitle>Cambiar Contraseña</DialogTitle>
                <DialogDescription>
                    Ingresa tu contraseña actual y la nueva contraseña.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleChangePassword} className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="current-password">Contraseña Actual</Label>
                    <div className="relative">
                      <Input 
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          disabled={isChangingPassword}
                          className="pr-10"
                      />
                      <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                          {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-password">Nueva Contraseña</Label>
                    <div className="relative">
                      <Input 
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          disabled={isChangingPassword}
                          className="pr-10"
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                    <div className="relative">
                      <Input 
                          id="confirm-password"
                          type={showConfirmNewPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={isChangingPassword}
                          className="pr-10"
                      />
                       <button type="button" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
                          {showConfirmNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                </div>
                <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
                    <Button variant="outline" type="button" onClick={() => setShowChangePasswordDialog(false)} disabled={isChangingPassword}>Cancelar</Button>
                    <Button type="submit" disabled={isChangingPassword}>
                        {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Contraseña
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
