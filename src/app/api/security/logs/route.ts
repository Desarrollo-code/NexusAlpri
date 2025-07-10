
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET security logs (ADMIN only)
export async function GET(req: NextRequest) {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const logs = await prisma.securityLog.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            take: 100, // Limit to the last 100 events for performance
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    }
                }
            }
        });
        return NextResponse.json({ logs });
    } catch (error) {
        console.error('[SECURITY_LOGS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los registros de seguridad' }, { status: 500 });
    }
}
