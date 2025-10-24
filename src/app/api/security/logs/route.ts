// src/app/api/security/logs/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { SecurityLogEvent, SecurityStats } from '@/types';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { parseUserAgent } from '@/lib/security-log-utils';

export const dynamic = 'force-dynamic';

const aggregateByUserAgent = (logs: { userAgent: string | null }[]) => {
    const browserCounts: Record<string, number> = {};
    const osCounts: Record<string, number> = {};

    logs.forEach(log => {
        // Asegurarnos de que el userAgent no es nulo antes de pasarlo
        if (log.userAgent) {
            const { browser, os } = parseUserAgent(log.userAgent);
            browserCounts[browser] = (browserCounts[browser] || 0) + 1;
            osCounts[os] = (osCounts[os] || 0) + 1;
        } else {
            // Contabilizar los desconocidos si es necesario
        }
    });
    
    const toSortedArray = (counts: Record<string, number>) => Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    return {
        browsers: toSortedArray(browserCounts).slice(0, 5), // Top 5
        os: toSortedArray(osCounts).slice(0, 5),
    };
};

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
        const twentyFourHoursAgo = subDays(new Date(), 1);

        const [
            logs, 
            successfulLogins24h,
            failedLogins24h,
            roleChanges24h,
            allLogsForDeviceStats,
            topIps,
        ] = await Promise.all([
            prisma.securityLog.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, name: true, avatar: true, email: true },
                    },
                },
                take: 500,
            }),
            prisma.securityLog.count({ where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: twentyFourHoursAgo } } }),
            prisma.securityLog.count({ where: { event: 'FAILED_LOGIN_ATTEMPT', createdAt: { gte: twentyFourHoursAgo } } }),
            prisma.securityLog.count({ where: { event: 'USER_ROLE_CHANGED', createdAt: { gte: twentyFourHoursAgo } } }),
            prisma.securityLog.findMany({ 
                select: { userAgent: true },
            }),
            prisma.securityLog.groupBy({
                by: ['ipAddress', 'country'],
                where: { ipAddress: { not: null } },
                _count: {
                    ipAddress: true,
                },
                orderBy: {
                    _count: {
                        ipAddress: 'desc',
                    },
                },
                take: 5,
            }),
        ]);

        const { browsers, os } = aggregateByUserAgent(allLogsForDeviceStats || []);
        
        const stats: SecurityStats = {
            successfulLogins: successfulLogins24h,
            failedLogins: failedLogins24h,
            roleChanges: roleChanges24h,
            browsers,
            os,
            topIps,
        };

        return NextResponse.json({ logs, stats });

    } catch (error) {
        console.error('[SECURITY_LOGS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los registros de seguridad' }, { status: 500 });
    }
}
