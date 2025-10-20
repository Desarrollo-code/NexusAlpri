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
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10); // Aumentado para el mapa
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
                        email: true
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

        // Enriquecer con datos de geolocalización (simulado)
        const logsWithGeo = logs.map(log => {
            // Lógica simple de hash para generar coordenadas falsas pero consistentes para una IP
            let lat = 0;
            let lng = 0;
            if (log.ipAddress) {
                const ipHash = log.ipAddress.split('.').reduce((acc, part) => acc + parseInt(part, 10), 0);
                lat = (ipHash % 180) - 90; // Rango de -90 a 90
                lng = (ipHash * 37 % 360) - 180; // Rango de -180 a 180
            }
            return {
                ...log,
                lat,
                lng
            };
        });


        return NextResponse.json({ logs: logsWithGeo, totalLogs });
    } catch (error) {
        console.error('[SECURITY_LOGS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los registros de seguridad' }, { status: 500 });
    }
}
