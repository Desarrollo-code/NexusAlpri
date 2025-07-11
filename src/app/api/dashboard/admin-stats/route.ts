
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { subDays, startOfDay } from 'date-fns';
import type { UserRole, CourseStatus } from '@/types';

export interface AdminDashboardStats {
    totalUsers: number;
    userTrend: number;
    totalCourses: number;
    courseTrend: number;
    totalPublishedCourses: number;
    publishedCoursesTrend: number;
    totalEnrollments: number;
    enrollmentTrend: number;
    usersByRole: { role: UserRole; count: number }[];
    coursesByStatus: { status: CourseStatus; count: number }[];
}

const calculateTrend = (currentPeriodCount: number, previousPeriodCount: number): number => {
    if (previousPeriodCount === 0) {
        return currentPeriodCount > 0 ? 100 : 0;
    }
    return ((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100;
};


export async function GET(req: NextRequest) {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const today = new Date();
        const sevenDaysAgo = startOfDay(subDays(today, 7));
        const fourteenDaysAgo = startOfDay(subDays(today, 14));

        const [
            totalUsers,
            newUsersLast7Days,
            newUsersPrevious7Days,
            totalCourses,
            newCoursesLast7Days,
            newCoursesPrevious7Days,
            totalPublishedCourses,
            newlyPublishedLast7Days,
            newlyPublishedPrevious7Days,
            totalEnrollments,
            newEnrollmentsLast7Days,
            newEnrollmentsPrevious7Days,
            usersByRole,
            coursesByStatus,
        ] = await prisma.$transaction([
            prisma.user.count(),
            prisma.user.count({ where: { registeredDate: { gte: sevenDaysAgo } } }),
            prisma.user.count({ where: { registeredDate: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
            
            prisma.course.count(),
            prisma.course.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
            prisma.course.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
            
            prisma.course.count({ where: { status: 'PUBLISHED' } }),
            prisma.course.count({ where: { status: 'PUBLISHED', publicationDate: { gte: sevenDaysAgo } } }),
            prisma.course.count({ where: { status: 'PUBLISHED', publicationDate: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),

            prisma.enrollment.count(),
            prisma.enrollment.count({ where: { enrolledAt: { gte: sevenDaysAgo } } }),
            prisma.enrollment.count({ where: { enrolledAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
            
            prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
            prisma.course.groupBy({ by: ['status'], _count: { status: true } }),
        ]);

        const stats: AdminDashboardStats = {
            totalUsers,
            userTrend: calculateTrend(newUsersLast7Days, newUsersPrevious7Days),
            totalCourses,
            courseTrend: calculateTrend(newCoursesLast7Days, newCoursesPrevious7Days),
            totalPublishedCourses,
            publishedCoursesTrend: calculateTrend(newlyPublishedLast7Days, newlyPublishedPrevious7Days),
            totalEnrollments,
            enrollmentTrend: calculateTrend(newEnrollmentsLast7Days, newEnrollmentsPrevious7Days),
            usersByRole: usersByRole.map(item => ({
                role: item.role as UserRole,
                count: item._count.role,
            })),
            coursesByStatus: coursesByStatus.map(item => ({
                status: item.status as CourseStatus,
                count: item._count.status,
            })),
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('[ADMIN_DASHBOARD_STATS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas del dashboard' }, { status: 500 });
    }
}
