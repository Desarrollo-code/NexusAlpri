// src/app/api/security/stats/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { subHours } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const twentyFourHoursAgo = subHours(new Date(), 24);

        const successfulLogins = prisma.securityLog.count({
            where: {
                event: 'SUCCESSFUL_LOGIN',
                createdAt: { gte: twentyFourHoursAgo },
            },
        });

        const failedLogins = prisma.securityLog.count({
            where: {
                event: 'FAILED_LOGIN_ATTEMPT',
                createdAt: { gte: twentyFourHoursAgo },
            },
        });

        const twoFactorEvents = prisma.securityLog.count({
            where: {
                OR: [
                    { event: 'TWO_FACTOR_ENABLED' },
                    { event: 'TWO_FACTOR_DISABLED' },
                ],
                createdAt: { gte: twentyFourHoursAgo },
            },
        });

        const roleChanges = prisma.securityLog.count({
            where: {
                event: 'USER_ROLE_CHANGED',
                createdAt: { gte: twentyFourHoursAgo },
            },
        });

        const [
            successfulLoginsCount,
            failedLoginsCount,
            twoFactorEventsCount,
            roleChangesCount
        ] = await Promise.all([
            successfulLogins,
            failedLogins,
            twoFactorEvents,
            roleChanges
        ]);

        return NextResponse.json({
            successfulLogins: successfulLoginsCount,
            failedLogins: failedLoginsCount,
            twoFactorEvents: twoFactorEventsCount,
            roleChanges: roleChangesCount,
        });

    } catch (error) {
        console.error('[SECURITY_STATS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas de seguridad' }, { status: 500 });
    }
}
