// src/app/api/cron/cleanup/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de CRON para la limpieza automática de datos obsoletos.
 * Se debe proteger con un CRON_SECRET en las variables de entorno.
 * Vercel Cron Job: /api/cron/cleanup?cron_secret=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cronSecret = searchParams.get('cron_secret');

  // 1. Proteger el endpoint
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
  }

  try {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const ninetyDaysAgo = subDays(now, 90);
    const oneEightyDaysAgo = subDays(now, 180);

    // 2. Eliminar cursos archivados hace más de 30 días
    const deletedCourses = await prisma.course.deleteMany({
      where: {
        status: 'ARCHIVED',
        updatedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    // 3. Eliminar anuncios con más de 90 días de antigüedad
    const deletedAnnouncements = await prisma.announcement.deleteMany({
        where: {
            date: {
                lt: ninetyDaysAgo
            }
        }
    });
    
    // 4. Eliminar notificaciones leídas con más de 30 días de antigüedad
    const deletedNotifications = await prisma.notification.deleteMany({
        where: {
            read: true,
            createdAt: {
                lt: thirtyDaysAgo
            }
        }
    });

    // 5. Eliminar registros de seguridad con más de 180 días
    const deletedSecurityLogs = await prisma.securityLog.deleteMany({
        where: {
            createdAt: {
                lt: oneEightyDaysAgo,
            },
        },
    });


    return NextResponse.json({
      message: 'Limpieza automática completada exitosamente.',
      details: {
        deletedCourses: deletedCourses.count,
        deletedAnnouncements: deletedAnnouncements.count,
        deletedNotifications: deletedNotifications.count,
        deletedSecurityLogs: deletedSecurityLogs.count,
      }
    });

  } catch (error) {
    console.error('[CRON_CLEANUP_ERROR]', error);
    return NextResponse.json({ message: 'Error durante el proceso de limpieza automática.', error: (error as Error).message }, { status: 500 });
  }
}
