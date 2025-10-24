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
    const eventType = searchParams.get('event') as SecurityLogEvent | null;
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

        return NextResponse.json({ logs });
    } catch (error) {
        console.error('[SECURITY_LOGS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los registros de seguridad' }, { status: 500 });
    }
}
