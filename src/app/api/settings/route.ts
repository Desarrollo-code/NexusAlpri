// src/app/api/settings/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import type { PlatformSettings } from '@/types';
import type { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

const DEFAULT_DB_SETTINGS = {
  id: 'cl-nexus-settings-default', // Un ID predecible y único
  platformName: "NexusAlpri",
  allowPublicRegistration: true,
  enableEmailNotifications: true,
  emailWhitelist: "",
  resourceCategories: "Recursos Humanos,TI y Seguridad,Marketing,Ventas,Legal,Operaciones,Finanzas,Formación Interna,Documentación de Producto,General",
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumber: true,
  passwordRequireSpecialChar: true,
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
  fontHeadline: 'Space Grotesk',
  fontBody: 'Inter'
};

const getFallbackSettings = (): PlatformSettings => {
    return {
        ...DEFAULT_DB_SETTINGS,
        resourceCategories: DEFAULT_DB_SETTINGS.resourceCategories.split(','),
        emailWhitelist: DEFAULT_DB_SETTINGS.emailWhitelist || '',
    };
};

// GET /api/settings - Fetches platform settings
export async function GET(req: NextRequest) {
  try {
    // Intenta conectar a la base de datos de forma explícita
    await prisma.$connect();

    let dbSettings = await prisma.platformSettings.findFirst();

    if (!dbSettings) {
      dbSettings = await prisma.platformSettings.create({
        data: DEFAULT_DB_SETTINGS,
      });
    }
    
    // Transforma los campos de string a array para el cliente
    const settingsToReturn: PlatformSettings = {
        ...dbSettings,
        resourceCategories: dbSettings.resourceCategories ? dbSettings.resourceCategories.split(',').filter(Boolean) : [],
        emailWhitelist: dbSettings.emailWhitelist || '',
    };
    
    return NextResponse.json(settingsToReturn);

  } catch (error) {
    console.error('[SETTINGS_GET_ERROR]', error);
    // En caso de error de conexión, devuelve la configuración por defecto
    const fallbackSettings = getFallbackSettings();
    return NextResponse.json(fallbackSettings);
  } finally {
      // Asegúrate de desconectar para evitar conexiones abiertas innecesarias
      await prisma.$disconnect().catch(() => {});
  }
}

// POST /api/settings - Updates platform settings
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const dataFromClient: PlatformSettings = await req.json();
    
    // Prepara los datos para guardar, convirtiendo arrays a strings
    const dataToSave = {
        ...dataFromClient,
        resourceCategories: dataFromClient.resourceCategories.join(','),
    };

    // Elimina campos que no deben ser actualizados manualmente
    delete (dataToSave as any).id;
    delete (dataToSave as any).updatedAt;
    
    const currentSettings = await prisma.platformSettings.findFirst();
    
    // --- Lógica para verificar si se puede eliminar una categoría ---
    if (currentSettings && currentSettings.resourceCategories) {
        const oldCategories = currentSettings.resourceCategories.split(',').filter(Boolean);
        const newCategories = dataToSave.resourceCategories.split(',').filter(Boolean);
        const deletedCategories = oldCategories.filter(cat => !newCategories.includes(cat));

        if (deletedCategories.length > 0) {
            for (const category of deletedCategories) {
                const courseCount = await prisma.course.count({ where: { category } });
                const resourceCount = await prisma.resource.count({ where: { category } });
                const totalUsage = courseCount + resourceCount;
                if (totalUsage > 0) {
                    return NextResponse.json({
                        message: `No se puede eliminar la categoría "${category}" porque está siendo utilizada por ${totalUsage} curso(s) o recurso(s).`,
                    }, { status: 409 }); // 409 Conflict
                }
            }
        }
    }

    // Upsert para crear la configuración si no existe, o actualizarla si existe.
    const updatedDbSettings = await prisma.platformSettings.upsert({
      where: { id: currentSettings?.id || DEFAULT_DB_SETTINGS.id },
      update: dataToSave,
      create: { ...DEFAULT_DB_SETTINGS, ...dataToSave },
    });
    
    // Revalidar las rutas públicas para que los cambios de imagen se reflejen
    revalidatePath('/');
    revalidatePath('/about');

    // Devuelve la configuración actualizada en el formato correcto para el cliente
    const settingsToReturn: PlatformSettings = {
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
