// src/app/api/security/logs/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { SecurityLogEvent, SecurityStats } from '@/types';
import { startOfDay, endOfDay, subDays, isValid } from 'date-fns';
import { parseUserAgent } from '@/lib/security-log-utils';

export const dynamic = 'force-dynamic';

const aggregateByUserAgent = (logs: { userAgent: string | null }[]) => {
    const browserCounts: Record<string, number> = {};
    const osCounts: Record<string, number> = {};

    logs.forEach(log => {
        const { browser, os } = parseUserAgent(log.userAgent);
        browserCounts[browser] = (browserCounts[browser] || 0) + 1;
        osCounts[os] = (osCounts[os] || 0) + 1;
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

    const endDate = endDateParam && isValid(new Date(endDateParam)) ? endOfDay(new Date(endDateParam)) : endOfDay(new Date());
    const startDate = startDateParam && isValid(new Date(startDateParam)) ? startOfDay(new Date(startDateParam)) : startOfDay(subDays(endDate, 6));

    if (isValid(startDate) && isValid(endDate)) {
        whereClause.createdAt = {
            gte: startDate,
            lte: endDate,
        };
    }

    try {
        const [
            logs, 
            successfulLogins,
            failedLogins,
            roleChanges,
            allLogsForDeviceStats,
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
            prisma.securityLog.count({ where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: startDate, lte: endDate } } }),
            prisma.securityLog.count({ where: { event: 'FAILED_LOGIN_ATTEMPT', createdAt: { gte: startDate, lte: endDate } } }),
            prisma.securityLog.count({ where: { event: 'USER_ROLE_CHANGED', createdAt: { gte: startDate, lte: endDate } } }),
            prisma.securityLog.findMany({ 
                where: { createdAt: { gte: startDate, lte: endDate } },
                select: { userAgent: true },
            }),
        ]);

        const { browsers, os } = aggregateByUserAgent(allLogsForDeviceStats || []);
        
        const stats: SecurityStats = {
            successfulLogins,
            failedLogins,
            roleChanges,
            browsers,
            os,
        };

        return NextResponse.json({ logs, stats });

    } catch (error) {
        console.error('[SECURITY_LOGS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los registros de seguridad' }, { status: 500 });
    }
}
