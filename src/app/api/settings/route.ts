
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { PlatformSettings } from '@/types';
import type { NextRequest } from 'next/server';

// The default settings, but with arrays that will be stringified for the DB
const DEFAULT_DB_SETTINGS = {
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
};

// GET /api/settings - Fetches platform settings
export async function GET(req: NextRequest) {
  try {
    let dbSettings = await prisma.platformSettings.findFirst();

    if (!dbSettings) {
      // If no settings exist, create them with default values
      dbSettings = await prisma.platformSettings.create({
        data: DEFAULT_DB_SETTINGS,
      });
    }
    
    // Transform string fields to arrays for the client
    const settingsToReturn: PlatformSettings = {
        ...dbSettings,
        resourceCategories: dbSettings.resourceCategories?.split(',').filter(Boolean) ?? [],
        emailWhitelist: dbSettings.emailWhitelist || '',
    };
    
    return NextResponse.json(settingsToReturn);

  } catch (error) {
    console.error('[SETTINGS_GET_ERROR]', error);
    // If there's a DB error, return the parsed default settings object to allow the app to function.
    const fallbackSettings: PlatformSettings = {
        ...DEFAULT_DB_SETTINGS,
        resourceCategories: DEFAULT_DB_SETTINGS.resourceCategories.split(','),
    };
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

    const dataFromClient: PlatformSettings = await req.json();
    
    const dataToSave = {
        ...dataFromClient,
        resourceCategories: dataFromClient.resourceCategories.join(','),
    };

    // Remove fields that should not be manually set by client
    delete (dataToSave as any).id;
    delete (dataToSave as any).updatedAt;
    
    const currentSettings = await prisma.platformSettings.findFirst();
    
    // --- START: CATEGORY DELETION CHECK ---
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
    // --- END: CATEGORY DELETION CHECK ---

    const updatedDbSettings = await prisma.platformSettings.upsert({
      where: { id: currentSettings?.id || 'non-existent-id-for-upsert' },
      update: dataToSave,
      create: dataToSave,
    });
    
    const settingsToReturn: PlatformSettings = {
        ...updatedDbSettings,
        resourceCategories: updatedDbSettings.resourceCategories?.split(',').filter(Boolean) ?? [],
        emailWhitelist: updatedDbSettings.emailWhitelist || '',
    };

    return NextResponse.json(settingsToReturn);
  } catch (error) {
    console.error('[SETTINGS_POST_ERROR]', error);
    return NextResponse.json({ message: 'Error interno del servidor al guardar la configuración' }, { status: 500 });
  }
}
