// src/app/api/security/logs/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { SecurityLogEvent, SecurityStats } from '@/types';
import { startOfDay, endOfDay, subDays, isValid, eachDayOfInterval, format } from 'date-fns';
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 8; // Forzado a 8

    const skip = (page - 1) * pageSize;

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
            totalLogs,
            allLogsInPeriod,
            totalActiveUsers,
            usersWith2FA,
        ] = await Promise.all([
            prisma.securityLog.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, name: true, avatar: true, email: true },
                    },
                },
                skip,
                take: pageSize,
            }),
            prisma.securityLog.count({ where: whereClause }),
            prisma.securityLog.findMany({ 
                where: { createdAt: { gte: startDate, lte: endDate } },
                select: { userAgent: true, ipAddress: true, country: true, event: true, createdAt: true },
            }),
            prisma.user.count({ where: { isActive: true } }),
            prisma.user.count({ where: { isActive: true, isTwoFactorEnabled: true } }),
        ]);

        const successfulLogins = allLogsInPeriod.filter(l => l.event === 'SUCCESSFUL_LOGIN').length;
        const failedLogins = allLogsInPeriod.filter(l => l.event === 'FAILED_LOGIN_ATTEMPT').length;
        const roleChanges = allLogsInPeriod.filter(l => l.event === 'USER_ROLE_CHANGED').length;

        const { browsers, os } = aggregateByUserAgent(allLogsInPeriod || []);

        const ipCounts = (allLogsInPeriod || []).reduce((acc, log) => {
            if (log.ipAddress) {
                acc[log.ipAddress] = {
                    count: (acc[log.ipAddress]?.count || 0) + 1,
                    country: log.country || 'Desconocido',
                };
            }
            return acc;
        }, {} as Record<string, {count: number, country: string}>);

        const topIps = Object.entries(ipCounts)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 5)
            .map(([ip, data]) => ({ ip, ...data }));
            
        // --- Calculate Security Score and Trend ---
        const totalLogins = successfulLogins + failedLogins;
        const securityScore = totalLogins > 0 ? (successfulLogins / totalLogins) * 100 : 100;
        
        const trendMap = new Map<string, { success: number, fail: number }>();
        const intervalDays = eachDayOfInterval({ start: startDate, end: endDate });

        intervalDays.forEach(day => {
            trendMap.set(format(day, 'yyyy-MM-dd'), { success: 0, fail: 0 });
        });

        allLogsInPeriod.forEach(log => {
            // FIX: Add validation to ensure log.createdAt is a valid date before formatting
            if (log.createdAt && isValid(new Date(log.createdAt))) {
                const dayKey = format(new Date(log.createdAt), 'yyyy-MM-dd');
                const dayData = trendMap.get(dayKey);
                if (dayData) {
                    if (log.event === 'SUCCESSFUL_LOGIN') dayData.success++;
                    if (log.event === 'FAILED_LOGIN_ATTEMPT') dayData.fail++;
                }
            }
        });

        const securityScoreTrend = Array.from(trendMap.entries()).map(([date, counts]) => {
            const dailyTotal = counts.success + counts.fail;
            return {
                date,
                score: dailyTotal > 0 ? (counts.success / dailyTotal) * 100 : 100,
            };
        });
        
        // Calculate 2FA Adoption
        const twoFactorAdoptionRate = totalActiveUsers > 0 ? (usersWith2FA / totalActiveUsers) * 100 : 0;
        
        const stats: SecurityStats = {
            successfulLogins,
            failedLogins,
            roleChanges,
            browsers,
            os,
            topIps,
            securityScore,
            securityScoreTrend,
            twoFactorAdoptionRate,
        };

        return NextResponse.json({ logs, stats, totalLogs });

    } catch (error) {
        console.error('[SECURITY_LOGS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los registros de seguridad' }, { status: 500 });
    }
}
