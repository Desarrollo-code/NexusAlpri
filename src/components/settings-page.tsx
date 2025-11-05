// src/components/settings-page.tsx
'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Palette, Bell, Shield, List, Tag, Trash2, Loader2, FileWarning, KeyRound, Clock, Save, ImageIcon, Paintbrush, Type, User, UploadCloud, XCircle, Replace, HelpCircle, ImagePlay, Building, FolderOpen } from 'lucide-react';
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
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '@/components/ui/progress';
import { useTour } from '@/contexts/tour-context';
import { settingsTour } from '@/lib/tour-steps';
import { UploadArea } from '@/components/ui/upload-area';

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
  id,
  currentImageUrl,
  onFileSelect,
  onRemove,
  disabled,
  isUploading,
  uploadProgress
}: {
  label: string;
  id: string;
  currentImageUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  onRemove: () => void;
  disabled: boolean;
  isUploading: boolean;
  uploadProgress: number;
}) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative w-40 h-32">
        <UploadArea onFileSelect={onFileSelect} disabled={disabled || isUploading} inputId={id} className="h-full w-full">
          {currentImageUrl && !isUploading ? (
            <div className="relative w-full h-full group">
              <Image src={currentImageUrl} alt={`Previsualización de ${label}`} fill className="object-contain p-2 rounded-lg" />
            </div>
          ) : null}
        </UploadArea>

        {currentImageUrl && !isUploading && (
           <div className="absolute top-1 right-1 z-10 flex gap-1">
             <Button type="button" variant="secondary" size="icon" className="h-7 w-7 rounded-full shadow-md" onClick={() => document.getElementById(id)?.click()} disabled={disabled}>
               <Replace className="h-4 w-4" />
               <span className="sr-only">Reemplazar imagen</span>
             </Button>
             <Button type="button" variant="destructive" size="icon" className="h-7 w-7 rounded-full shadow-md" onClick={onRemove} disabled={disabled}>
               <XCircle className="h-4 w-4" />
               <span className="sr-only">Eliminar imagen</span>
             </Button>
           </div>
        )}
         {isUploading && (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg bg-muted/80 p-2">
                 <Loader2 className="h-6 w-6 animate-spin text-primary" />
                 <p className="text-xs text-muted-foreground">Subiendo...</p>
                 <Progress value={uploadProgress} className="w-24 h-1.5" />
            </div>
         )}
      </div>
    </div>
  );
};


