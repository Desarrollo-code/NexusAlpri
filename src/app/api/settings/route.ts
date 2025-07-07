
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { PlatformSettings } from '@/types';
import type { NextRequest } from 'next/server';

// The default settings, but with arrays that will be stringified for the DB
const DEFAULT_DB_SETTINGS = {
  platformName: "NexusAlpri",
  allowPublicRegistration: true,
  enableEmailNotifications: true,
  resourceCategories: JSON.stringify(["Recursos Humanos", "TI y Seguridad", "Marketing", "Ventas", "Legal", "Operaciones", "Finanzas", "Formación Interna", "Documentación de Producto", "General"]),
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumber: true,
  passwordRequireSpecialChar: true,
  enableIdleTimeout: true,
  idleTimeoutMinutes: 20,
  require2faForAdmins: false,
};

// A helper to parse settings from the DB
const parseDbSettings = (dbSettings: any): PlatformSettings => {
    return {
        ...dbSettings,
        resourceCategories: JSON.parse(dbSettings.resourceCategories || '[]'),
    };
};

// GET /api/settings - Fetches platform settings
export async function GET(req: NextRequest) {
  try {
    let settings = await prisma.platformSettings.findFirst();

    if (!settings) {
      // If no settings exist, create them with default values
      settings = await prisma.platformSettings.create({
        data: DEFAULT_DB_SETTINGS,
      });
    }
    
    return NextResponse.json(parseDbSettings(settings));
  } catch (error) {
    console.error('[SETTINGS_GET_ERROR]', error);
    // If there's a DB error, return the parsed default settings object to allow the app to function.
    const fallbackSettings = {
        ...DEFAULT_DB_SETTINGS,
        id: 'default-settings', // a dummy id
        updatedAt: new Date(),
    };
    return NextResponse.json(parseDbSettings(fallbackSettings));
  }
}

// POST /api/settings - Updates platform settings
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMINISTRATOR') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const dataFromClient: PlatformSettings = await req.json();
    
    const dataToSave = {
        ...dataFromClient,
        resourceCategories: JSON.stringify(dataFromClient.resourceCategories || []),
    };

    // Remove fields that should not be manually set by client
    delete (dataToSave as any).id;
    delete (dataToSave as any).updatedAt;
    
    const currentSettings = await prisma.platformSettings.findFirst();

    const updatedSettings = await prisma.platformSettings.upsert({
      where: { id: currentSettings?.id || 'non-existent-id-for-upsert' },
      update: dataToSave,
      create: dataToSave,
    });

    return NextResponse.json(parseDbSettings(updatedSettings));
  } catch (error) {
    console.error('[SETTINGS_POST_ERROR]', error);
    return NextResponse.json({ message: 'Error interno del servidor al guardar la configuración' }, { status: 500 });
  }
}
