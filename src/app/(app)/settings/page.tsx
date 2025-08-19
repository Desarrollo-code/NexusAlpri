// src/app/(app)/settings/page.tsx
'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Palette, Bell, Shield, List, Tag, Trash2, Loader2, FileWarning, KeyRound, Clock, Save, Image as ImageIcon, Paintbrush, Type, User, UploadCloud, XCircle, Replace } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { PlatformSettings as AppPlatformSettings } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
import { useTitle } from '@/contexts/title-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { fontMap } from '@/lib/fonts';
import { ImageCropper } from '@/components/image-cropper';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '@/components/ui/progress';

const availableFonts = [
    { value: 'Inter', label: 'Inter (Sans-serif)' },
    { value: 'Space Grotesk', label: 'Space Grotesk (Sans-serif)' },
    { value: 'Source Code Pro', label: 'Source Code Pro (Monospace)' },
    { value: 'Roboto', label: 'Roboto (Sans-serif)' },
    { value: 'Lato', label: 'Lato (Sans-serif)' },
    { value: 'Montserrat', label: 'Montserrat (Sans-serif)' },
];

const UploadWidget = ({
  label,
  currentImageUrl,
  onFileSelect,
  onRemove,
  disabled,
  useCropper = true,
}: {
  label: string;
  currentImageUrl?: string | null;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  disabled: boolean;
  useCropper?: boolean;
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative aspect-video w-full border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-muted/20">
        {currentImageUrl ? (
          <>
            <Image
              src={currentImageUrl}
              alt={`Previsualización de ${label}`}
              fill
              className="object-contain p-2 rounded-lg"
              data-ai-hint="logo company"
            />
            <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-7 w-7 rounded-full shadow-md"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <Replace className="h-4 w-4" />
                <span className="sr-only">Reemplazar imagen</span>
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-7 w-7 rounded-full shadow-md"
                onClick={onRemove}
                disabled={disabled}
              >
                <XCircle className="h-4 w-4" />
                <span className="sr-only">Eliminar imagen</span>
              </Button>
            </div>
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="flex flex-col h-full w-full items-center justify-center text-muted-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <UploadCloud className="h-8 w-8 mb-1" />
            <span className="text-xs font-semibold">Subir imagen</span>
          </Button>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        disabled={disabled}
        accept="image/png, image/jpeg, image/svg+xml, image/webp"
        className="hidden"
      />
    </div>
  );
};


const ThemePreview = ({ settings }: { settings: AppPlatformSettings | null }) => {
    if (!settings) return null;

    const fontVars = {
        '--font-headline': (fontMap[settings.fontHeadline || 'Space Grotesk'] as any)?.style.fontFamily,
        '--font-body': (fontMap[settings.fontBody || 'Inter'] as any)?.style.fontFamily,
    } as React.CSSProperties;

    return (
        <div className="space-y-4">
             <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle>Vista Previa</CardTitle>
                    <CardDescription>Así se verán los cambios en la plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4" style={fontVars}>
                     {/* Preview for Light Theme */}
                    <div className="p-4 rounded-lg border bg-background">
                        <h3 className="text-lg font-bold" style={{ color: settings.primaryColor }}>Apariencia General</h3>
                        <div className="mt-2 p-4 rounded-md shadow-sm" style={{ backgroundColor: settings.backgroundColorLight || '#FFFFFF' }}>
                            <div className="flex items-center gap-2 mb-4">
                                {settings.logoUrl ? <Image src={settings.logoUrl} alt="logo" width={32} height={32} data-ai-hint="logo company" /> : <div className="w-8 h-8 rounded-md bg-muted" />}
                                <h4 className="font-headline text-base font-bold" style={{ color: settings.primaryColor }}>{settings.platformName}</h4>
                            </div>
                            <p className="font-body text-sm" style={{ color: '#000000' }}>Este es un texto de párrafo para previsualizar la fuente del cuerpo.</p>
                            <div className="flex gap-2 mt-4">
                                <Button style={{ backgroundColor: settings.primaryColor, color: '#FFFFFF' }} size="sm">Botón Primario</Button>
                                <Button style={{ backgroundColor: settings.secondaryColor, color: '#000000' }} size="sm">Botón Secundario</Button>
                            </div>
                        </div>
                    </div>
                     {/* Preview for Public Pages */}
                    <div className="p-4 rounded-lg border bg-background">
                        <h3 className="text-lg font-bold" style={{ color: settings.primaryColor }}>Páginas Públicas</h3>
                         <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Página de Inicio (Landing)</Label>
                                <div className="h-24 w-full rounded-md bg-muted flex items-center justify-center overflow-hidden relative">
                                    {settings.landingImageUrl ? <Image src={settings.landingImageUrl} alt="Vista previa de la página de inicio" layout="fill" objectFit="cover" data-ai-hint="office workspace" /> : <span className="text-xs text-muted-foreground">Sin Imagen</span>}
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label className="text-xs">Página de Acceso (Login)</Label>
                                <div className="h-24 w-full rounded-md bg-muted flex items-center justify-center overflow-hidden relative">
                                     {settings.authImageUrl ? <Image src={settings.authImageUrl} alt="Vista previa de la página de acceso" layout="fill" objectFit="cover" data-ai-hint="abstract background" /> : <span className="text-xs text-muted-foreground">Sin Imagen</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Watermark Preview */}
                    {settings.watermarkUrl && (
                        <div className="p-4 rounded-lg border bg-background">
                           <h3 className="text-lg font-bold" style={{ color: settings.primaryColor }}>Marca de Agua</h3>
                           <div className="mt-2 h-20 w-full rounded-md bg-muted flex items-center justify-center overflow-hidden relative">
                                <span className="text-sm text-muted-foreground z-10">Contenido de la app</span>
                                <Image src={settings.watermarkUrl} alt="Vista previa de la marca de agua" layout="fill" objectFit="contain" className="opacity-20 z-0 p-2" data-ai-hint="logo company"/>
                           </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}


export default function SettingsPage() {
  const { user, settings: globalSettings, updateSettings } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { setPageTitle } = useTitle();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formState, setFormState] = useState<AppPlatformSettings | null>(null);
  const [newCategory, setNewCategory] = useState('');
  
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isCheckingCategory, setIsCheckingCategory] = useState(false);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropUploadUrl, setCropUploadUrl] = useState('');
  const [cropField, setCropField] = useState<'logoUrl' | 'watermarkUrl' | 'landingImageUrl' | 'authImageUrl' | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    setPageTitle('Configuración');
  }, [setPageTitle]);

  useEffect(() => {
    if (globalSettings) {
      const settingsWithDefaults = {
        ...globalSettings,
        emailWhitelist: globalSettings.emailWhitelist || '',
      };
      setFormState(settingsWithDefaults);
      setIsLoading(false);
    }
  }, [globalSettings]);

  if (!user || user.role !== 'ADMINISTRATOR') {
    if (typeof window !== 'undefined') router.push('/dashboard');
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>;
  }
  
  const handleInputChange = (field: keyof AppPlatformSettings, value: any) => {
    setFormState(prev => prev ? { ...prev, [field]: value } : null);
  };
  
  const handleSwitchChange = (field: keyof AppPlatformSettings, checked: boolean) => {
    setFormState(prev => prev ? { ...prev, [field]: checked } : null);
  };
  
  const handleFileSelected = (field: 'logoUrl' | 'watermarkUrl' | 'landingImageUrl' | 'authImageUrl', e: ChangeEvent<HTMLInputElement>, useCropper: boolean) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            if (useCropper) {
                setImageToCrop(reader.result as string);
                setCropUploadUrl('/api/upload/course-image');
                setCropField(field);
            } else {
                handleDirectUpload(field, file);
            }
        };
        reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };
  
  const handleDirectUpload = async (field: 'logoUrl' | 'watermarkUrl' | 'landingImageUrl' | 'authImageUrl', file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    try {
        const result: { url: string } = await uploadWithProgress('/api/upload/course-image', formData, setUploadProgress);
        setFormState(prev => prev ? { ...prev, [field]: result.url } : null);
        toast({ title: "Imagen Subida", description: "La imagen se ha subido correctamente." });
    } catch (err) {
        toast({ title: "Error de Subida", description: (err as Error).message, variant: "destructive" });
    } finally {
        setIsUploading(false);
    }
  };

  const handleCropComplete = (croppedFileUrl: string) => {
    if (cropField) {
        setFormState(prev => prev ? { ...prev, [cropField]: croppedFileUrl } : null);
    }
    setImageToCrop(null);
    setCropField(null);
  };


  const handleRemoveImage = (field: 'logoUrl' | 'watermarkUrl' | 'landingImageUrl' | 'authImageUrl') => {
      setFormState(prev => prev ? { ...prev, [field]: null } : null);
  }


  const handleAddCategory = () => {
    if (formState && newCategory.trim() && !formState.resourceCategories.map(c => c.toLowerCase()).includes(newCategory.trim().toLowerCase())) {
      const updatedCategories = [...formState.resourceCategories, newCategory.trim()].sort();
      handleInputChange('resourceCategories', updatedCategories);
      setNewCategory('');
    } else if (newCategory.trim()) {
        toast({ title: "Categoría Duplicada", description: "Esta categoría ya existe.", variant: "default" });
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete || !formState) return;
    setIsCheckingCategory(true);
    try {
        const response = await fetch(`/api/settings/category-check/${encodeURIComponent(categoryToDelete)}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message);
        }
        const updatedCategories = formState.resourceCategories.filter(cat => cat !== categoryToDelete);
        handleInputChange('resourceCategories', updatedCategories);
        toast({ title: "Categoría Eliminada (Pendiente)", description: `"${categoryToDelete}" se eliminará al guardar los cambios.` });
    } catch (err) {
        toast({ title: "Error al Eliminar Categoría", description: (err as Error).message, variant: "destructive" });
    } finally {
        setCategoryToDelete(null);
        setIsCheckingCategory(false);
    }
  };


  const handleSaveSettings = async () => {
    if (!formState) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        let errorData = { message: `Failed to save settings (${response.status})`};
        try {
            if (response.headers.get('content-type')?.includes('application/json')) {
                errorData = await response.json();
            }
        } catch (parseError) {
          // Silent catch
        }
        throw new Error(errorData.message);
      }
      const savedData: AppPlatformSettings = await response.json();
      updateSettings(savedData);
      toast({ title: "Configuración Guardada", description: "Los cambios han sido guardados exitosamente. Puede que necesites refrescar la página para ver todos los cambios." });
    } catch (err) {
      toast({ title: "Error al Guardar", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading || !formState) {
    return (
        <div className="space-y-8">
            <div>
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card><CardHeader><Skeleton className="h-6 w-48 mb-2" /><Skeleton className="h-4 w-64" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-48 mb-2" /><Skeleton className="h-4 w-64" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card><CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground">Ajusta los parámetros generales, de seguridad y apariencia de NexusAlpri.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
            <Tabs defaultValue="appearance" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="appearance">Apariencia</TabsTrigger>
                    <TabsTrigger value="security">Seguridad</TabsTrigger>
                    <TabsTrigger value="general">Generales</TabsTrigger>
                </TabsList>
                <TabsContent value="appearance" className="space-y-8 mt-6">
                   <Card className="card-border-animated">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary"/>Identidad Visual</CardTitle>
                            <CardDescription>Logo, marca de agua e imágenes de las páginas públicas.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <UploadWidget label="Logo (PNG/SVG)" currentImageUrl={formState.logoUrl} onFileSelect={(e) => handleFileSelected('logoUrl', e, false)} onRemove={() => handleRemoveImage('logoUrl')} disabled={isSaving || isUploading} useCropper={false} />
                           <UploadWidget label="Marca de Agua (PNG)" currentImageUrl={formState.watermarkUrl} onFileSelect={(e) => handleFileSelected('watermarkUrl', e, false)} onRemove={() => handleRemoveImage('watermarkUrl')} disabled={isSaving || isUploading} useCropper={false}/>
                           <UploadWidget label="Imagen Página de Inicio" currentImageUrl={formState.landingImageUrl} onFileSelect={(e) => handleFileSelected('landingImageUrl', e, true)} onRemove={() => handleRemoveImage('landingImageUrl')} disabled={isSaving || isUploading} useCropper={true}/>
                           <UploadWidget label="Imagen Página de Acceso" currentImageUrl={formState.authImageUrl} onFileSelect={(e) => handleFileSelected('authImageUrl', e, true)} onRemove={() => handleRemoveImage('authImageUrl')} disabled={isSaving || isUploading} useCropper={true}/>
                           {isUploading && (
                                <div className="md:col-span-2">
                                    <Progress value={uploadProgress} className="w-full" />
                                    <p className="text-sm text-center mt-1 text-muted-foreground">Subiendo...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="card-border-animated">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Paintbrush className="h-5 w-5 text-primary"/>Paleta de Colores</CardTitle>
                            <CardDescription>Personaliza los colores principales de la plataforma.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Tema Claro</Label>
                                    <div className="p-4 border rounded-lg mt-2 space-y-3">
                                        <div className="flex items-center justify-between"><Label htmlFor="primaryColor">Primario</Label><Input id="primaryColor" type="color" value={formState.primaryColor || '#000000'} onChange={(e) => handleInputChange('primaryColor', e.target.value)} className="w-20 p-1" /></div>
                                        <div className="flex items-center justify-between"><Label htmlFor="secondaryColor">Secundario</Label><Input id="secondaryColor" type="color" value={formState.secondaryColor || '#000000'} onChange={(e) => handleInputChange('secondaryColor', e.target.value)} className="w-20 p-1" /></div>
                                        <div className="flex items-center justify-between"><Label htmlFor="accentColor">Acento</Label><Input id="accentColor" type="color" value={formState.accentColor || '#000000'} onChange={(e) => handleInputChange('accentColor', e.target.value)} className="w-20 p-1" /></div>
                                        <div className="flex items-center justify-between"><Label htmlFor="backgroundColorLight">Fondo</Label><Input id="backgroundColorLight" type="color" value={formState.backgroundColorLight || '#FFFFFF'} onChange={(e) => handleInputChange('backgroundColorLight', e.target.value)} className="w-20 p-1" /></div>
                                    </div>
                                </div>
                                <div>
                                    <Label>Tema Oscuro</Label>
                                     <div className="p-4 border rounded-lg mt-2 space-y-3">
                                        <div className="flex items-center justify-between"><Label htmlFor="primaryColorDark">Primario</Label><Input id="primaryColorDark" type="color" value={formState.primaryColorDark || '#FFFFFF'} onChange={(e) => handleInputChange('primaryColorDark', e.target.value)} className="w-20 p-1" /></div>
                                        <div className="flex items-center justify-between"><Label htmlFor="backgroundColorDark">Fondo</Label><Input id="backgroundColorDark" type="color" value={formState.backgroundColorDark || '#000000'} onChange={(e) => handleInputChange('backgroundColorDark', e.target.value)} className="w-20 p-1" /></div>
                                    </div>
                                </div>
                           </div>
                        </CardContent>
                    </Card>
                    <Card className="card-border-animated">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Type className="h-5 w-5 text-primary"/>Tipografía</CardTitle>
                            <CardDescription>Elige las fuentes para los títulos y el texto de la plataforma.</CardDescription>
                        </CardHeader>
                         <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fontHeadline">Fuente de Títulos</Label>
                                 <Select value={formState.fontHeadline || 'Space Grotesk'} onValueChange={(value) => handleInputChange('fontHeadline', value)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>{availableFonts.map(f => <SelectItem key={f.value} value={f.value} style={{ fontFamily: (fontMap[f.value] as any)?.style.fontFamily }}>{f.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fontBody">Fuente de Párrafos</Label>
                                 <Select value={formState.fontBody || 'Inter'} onValueChange={(value) => handleInputChange('fontBody', value)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>{availableFonts.map(f => <SelectItem key={f.value} value={f.value} style={{ fontFamily: (fontMap[f.value] as any)?.style.fontFamily }}>{f.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="security" className="space-y-8 mt-6">
                    <Card className="card-border-animated">
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary"/>Seguridad y Acceso</CardTitle>
                        <CardDescription>Gestiona las políticas de seguridad y registro.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label htmlFor="allowPublicRegistration" className="text-base">Registro Público</Label>
                                    <p className="text-sm text-muted-foreground">Controla si los usuarios pueden crear sus propias cuentas.</p>
                                </div>
                                <Switch 
                                    id="allowPublicRegistration" 
                                    checked={formState.allowPublicRegistration}
                                    onCheckedChange={(checked) => handleSwitchChange('allowPublicRegistration', checked)}
                                    disabled={isSaving}
                                />
                            </div>
                            <Separator/>
                            <div>
                                <h4 className="font-medium mb-3">Política de Contraseñas</h4>
                                <div className="space-y-4 p-3 border rounded-lg shadow-sm">
                                    <div className="flex items-center justify-between"><Label htmlFor="passwordMinLength">Longitud Mínima</Label><Input id="passwordMinLength" type="number" className="w-24" value={formState.passwordMinLength} onChange={(e) => handleInputChange('passwordMinLength', parseInt(e.target.value, 10) || 8)} min="8" disabled={isSaving} /></div>
                                    <div className="flex items-center justify-between"><Label htmlFor="passwordRequireUppercase">Requerir Mayúscula</Label><Switch id="passwordRequireUppercase" checked={formState.passwordRequireUppercase} onCheckedChange={(c) => handleSwitchChange('passwordRequireUppercase', c)} disabled={isSaving} /></div>
                                    <div className="flex items-center justify-between"><Label htmlFor="passwordRequireLowercase">Requerir Minúscula</Label><Switch id="passwordRequireLowercase" checked={formState.passwordRequireLowercase} onCheckedChange={(c) => handleSwitchChange('passwordRequireLowercase', c)} disabled={isSaving} /></div>
                                    <div className="flex items-center justify-between"><Label htmlFor="passwordRequireNumber">Requerir Número</Label><Switch id="passwordRequireNumber" checked={formState.passwordRequireNumber} onCheckedChange={(c) => handleSwitchChange('passwordRequireNumber', c)} disabled={isSaving} /></div>
                                    <div className="flex items-center justify-between"><Label htmlFor="passwordRequireSpecialChar">Requerir Carácter Especial</Label><Switch id="passwordRequireSpecialChar" checked={formState.passwordRequireSpecialChar} onCheckedChange={(c) => handleSwitchChange('passwordRequireSpecialChar', c)} disabled={isSaving} /></div>
                                </div>
                            </div>
                            <Separator/>
                             <div>
                                <h4 className="font-medium mb-3">Cierre de Sesión por Inactividad</h4>
                                <div className="space-y-4 p-3 border rounded-lg shadow-sm">
                                    <div className="flex items-center justify-between gap-4"><div className="space-y-0.5"><Label htmlFor="enableIdleTimeout" className="text-base">Habilitar Cierre por Inactividad</Label><p className="text-sm text-muted-foreground">Cierra la sesión del usuario tras un período de inactividad.</p></div><Switch id="enableIdleTimeout" checked={formState.enableIdleTimeout} onCheckedChange={(c) => handleSwitchChange('enableIdleTimeout', c)} disabled={isSaving} /></div>
                                    {formState.enableIdleTimeout && (
                                        <div className="flex items-center justify-between"><Label htmlFor="idleTimeoutMinutes">Tiempo de Inactividad (Minutos)</Label><Input id="idleTimeoutMinutes" type="number" className="w-24" value={formState.idleTimeoutMinutes} onChange={(e) => handleInputChange('idleTimeoutMinutes', parseInt(e.target.value, 10) || 1)} min="1" disabled={isSaving}/></div>
                                    )}
                                </div>
                            </div>
                            <Separator/>
                            <div>
                                <h4 className="font-medium mb-3">Autenticación de Dos Factores (2FA)</h4>
                                <div className="space-y-4 p-3 border rounded-lg shadow-sm">
                                    <div className="flex items-center justify-between gap-4"><div className="space-y-0.5"><Label htmlFor="require2faForAdmins" className="text-base">Requerir 2FA para Admins</Label><p className="text-sm text-muted-foreground">Forzar la activación de 2FA para todos los roles de Administrador.</p></div><Switch id="require2faForAdmins" checked={formState.require2faForAdmins} onCheckedChange={(c) => handleSwitchChange('require2faForAdmins', c)} disabled={isSaving} /></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="general" className="space-y-8 mt-6">
                    <Card className="card-border-animated">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><List className="h-5 w-5 text-primary" />Categorías de Recursos</CardTitle>
                            <CardDescription>Gestiona las categorías usadas en cursos y la biblioteca.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newCategoryName">Nueva Categoría</Label>
                                <div className="flex gap-2">
                                <Input id="newCategoryName" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Ej: Marketing" disabled={isSaving}/>
                                <Button onClick={handleAddCategory} disabled={isSaving || !newCategory.trim()}>Añadir</Button>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="text-sm font-medium mb-3">Categorías Existentes:</h4>
                                {formState.resourceCategories.length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {formState.resourceCategories.map(category => (
                                    <div key={category} className="flex items-center justify-between p-2.5 border rounded-lg bg-card text-sm">
                                        <span className="flex items-center gap-2"><Tag className="h-4 w-4 text-muted-foreground"/>{category}</span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => setCategoryToDelete(category)} disabled={isSaving}><Trash2 className="h-4 w-4" /><span className="sr-only">Eliminar {category}</span></Button>
                                    </div>))}
                                </div>
                                ) : ( <p className="text-sm text-muted-foreground text-center py-4">No hay categorías.</p> )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                       <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary"/>Gestión de Usuarios</CardTitle>
                            <CardDescription>Configuración relacionada con los usuarios y el registro.</CardDescription>
                       </CardHeader>
                       <CardContent>
                            <div className="space-y-2">
                               <Label htmlFor="emailWhitelist">Lista Blanca de Correos</Label>
                               <Textarea 
                                   id="emailWhitelist" 
                                   value={formState.emailWhitelist || ''} 
                                   onChange={e => handleInputChange('emailWhitelist', e.target.value)}
                                   placeholder="ejemplo.com, empresa.com"
                                   rows={3}
                                   disabled={isSaving}
                               />
                               <p className="text-xs text-muted-foreground">Si se especifica, solo se permitirán correos de estos dominios. Deja en blanco para permitir todos. Separa los dominios con comas.</p>
                           </div>
                       </CardContent>
                    </Card>
                 </TabsContent>
            </Tabs>
        </div>
        <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
            <ThemePreview settings={formState} />
            <Card className="card-border-animated">
                <CardHeader><CardTitle>Guardar Cambios</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Asegúrate de que todas las configuraciones son correctas antes de guardar.</p>
                    <Button className="w-full" onClick={handleSaveSettings} disabled={isSaving || isLoading}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
       <ImageCropper
            imageSrc={imageToCrop}
            onCropComplete={handleCropComplete}
            onClose={() => { setImageToCrop(null); setCropField(null); }}
            uploadUrl={cropUploadUrl}
        />
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle><AlertDialogDescription>Se verificará si la categoría "<strong>{categoryToDelete}</strong>" está en uso. Si no lo está, se eliminará de la lista (deberás guardar los cambios para confirmar). Si está en uso, se te notificará.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"><AlertDialogCancel disabled={isCheckingCategory}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteCategory} disabled={isCheckingCategory} className={buttonVariants({ variant: "destructive" })}>{isCheckingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Sí, eliminar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