export default function SettingsPageComponent() {
  const { user, settings: globalSettings, updateSettings } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { setPageTitle } = useTitle();
  const { startTour, forceStartTour } = useTour();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formState, setFormState] = useState<AppPlatformSettings | null>(null);
  const [newCategory, setNewCategory] = useState('');
  
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isCheckingCategory, setIsCheckingCategory] = useState(false);
  
  type ImageField = 'logoUrl' | 'watermarkUrl' | 'landingImageUrl' | 'authImageUrl' | 'aboutImageUrl' | 'benefitsImageUrl' | 'announcementsImageUrl' | 'publicPagesBgUrl' | 'securityMascotUrl' | 'emptyStateCoursesUrl' | 'emptyStateMyCoursesUrl' | 'emptyStateFormsUrl' | 'emptyStateMyNotesUrl' | 'emptyStateResourcesUrl' | 'emptyStateCertificatesUrl' | 'emptyStateMotivationsUrl' | 'emptyStateUsersUrl' | 'emptyStateLeaderboardUrl';

  const [uploadStates, setUploadStates] = useState<Record<ImageField, { isUploading: boolean, progress: number }>>({
    logoUrl: { isUploading: false, progress: 0 },
    watermarkUrl: { isUploading: false, progress: 0 },
    landingImageUrl: { isUploading: false, progress: 0 },
    authImageUrl: { isUploading: false, progress: 0 },
    aboutImageUrl: { isUploading: false, progress: 0 },
    benefitsImageUrl: { isUploading: false, progress: 0 },
    announcementsImageUrl: { isUploading: false, progress: 0 },
    publicPagesBgUrl: { isUploading: false, progress: 0 },
    securityMascotUrl: { isUploading: false, progress: 0 },
    emptyStateCoursesUrl: { isUploading: false, progress: 0 },
    emptyStateMyCoursesUrl: { isUploading: false, progress: 0 },
    emptyStateFormsUrl: { isUploading: false, progress: 0 },
    emptyStateMyNotesUrl: { isUploading: false, progress: 0 },
    emptyStateResourcesUrl: { isUploading: false, progress: 0 },
    emptyStateCertificatesUrl: { isUploading: false, progress: 0 },
    emptyStateMotivationsUrl: { isUploading: false, progress: 0 },
    emptyStateUsersUrl: { isUploading: false, progress: 0 },
    emptyStateLeaderboardUrl: { isUploading: false, progress: 0 },
  });


  useEffect(() => {
    setPageTitle('Configuración');
    startTour('settings', settingsTour);
  }, [setPageTitle, startTour]);

  useEffect(() => {
    if (globalSettings) {
      const settingsWithDefaults = {
        ...globalSettings,
      };
      setFormState(settingsWithDefaults);
      setIsLoading(false);
    }
  }, [globalSettings]);
  
  const handleInputChange = (field: keyof AppPlatformSettings, value: any) => {
    setFormState(prev => prev ? { ...prev, [field]: value } : null);
  };
  
  const handleSwitchChange = (field: keyof AppPlatformSettings, checked: boolean) => {
    setFormState(prev => prev ? { ...prev, [field]: checked } : null);
  };
  
  const handleImageUpload = useCallback(async (field: ImageField, file: File | null) => {
      if (!file) return;
      setUploadStates(prev => ({ ...prev, [field]: { isUploading: true, progress: 0 }}));
      
      try {
          const result = await uploadWithProgress('/api/upload/settings-image', file, (progress) => {
             setUploadStates(prev => ({ ...prev, [field]: { ...prev[field], progress }}));
          });
          handleInputChange(field, result.url);
          toast({ title: "Imagen Subida", description: "La imagen se ha subido correctamente."});
      } catch (err) {
          toast({ title: 'Error de Subida', description: (err as Error).message, variant: 'destructive' });
      } finally {
          setUploadStates(prev => ({ ...prev, [field]: { isUploading: false, progress: 0 }}));
      }
  }, [toast]);

  const handleRemoveImage = (field: ImageField) => {
      handleInputChange(field, null);
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
            <div className="space-y-6">
                <Skeleton className="h-12 w-full max-w-md" />
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    );
  }

  if (!user || user.role !== 'ADMINISTRATOR') {
    if (typeof window !== 'undefined') router.push('/dashboard');
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>;
  }
  
  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
                <h2 className="text-2xl font-semibold">Configuración</h2>
                <p className="text-muted-foreground">Ajusta los parámetros generales, de seguridad y apariencia de NexusAlpri.</p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => forceStartTour('settings', settingsTour)}>
                    <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
                </Button>
                <Button onClick={handleSaveSettings} disabled={isSaving || isLoading} size="sm">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
            </div>
        </div>

        <Tabs defaultValue="appearance" className="w-full">
            <TabsList id="settings-tabs-list" className="inline-grid w-full grid-cols-2 md:grid-cols-4 h-auto bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
                <TabsTrigger value="appearance">Identidad y Apariencia</TabsTrigger>
                <TabsTrigger value="style">Tema y Estilo</TabsTrigger>
                <TabsTrigger value="security">Seguridad</TabsTrigger>
                <TabsTrigger value="general">Generales</TabsTrigger>
            </TabsList>
            
            <TabsContent value="appearance" className="mt-6">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <Card className="card-border-animated lg:col-span-1" id="settings-identity-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5 text-primary"/>Identidad y Marca</CardTitle>
                            <CardDescription>Nombre de la plataforma, logo y marca de agua.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                           <div className="space-y-2">
                               <Label htmlFor="platformName">Nombre de la Plataforma</Label>
                               <Input id="platformName" value={formState.platformName} onChange={(e) => handleInputChange('platformName', e.target.value)} disabled={isSaving} placeholder="Nombre de tu plataforma" />
                           </div>
                           <div className="space-y-2">
                               <Label htmlFor="projectVersion">Versión del Proyecto</Label>
                               <Input id="projectVersion" value={formState.projectVersion || ''} onChange={(e) => handleInputChange('projectVersion', e.target.value)} disabled={isSaving} placeholder="Ej: 1.0.0" />
                           </div>
                           <Separator/>
                           <div className="grid grid-cols-2 gap-6 place-items-center md:place-items-start">
                               <UploadWidget id="logo-upload" label="Logo (PNG/SVG)" currentImageUrl={formState.logoUrl} onFileSelect={(file) => handleImageUpload('logoUrl', file)} onRemove={() => handleRemoveImage('logoUrl')} disabled={isSaving} isUploading={uploadStates.logoUrl.isUploading} uploadProgress={uploadStates.logoUrl.progress} />
                               <UploadWidget id="watermark-upload" label="Marca de Agua (PNG)" currentImageUrl={formState.watermarkUrl} onFileSelect={(file) => handleImageUpload('watermarkUrl', file)} onRemove={() => handleRemoveImage('watermarkUrl')} disabled={isSaving} isUploading={uploadStates.watermarkUrl.isUploading} uploadProgress={uploadStates.watermarkUrl.progress} />
                           </div>
                        </CardContent>
                    </Card>
                     <Card className="card-border-animated lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary"/>Imágenes Públicas y del Sistema</CardTitle>
                            <CardDescription>Define las imágenes para las páginas públicas y elementos del sistema.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Tabs defaultValue="public">
                             <TabsList className="grid w-full grid-cols-2">
                               <TabsTrigger value="public">Públicas</TabsTrigger>
                               <TabsTrigger value="system">Sistema</TabsTrigger>
                             </TabsList>
                             <TabsContent value="public" className="mt-4">
                               <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 place-items-center md:place-items-start">
                                  <UploadWidget id="landing-img-upload" label="Página de Inicio" currentImageUrl={formState.landingImageUrl} onFileSelect={(f) => f && handleImageUpload('landingImageUrl', f)} onRemove={()=>handleRemoveImage('landingImageUrl')} disabled={isSaving} isUploading={uploadStates.landingImageUrl.isUploading} uploadProgress={uploadStates.landingImageUrl.progress}/>
                                  <UploadWidget id="about-img-upload" label="Página 'Nosotros'" currentImageUrl={formState.aboutImageUrl} onFileSelect={(f) => f && handleImageUpload('aboutImageUrl', f)} onRemove={()=>handleRemoveImage('aboutImageUrl')} disabled={isSaving} isUploading={uploadStates.aboutImageUrl.isUploading} uploadProgress={uploadStates.aboutImageUrl.progress}/>
                                  <UploadWidget id="benefits-img-upload" label="Beneficios (Inicio)" currentImageUrl={formState.benefitsImageUrl} onFileSelect={(f) => f && handleImageUpload('benefitsImageUrl', f)} onRemove={()=>handleRemoveImage('benefitsImageUrl')} disabled={isSaving} isUploading={uploadStates.benefitsImageUrl.isUploading} uploadProgress={uploadStates.benefitsImageUrl.progress}/>
                                  <UploadWidget id="public-bg-upload" label="Fondo Páginas Públicas" currentImageUrl={formState.publicPagesBgUrl} onFileSelect={(f) => f && handleImageUpload('publicPagesBgUrl', f)} onRemove={()=>handleRemoveImage('publicPagesBgUrl')} disabled={isSaving} isUploading={uploadStates.publicPagesBgUrl.isUploading} uploadProgress={uploadStates.publicPagesBgUrl.progress}/>
                                  <UploadWidget id="auth-img-upload" label="Página de Acceso" currentImageUrl={formState.authImageUrl} onFileSelect={(f) => f && handleImageUpload('authImageUrl', f)} onRemove={()=>handleRemoveImage('authImageUrl')} disabled={isSaving} isUploading={uploadStates.authImageUrl.isUploading} uploadProgress={uploadStates.authImageUrl.progress}/>
                               </div>
                             </TabsContent>
                             <TabsContent value="system" className="mt-4">
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 place-items-center md:place-items-start">
                                    <UploadWidget id="announce-bg-upload" label="Fondo Anuncios" currentImageUrl={formState.announcementsImageUrl} onFileSelect={(f) => f && handleImageUpload('announcementsImageUrl', f)} onRemove={()=>handleRemoveImage('announcementsImageUrl')} disabled={isSaving} isUploading={uploadStates.announcementsImageUrl.isUploading} uploadProgress={uploadStates.announcementsImageUrl.progress}/>
                                    <UploadWidget id="security-mascot-upload" label="Mascota de Seguridad" currentImageUrl={formState.securityMascotUrl} onFileSelect={(f) => f && handleImageUpload('securityMascotUrl', f)} onRemove={()=>handleRemoveImage('securityMascotUrl')} disabled={isSaving} isUploading={uploadStates.securityMascotUrl.isUploading} uploadProgress={uploadStates.securityMascotUrl.progress}/>
                               </div>
                             </TabsContent>
                           </Tabs>
                        </CardContent>
                    </Card>
                 </div>
                 <Card className="card-border-animated" id="settings-empty-states-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FolderOpen className="h-5 w-5 text-primary"/>Imágenes de Estado Vacío</CardTitle>
                        <CardDescription>Personaliza las imágenes que se muestran cuando no hay contenido en una sección.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 place-items-center md:place-items-start">
                        <UploadWidget id="es-courses-upload" label="Catálogo Cursos" currentImageUrl={formState.emptyStateCoursesUrl} onFileSelect={(f) => f && handleImageUpload('emptyStateCoursesUrl', f)} onRemove={()=>handleRemoveImage('emptyStateCoursesUrl')} disabled={isSaving} isUploading={uploadStates.emptyStateCoursesUrl.isUploading} uploadProgress={uploadStates.emptyStateCoursesUrl.progress}/>
                        <UploadWidget id="es-mycourses-upload" label="Mis Cursos" currentImageUrl={formState.emptyStateMyCoursesUrl} onFileSelect={(f) => f && handleImageUpload('emptyStateMyCoursesUrl', f)} onRemove={()=>handleRemoveImage('emptyStateMyCoursesUrl')} disabled={isSaving} isUploading={uploadStates.emptyStateMyCoursesUrl.isUploading} uploadProgress={uploadStates.emptyStateMyCoursesUrl.progress}/>
                        <UploadWidget id="es-forms-upload" label="Formularios" currentImageUrl={formState.emptyStateFormsUrl} onFileSelect={(f) => f && handleImageUpload('emptyStateFormsUrl', f)} onRemove={()=>handleRemoveImage('emptyStateFormsUrl')} disabled={isSaving} isUploading={uploadStates.emptyStateFormsUrl.isUploading} uploadProgress={uploadStates.emptyStateFormsUrl.progress}/>
                        <UploadWidget id="es-mynotes-upload" label="Mis Apuntes" currentImageUrl={formState.emptyStateMyNotesUrl} onFileSelect={(f) => f && handleImageUpload('emptyStateMyNotesUrl', f)} onRemove={()=>handleRemoveImage('emptyStateMyNotesUrl')} disabled={isSaving} isUploading={uploadStates.emptyStateMyNotesUrl.isUploading} uploadProgress={uploadStates.emptyStateMyNotesUrl.progress}/>
                        <UploadWidget id="es-resources-upload" label="Recursos" currentImageUrl={formState.emptyStateResourcesUrl} onFileSelect={(f) => f && handleImageUpload('emptyStateResourcesUrl', f)} onRemove={()=>handleRemoveImage('emptyStateResourcesUrl')} disabled={isSaving} isUploading={uploadStates.emptyStateResourcesUrl.isUploading} uploadProgress={uploadStates.emptyStateResourcesUrl.progress}/>
                        <UploadWidget id="es-certs-upload" label="Certificados" currentImageUrl={formState.emptyStateCertificatesUrl} onFileSelect={(f) => f && handleImageUpload('emptyStateCertificatesUrl', f)} onRemove={()=>handleRemoveImage('emptyStateCertificatesUrl')} disabled={isSaving} isUploading={uploadStates.emptyStateCertificatesUrl.isUploading} uploadProgress={uploadStates.emptyStateCertificatesUrl.progress}/>
                        <UploadWidget id="es-motivations-upload" label="Motivaciones" currentImageUrl={formState.emptyStateMotivationsUrl} onFileSelect={(f) => f && handleImageUpload('emptyStateMotivationsUrl', f)} onRemove={()=>handleRemoveImage('emptyStateMotivationsUrl')} disabled={isSaving} isUploading={uploadStates.emptyStateMotivationsUrl.isUploading} uploadProgress={uploadStates.emptyStateMotivationsUrl.progress}/>
                        <UploadWidget id="es-users-upload" label="Control Central" currentImageUrl={formState.emptyStateUsersUrl} onFileSelect={(f) => f && handleImageUpload('emptyStateUsersUrl', f)} onRemove={()=>handleRemoveImage('emptyStateUsersUrl')} disabled={isSaving} isUploading={uploadStates.emptyStateUsersUrl.isUploading} uploadProgress={uploadStates.emptyStateUsersUrl.progress}/>
                        <UploadWidget id="es-leaderboard-upload" label="Ranking" currentImageUrl={formState.emptyStateLeaderboardUrl} onFileSelect={(f) => f && handleImageUpload('emptyStateLeaderboardUrl', f)} onRemove={()=>handleRemoveImage('emptyStateLeaderboardUrl')} disabled={isSaving} isUploading={uploadStates.emptyStateLeaderboardUrl.isUploading} uploadProgress={uploadStates.emptyStateLeaderboardUrl.progress}/>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="style" className="mt-6 space-y-6">
                <Card className="card-border-animated">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Paintbrush className="h-5 w-5 text-primary"/>Paleta de Colores</CardTitle>
                        <CardDescription>Personaliza los colores principales de la plataforma.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Tema Claro</Label>
                            <div className="p-4 border rounded-lg mt-2 space-y-3">
                                <div className="flex items-center justify-between"><Label htmlFor="primaryColor">Primario</Label><Input id="primaryColor" type="color" value={formState.primaryColor || '#000000'} onChange={(e) => handleInputChange('primaryColor', e.target.value)} className="w-20 p-1 h-10" /></div>
                                <div className="flex items-center justify-between"><Label htmlFor="secondaryColor">Secundario</Label><Input id="secondaryColor" type="color" value={formState.secondaryColor || '#000000'} onChange={(e) => handleInputChange('secondaryColor', e.target.value)} className="w-20 p-1 h-10" /></div>
                                <div className="flex items-center justify-between"><Label htmlFor="accentColor">Acento</Label><Input id="accentColor" type="color" value={formState.accentColor || '#000000'} onChange={(e) => handleInputChange('accentColor', e.target.value)} className="w-20 p-1 h-10" /></div>
                                <div className="flex items-center justify-between"><Label htmlFor="backgroundColorLight">Fondo</Label><Input id="backgroundColorLight" type="color" value={formState.backgroundColorLight || '#FFFFFF'} onChange={(e) => handleInputChange('backgroundColorLight', e.target.value)} className="w-20 p-1 h-10" /></div>
                            </div>
                        </div>
                        <div>
                            <Label>Tema Oscuro</Label>
                             <div className="p-4 border rounded-lg mt-2 space-y-3">
                                <div className="flex items-center justify-between"><Label htmlFor="primaryColorDark">Primario</Label><Input id="primaryColorDark" type="color" value={formState.primaryColorDark || '#FFFFFF'} onChange={(e) => handleInputChange('primaryColorDark', e.target.value)} className="w-20 p-1 h-10" /></div>
                                <div className="flex items-center justify-between"><Label htmlFor="backgroundColorDark">Fondo</Label><Input id="backgroundColorDark" type="color" value={formState.backgroundColorDark || '#000000'} onChange={(e) => handleInputChange('backgroundColorDark', e.target.value)} className="w-20 p-1 h-10" /></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-border-animated">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Type className="h-5 w-5 text-primary"/>Tipografía</CardTitle>
                        <CardDescription>Elige las fuentes para los títulos y el texto del cuerpo.</CardDescription>
                    </CardHeader>
                     <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fontHeadline">Fuente de Títulos</Label>
                             <Select value={formState.fontHeadline || 'Space Grotesk'} onValueChange={(value) => handleInputChange('fontHeadline', value)}>
                                <SelectTrigger id="fontHeadline"><SelectValue/></SelectTrigger>
                                <SelectContent>{availableFonts.map(f => <SelectItem key={f.value} value={f.value} style={{ fontFamily: (fontMap[f.value] as any)?.style.fontFamily }}>{f.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fontBody">Fuente de Párrafos</Label>
                             <Select value={formState.fontBody || 'Inter'} onValueChange={(value) => handleInputChange('fontBody', value)}>
                                <SelectTrigger id="fontBody"><SelectValue/></SelectTrigger>
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
                         <div className="space-y-2 rounded-lg border p-3 shadow-sm">
                            <Label htmlFor="emailWhitelist">Lista Blanca de Dominios</Label>
                            <Input
                                id="emailWhitelist"
                                value={formState.emailWhitelist || ''}
                                onChange={(e) => handleInputChange('emailWhitelist', e.target.value)}
                                placeholder="ej: alprigrama.com, ejemplo.org"
                                disabled={isSaving}
                            />
                            <p className="text-sm text-muted-foreground">
                                Si se completa, solo los correos que terminen con estos dominios podrán registrarse. Déjalo en blanco para permitir cualquier correo. Separa los dominios con comas.
                            </p>
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
                                <div className="flex items-center justify-between gap-4"><div className="space-y-0.5"><Label htmlFor="require2faForAdmins" className="text-base">Requerir 2FA para Administradores</Label><p className="text-sm text-muted-foreground">Forzar la activación de 2FA para todos los roles de Administrador.</p></div><Switch id="require2faForAdmins" checked={formState.require2faForAdmins} onCheckedChange={(c) => handleSwitchChange('require2faForAdmins', c)} disabled={isSaving} /></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="general" className="mt-6">
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
             </TabsContent>
        </Tabs>

        <AlertDialog open={!!categoryToDelete} onOpenChange={(isOpen) => { if (!isOpen) setCategoryToDelete(null); }}>
          <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle><AlertDialogDescription>Se verificará si la categoría "<strong>{categoryToDelete}</strong>" está en uso. Si no lo está, se eliminará de la lista (deberás guardar los cambios para confirmar). Si está en uso, se te notificará.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"><AlertDialogCancel disabled={isCheckingCategory}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteCategory} disabled={isCheckingCategory} className={buttonVariants({ variant: "destructive" })}>{isCheckingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Sí, eliminar</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
