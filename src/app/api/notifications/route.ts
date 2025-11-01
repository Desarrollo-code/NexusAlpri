// src/app/api/notifications/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET all notifications for the current user
export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const getAll = searchParams.get('all') === 'true';

  try {
    const notificationsFromDb = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      ...(!getAll && { take: 10 }), // Limit if not requesting all
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
    const session = await getCurrentUser();
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
                where: { userId: session.id, read: false }, // Only update unread ones
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
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        const { ids } = await req.json();

        let whereClause: any = { userId: session.id };

        if (Array.isArray(ids) && ids.length > 0) {
            whereClause.id = { in: ids };
        } else {
            // This is a special case to delete all notifications for a user, if needed.
            // For now, we require specific IDs to prevent accidental mass deletion.
            return NextResponse.json({ message: 'El campo "ids" debe ser un array de IDs válido.' }, { status: 400 });
        }

        const deleteResult = await prisma.notification.deleteMany({
            where: whereClause,
        });

        if (deleteResult.count === 0) {
            // It's not an error if no notifications were found to delete.
            // The desired state (no such notifications) is achieved.
            return new NextResponse(null, { status: 204 });
        }
        
        return new NextResponse(null, { status: 204 }); // Success, no content

    } catch (error) {
        console.error('[NOTIFICATIONS_DELETE_ERROR]', error);
        return NextResponse.json({ message: 'Error al eliminar notificaciones' }, { status: 500 });
    }
}
