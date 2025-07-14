
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET all notifications for the current user
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const notificationsFromDb = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit the number of notifications to keep it performant
    });
    
    // Map to the client-side type
    const notifications = notificationsFromDb.map(n => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        description: n.description,
        link: n.link,
        read: n.read,
        date: n.createdAt.toISOString(),
    }));

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('[NOTIFICATIONS_GET_ERROR]', error);
    return NextResponse.json({ message: 'Error al obtener notificaciones' }, { status: 500 });
  }
}

// PATCH to mark notifications as read
export async function PATCH(req: NextRequest) {
    const session = await getSession(req);
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        const { ids, read } = await req.json();

        if (typeof read !== 'boolean') {
            return NextResponse.json({ message: 'El campo "read" es requerido' }, { status: 400 });
        }

        if (ids === 'all') {
            await prisma.notification.updateMany({
                where: { userId: session.id },
                data: { read },
            });
        } else if (Array.isArray(ids)) {
            await prisma.notification.updateMany({
                where: {
                    id: { in: ids },
                    userId: session.id, // Ensure user can only update their own notifications
                },
                data: { read },
            });
        } else {
             return NextResponse.json({ message: 'El campo "ids" debe ser un array o "all"' }, { status: 400 });
        }
        
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[NOTIFICATIONS_PATCH_ERROR]', error);
        return NextResponse.json({ message: 'Error al actualizar notificaciones' }, { status: 500 });
    }
}

// DELETE notifications
export async function DELETE(req: NextRequest) {
    const session = await getSession(req);
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        const { ids } = await req.json();

        if (ids === 'all') {
            await prisma.notification.deleteMany({
                where: { userId: session.id },
            });
        } else if (Array.isArray(ids) && ids.length > 0) {
            await prisma.notification.deleteMany({
                where: {
                    id: { in: ids },
                    userId: session.id,
                },
            });
        } else {
            return NextResponse.json({ message: 'El campo "ids" debe ser un array de IDs o la cadena "all"' }, { status: 400 });
        }
        
        return new NextResponse(null, { status: 204 }); // Success, no content

    } catch (error) {
        console.error('[NOTIFICATIONS_DELETE_ERROR]', error);
        return NextResponse.json({ message: 'Error al eliminar notificaciones' }, { status: 500 });
    }
}
