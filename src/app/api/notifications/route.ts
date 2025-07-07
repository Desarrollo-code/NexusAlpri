
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Mocks a notification system for demonstration
const createMockNotifications = (userId: string) => {
    return [
        {
            id: 'notif-1',
            userId: userId,
            title: '¡Bienvenido a NexusAlpri!',
            description: 'Explora nuestros cursos y recursos para empezar.',
            date: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
            link: '/dashboard',
            user: { name: 'NexusAlpri Bot' }
        },
        {
            id: 'notif-2',
            userId: userId,
            title: 'Nuevo curso disponible: Introducción a la IA',
            description: 'Inscríbete ahora en el curso más reciente sobre inteligencia artificial.',
            date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            link: '/courses',
            user: { name: 'Academia' }
        },
        {
            id: 'notif-3',
            userId: userId,
            title: 'Actualización de políticas de la empresa',
            description: 'Se ha subido un nuevo documento de políticas de seguridad.',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            link: '/resources',
            user: { name: 'Admin' }
        }
    ];
}


export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    // In a real application, you would fetch notifications from the database
    // For this demo, we'll return a mock list.
    const notifications = createMockNotifications(session.id);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('[NOTIFICATIONS_GET_ERROR]', error);
    return NextResponse.json({ message: 'Error al obtener notificaciones' }, { status: 500 });
  }
}
