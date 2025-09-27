// src/app/api/cron/check-expirations/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addDays, startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de CRON para verificar recursos que están por expirar.
 * Se debe proteger con un CRON_SECRET en las variables de entorno.
 * Vercel Cron Job: /api/cron/check-expirations?cron_secret=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cronSecret = searchParams.get('cron_secret');

  // 1. Proteger el endpoint
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
  }

  try {
    // 2. Calcular la fecha objetivo: exactamente en 30 días
    const targetDate = addDays(new Date(), 30);
    const startOfTargetDay = startOfDay(targetDate);
    const endOfTargetDay = endOfDay(targetDate);

    // 3. Buscar recursos que expiran en la fecha objetivo
    const expiringResources = await prisma.enterpriseResource.findMany({
      where: {
        expiresAt: {
          gte: startOfTargetDay,
          lte: endOfTargetDay,
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        title: true,
        uploaderId: true,
        expiresAt: true,
      },
    });

    if (expiringResources.length === 0) {
      return NextResponse.json({ message: 'No hay recursos que expiren en 30 días.' });
    }

    // 4. Crear las notificaciones para los autores
    const notificationsToCreate = expiringResources.map(resource => ({
      userId: resource.uploaderId,
      title: `El recurso "${resource.title}" está por expirar`,
      description: `Este recurso expirará en 30 días. Revísalo para asegurarte de que sigue siendo relevante.`,
      link: `/resources`, // En una futura versión, podría llevar directamente al recurso.
    }));

    await prisma.notification.createMany({
      data: notificationsToCreate,
      skipDuplicates: true, // No crear la misma notificación si ya existe
    });

    return NextResponse.json({
      message: `Se crearon ${expiringResources.length} notificaciones de expiración.`,
      details: expiringResources.map(r => ({ title: r.title, uploader: r.uploaderId })),
    });

  } catch (error) {
    console.error('[CRON_CHECK_EXPIRATIONS_ERROR]', error);
    return NextResponse.json({ message: 'Error al procesar las expiraciones de recursos.', error: (error as Error).message }, { status: 500 });
  }
}
