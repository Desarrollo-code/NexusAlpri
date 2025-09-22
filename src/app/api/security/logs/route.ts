// src/app/api/security/logs/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import type { SecurityLogEvent } from '@/types';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await getCurrentUser();

    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'Acceso no autorizado. Se requieren permisos de administrador.' }, { status: 403 });
    }
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const eventType = searchParams.get('event') as SecurityLogEvent | null;
    const skip = (page - 1) * pageSize;

    let whereClause: any = {};
    if (eventType) {
        whereClause.event = eventType;
    }

    try {
        const [logs, totalLogs] = await prisma.$transaction([
            prisma.securityLog.findMany({
                where: whereClause,
                orderBy: {
                    createdAt: 'desc',
                },
                skip: skip,
                take: pageSize,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                },
            }),
            prisma.securityLog.count({ where: whereClause })
        ]);

        return NextResponse.json({ logs, totalLogs });
    } catch (error) {
        console.error('[SECURITY_LOGS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los registros de seguridad' }, { status: 500 });
    }
}
