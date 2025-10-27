// src/app/api/security/logs/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { SecurityLogEvent, SecurityStats } from '@/types';
import { startOfDay, endOfDay, subDays, isValid, eachDayOfInterval, format } from 'date-fns';
import { parseUserAgent } from '@/lib/utils';

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
        if (eventType === 'COURSE_MODIFICATIONS') {
            whereClause.event = { in: ['COURSE_CREATED', 'COURSE_UPDATED', 'COURSE_DELETED'] };
        } else {
            whereClause.event = eventType;
        }
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
            atRiskUsersRaw
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
            prisma.securityLog.groupBy({
                by: ['emailAttempt'],
                where: {
                    event: 'FAILED_LOGIN_ATTEMPT',
                    createdAt: { gte: subDays(new Date(), 1) },
                    emailAttempt: { not: null },
                },
                _count: { event: true },
                having: { event: { _count: { gt: 5 } } },
            }),
        ]);

        const atRiskEmails = atRiskUsersRaw.map(u => u.emailAttempt!);
        const atRiskUsers = await prisma.user.findMany({
            where: { email: { in: atRiskEmails } },
            select: { id: true, name: true, email: true, avatar: true }
        });
        const atRiskUsersWithCount = atRiskUsers.map(user => {
            const rawData = atRiskUsersRaw.find(r => r.emailAttempt === user.email);
            return {
                userId: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                failedAttempts: rawData?._count.event || 0,
            }
        });

        const successfulLogins = allLogsInPeriod.filter(l => l.event === 'SUCCESSFUL_LOGIN').length;
        const failedLogins = allLogsInPeriod.filter(l => l.event === 'FAILED_LOGIN_ATTEMPT').length;
        const roleChanges = allLogsInPeriod.filter(l => l.event === 'USER_ROLE_CHANGED').length;
        const courseModifications = allLogsInPeriod.filter(l => ['COURSE_CREATED', 'COURSE_UPDATED', 'COURSE_DELETED'].includes(l.event)).length;


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
            
        // --- Calculate Security Score ---
        const totalLogins = successfulLogins + failedLogins;
        const securityScore = totalLogins > 0 ? (successfulLogins / totalLogins) * 100 : 100;
        
        // Calculate 2FA Adoption
        const twoFactorAdoptionRate = totalActiveUsers > 0 ? (usersWith2FA / totalActiveUsers) * 100 : 0;
        
        const stats: SecurityStats = {
            successfulLogins,
            failedLogins,
            roleChanges,
            courseModifications,
            browsers,
            os,
            topIps,
            securityScore,
            twoFactorAdoptionRate,
            atRiskUsers: atRiskUsersWithCount,
        };

        return NextResponse.json({ logs, stats, totalLogs });

    } catch (error) {
        console.error('[SECURITY_LOGS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los registros de seguridad' }, { status: 500 });
    }
}
