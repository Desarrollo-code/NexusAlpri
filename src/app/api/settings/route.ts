// src/app/api/settings/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { PlatformSettings as AppPlatformSettings } from '@/types';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_DB_SETTINGS = {
  platformName: "NexusAlpri",
  allowPublicRegistration: true,
  enableEmailNotifications: true,
  emailWhitelist: "alprigrama.com",
  resourceCategories: "Recursos Humanos,TI y Seguridad,Marketing,Ventas,Legal,Operaciones,Finanzas,Formación Interna,Documentación de Producto,General",
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumber: true,
  passwordRequireSpecialChar: false,
  enableIdleTimeout: true,
  idleTimeoutMinutes: 20,
  require2faForAdmins: false,
  primaryColor: '#6366f1',
  secondaryColor: '#a5b4fc',
  accentColor: '#ec4899',
  backgroundColorLight: '#f8fafc',
  primaryColorDark: '#a5b4fc',
  backgroundColorDark: '#020617',
  logoUrl: null,
  watermarkUrl: null,
  landingImageUrl: null,
  authImageUrl: null,
  aboutImageUrl: null,
  benefitsImageUrl: null,
  announcementsImageUrl: null,
  publicPagesBgUrl: null,
  securityMascotUrl: null,
  fontHeadline: 'Space Grotesk',
  fontBody: 'Inter',
  emptyStateCoursesUrl: null,
  emptyStateMyCoursesUrl: null,
  emptyStateFormsUrl: null,
  emptyStateMyNotesUrl: null,
  emptyStateResourcesUrl: null,
};

const getFallbackSettings = (): AppPlatformSettings => {
    return {
        ...DEFAULT_DB_SETTINGS,
        resourceCategories: DEFAULT_DB_SETTINGS.resourceCategories.split(','),
        emailWhitelist: DEFAULT_DB_SETTINGS.emailWhitelist || '',
    };
};

// GET /api/settings - Fetches platform settings
export async function GET(req: NextRequest) {
  try {
    let dbSettings = await prisma.platformSettings.findFirst();

    if (!dbSettings) {
      dbSettings = await prisma.platformSettings.create({
        data: {
            ...DEFAULT_DB_SETTINGS,
            id: 'cl-nexus-settings-default' // Ensure a default ID
        },
      });
    }
    
    const settingsToReturn: AppPlatformSettings = {
        ...DEFAULT_DB_SETTINGS,
        ...dbSettings,
        resourceCategories: dbSettings.resourceCategories ? dbSettings.resourceCategories.split(',').filter(Boolean) : [],
        emailWhitelist: dbSettings.emailWhitelist || '',
    };
    
    return NextResponse.json(settingsToReturn);

  } catch (error) {
    console.error('[SETTINGS_GET_ERROR]', error);
    const fallbackSettings = getFallbackSettings();
    return NextResponse.json(fallbackSettings);
  }
}

// POST /api/settings - Updates platform settings
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const dataFromClient: Partial<AppPlatformSettings> = await req.json();
    
    const safeParseInt = (value: any, defaultValue: number): number => {
        if (value === null || value === undefined || value === '') return defaultValue;
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
    };
    
    const dataToSave = {
      platformName: dataFromClient.platformName,
      allowPublicRegistration: dataFromClient.allowPublicRegistration,
      enableEmailNotifications: dataFromClient.enableEmailNotifications,
      emailWhitelist: dataFromClient.emailWhitelist,
      resourceCategories: Array.isArray(dataFromClient.resourceCategories) ? dataFromClient.resourceCategories.join(',') : dataFromClient.resourceCategories,
      passwordMinLength: safeParseInt(dataFromClient.passwordMinLength, 8),
      passwordRequireUppercase: dataFromClient.passwordRequireUppercase,
      passwordRequireLowercase: dataFromClient.passwordRequireLowercase,
      passwordRequireNumber: dataFromClient.passwordRequireNumber,
      passwordRequireSpecialChar: dataFromClient.passwordRequireSpecialChar,
      enableIdleTimeout: dataFromClient.enableIdleTimeout,
      idleTimeoutMinutes: safeParseInt(dataFromClient.idleTimeoutMinutes, 20),
      require2faForAdmins: dataFromClient.require2faForAdmins,
      primaryColor: dataFromClient.primaryColor,
      secondaryColor: dataFromClient.secondaryColor,
      accentColor: dataFromClient.accentColor,
      backgroundColorLight: dataFromClient.backgroundColorLight,
      primaryColorDark: dataFromClient.primaryColorDark,
      backgroundColorDark: dataFromClient.backgroundColorDark,
      logoUrl: dataFromClient.logoUrl,
      watermarkUrl: dataFromClient.watermarkUrl,
      landingImageUrl: dataFromClient.landingImageUrl,
      authImageUrl: dataFromClient.authImageUrl,
      aboutImageUrl: dataFromClient.aboutImageUrl,
      benefitsImageUrl: dataFromClient.benefitsImageUrl,
      announcementsImageUrl: dataFromClient.announcementsImageUrl,
      publicPagesBgUrl: dataFromClient.publicPagesBgUrl,
      securityMascotUrl: dataFromClient.securityMascotUrl,
      fontHeadline: dataFromClient.fontHeadline,
      fontBody: dataFromClient.fontBody,
      emptyStateCoursesUrl: dataFromClient.emptyStateCoursesUrl,
      emptyStateMyCoursesUrl: dataFromClient.emptyStateMyCoursesUrl,
      emptyStateFormsUrl: dataFromClient.emptyStateFormsUrl,
      emptyStateMyNotesUrl: dataFromClient.emptyStateMyNotesUrl,
      emptyStateResourcesUrl: dataFromClient.emptyStateResourcesUrl,
    };
    
    const currentSettings = await prisma.platformSettings.findFirst();
    
    if (currentSettings && currentSettings.resourceCategories && dataToSave.resourceCategories) {
        const oldCategories = currentSettings.resourceCategories.split(',').filter(Boolean);
        const newCategories = dataToSave.resourceCategories.split(',').filter(Boolean);
        const deletedCategories = oldCategories.filter(cat => !newCategories.includes(cat));

        if (deletedCategories.length > 0) {
            for (const category of deletedCategories) {
                const courseCount = await prisma.course.count({ where: { category } });
                const resourceCount = await prisma.enterpriseResource.count({ where: { category } });
                const totalUsage = courseCount + resourceCount;
                if (totalUsage > 0) {
                    return NextResponse.json({
                        message: `No se puede eliminar la categoría "${category}" porque está siendo utilizada por ${totalUsage} curso(s) o recurso(s).`,
                    }, { status: 409 });
                }
            }
        }
    }

    const updatedDbSettings = await prisma.platformSettings.upsert({
      where: { id: currentSettings?.id || 'non-existent-id-for-upsert' },
      update: dataToSave,
      create: { ...DEFAULT_DB_SETTINGS, ...dataToSave, id: 'cl-nexus-settings-default' },
    });
    
    const settingsToReturn: AppPlatformSettings = {
        ...DEFAULT_DB_SETTINGS,
        ...updatedDbSettings,
        resourceCategories: updatedDbSettings.resourceCategories ? updatedDbSettings.resourceCategories.split(',').filter(Boolean) : [],
        emailWhitelist: updatedDbSettings.emailWhitelist || '',
    };

    return NextResponse.json(settingsToReturn);
  } catch (error){
    console.error('[SETTINGS_POST_ERROR]', error);
    return NextResponse.json({ message: 'Error interno del servidor al guardar la configuración' }, { status: 500 });
  }
}