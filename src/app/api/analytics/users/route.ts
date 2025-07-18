
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import type { UserRole, UserAnalyticsData } from '@/types';

export async function GET(req: NextRequest) {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const today = new Date();
        const sevenDaysAgo = startOfDay(subDays(today, 7));
        const thirtyDaysAgo = startOfDay(subDays(today, 30));

        // Aggregate user counts by role
        const usersByRoleQuery = prisma.user.groupBy({
            by: ['role'],
            _count: { role: true },
        });

        // Count active users in the last 7 days (based on security logs for logins)
        const activeUsersQuery = prisma.securityLog.count({
            where: {
                event: 'SUCCESSFUL_LOGIN',
                createdAt: { gte: sevenDaysAgo },
            },
            distinct: ['userId'],
        });

        // Aggregate new users per day for the last 30 days
        const newUsersLast30DaysQuery = prisma.user.groupBy({
            by: ['registeredDate'],
            where: {
                registeredDate: {
                    gte: thirtyDaysAgo,
                },
            },
            _count: {
                _all: true,
            },
            orderBy: {
                registeredDate: 'asc',
            },
        });
        
        const [usersByRole, activeUsersLast7Days, newUsersAggregated] = await prisma.$transaction([
            usersByRoleQuery,
            activeUsersQuery,
            newUsersLast30DaysQuery
        ]);

        // Process aggregated new user data into a day-by-day format
        const dateMap = new Map<string, number>();
        for (let i = 0; i < 30; i++) {
            const date = subDays(today, i);
            const formattedDate = format(date, 'MMM d');
            dateMap.set(formattedDate, 0);
        }

        newUsersAggregated.forEach(item => {
            if (item.registeredDate) {
                const formattedDate = format(item.registeredDate, 'MMM d');
                if (dateMap.has(formattedDate)) {
                    dateMap.set(formattedDate, (dateMap.get(formattedDate) || 0) + item._count._all);
                }
            }
        });
        
        const newUsersLast30Days = Array.from(dateMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
        const stats: UserAnalyticsData = {
            usersByRole: usersByRole.map(item => ({
                role: item.role as UserRole,
                count: item._count.role,
            })),
            activeUsersLast7Days,
            newUsersLast30Days,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('[USERS_ANALYTICS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las analíticas de usuarios' }, { status: 500 });
    }
}
