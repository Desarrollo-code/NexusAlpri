
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { CourseStatus, UserRole } from '@/types';
import type { NextRequest } from 'next/server';
import { subDays, startOfDay } from 'date-fns';

export interface AnalyticsSummary {
    totalUsers: number;
    userTrend: number;
    totalCourses: number;
    courseTrend: number;
    totalPublishedCourses: number;
    totalEnrollments: number;
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

        // Total Users
        const totalUsers = await prisma.user.count();
        const newUsersLast7Days = await prisma.user.count({ where: { registeredDate: { gte: sevenDaysAgo } } });
        const newUsersPrevious7Days = await prisma.user.count({ where: { registeredDate: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } });

        // Total Courses
        const totalCourses = await prisma.course.count();
        const newCoursesLast7Days = await prisma.course.count({ where: { createdAt: { gte: sevenDaysAgo } } });
        const newCoursesPrevious7Days = await prisma.course.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } });

        // Other stats
        const totalPublishedCourses = await prisma.course.count({ where: { status: 'PUBLISHED' } });
        const totalEnrollments = await prisma.enrollment.count();
        
        const usersByRole = await prisma.user.groupBy({
            by: ['role'],
            _count: { role: true },
        });

        const coursesByStatus = await prisma.course.groupBy({
            by: ['status'],
            _count: { status: true },
        });

        const summary: AnalyticsSummary = {
            totalUsers,
            userTrend: calculateTrend(newUsersLast7Days, newUsersPrevious7Days),
            totalCourses,
            courseTrend: calculateTrend(newCoursesLast7Days, newCoursesPrevious7Days),
            totalPublishedCourses,
            totalEnrollments,
            usersByRole: usersByRole.map(item => ({
                role: item.role as UserRole,
                count: item._count.role,
            })),
            coursesByStatus: coursesByStatus.map(item => ({
                status: item.status as CourseStatus,
                count: item._count.status,
            })),
        };

        return NextResponse.json(summary);
    } catch (error) {
        console.error('[ANALYTICS_SUMMARY_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener el resumen de analíticas' }, { status: 500 });
    }
}
