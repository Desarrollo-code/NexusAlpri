// src/app/api/security/logs/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { SecurityLogEvent } from '@/types';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await getCurrentUser();

    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'Acceso no autorizado.' }, { status: 403 });
    }
    
    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get('event') as SecurityLogEvent | 'ALL' | null;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let whereClause: any = {};
    if (eventType && eventType !== 'ALL') {
        whereClause.event = eventType;
    }

    if (startDateParam && endDateParam) {
        try {
            whereClause.createdAt = {
                gte: startOfDay(new Date(startDateParam)),
                lte: endOfDay(new Date(endDateParam)),
            };
        } catch (e) {
            // Ignore invalid date params
        }
    }

    try {
        const logs = await prisma.securityLog.findMany({
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
            take: 500, // Limit to the most recent 500 logs for performance
        });

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

        return NextResponse.json({ logs: logsWithGeo });
    } catch (error) {
        console.error('[SECURITY_LOGS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los registros de seguridad' }, { status: 500 });
    }
}
