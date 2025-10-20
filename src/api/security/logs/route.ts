// src/app/api/security/logs/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { SecurityLogEvent } from '@/types';

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
    const getAll = searchParams.get('all') === 'true';

    const skip = (page - 1) * pageSize;

    let whereClause: any = {};
    if (eventType) {
        whereClause.event = eventType;
    }

    try {
        const findOptions = {
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        email: true,
                    },
                },
            },
        };
        
        const [logs, totalLogs] = await prisma.$transaction([
            prisma.securityLog.findMany({
                ...findOptions,
                ...(!getAll && { skip, take: pageSize }),
            }),
            prisma.securityLog.count({ where: whereClause })
        ]);

        // Enriquecer con datos de geolocalización (simulado para demostración)
        const logsWithGeo = logs.map(log => {
            let lat = null;
            let lng = null;
            if (log.ipAddress) {
                // Simple hash para generar coordenadas consistentes pero aleatorias
                const ipParts = log.ipAddress.split('.').map(part => parseInt(part, 10));
                if (ipParts.length === 4) {
                    lat = (ipParts[0] * ipParts[2]) % 180 - 90 + (Math.random() - 0.5) * 2;
                    lng = (ipParts[1] * ipParts[3]) % 360 - 180 + (Math.random() - 0.5) * 2;
                }
            }
            return {
                ...log,
                lat,
                lng,
            };
        });

        return NextResponse.json({ logs: logsWithGeo, totalLogs });
    } catch (error) {
        console.error('[SECURITY_LOGS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los registros de seguridad' }, { status: 500 });
    }
}
