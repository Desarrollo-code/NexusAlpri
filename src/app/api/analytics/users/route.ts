
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { subDays, startOfDay, format } from 'date-fns';
import type { UserRole, UserAnalyticsData } from '@/types';

export async function GET(req: NextRequest) {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const today = new Date();
        const thirtyDaysAgo = startOfDay(subDays(today, 30));

        // Aggregate user counts by role
        const usersByRoleQuery = prisma.user.groupBy({
            by: ['role'],
            _count: { role: true },
        });

        // Count active users in the last 7 days (based on security logs for logins)
        // TODO: Re-enable when SecurityLog model is implemented and migrated.
        const activeUsersQuery = Promise.resolve(0); // This is not a prisma promise, handle separately.

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
        
        // Correctly handle the transaction by only including Prisma promises
        const [usersByRole, newUsersAggregated] = await prisma.$transaction([
            usersByRoleQuery,
            newUsersLast30DaysQuery
        ]);
        
        const activeUsersLast7Days = await activeUsersQuery;

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
