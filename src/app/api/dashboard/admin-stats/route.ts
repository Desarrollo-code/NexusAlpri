// src/app/api/dashboard/admin-stats/route.ts
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { subDays, startOfDay, endOfDay, parseISO, format, eachDayOfInterval } from 'date-fns';
import type { UserRole, CourseStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Define a default 30-day range if no dates are provided
    const endDate = endDateParam ? endOfDay(parseISO(endDateParam)) : new Date();
    const startDate = startDateParam ? startOfDay(parseISO(startDateParam)) : startOfDay(subDays(endDate, 29));

    try {
        const [
            totalUsersResult,
            totalCoursesResult,
            totalPublishedCoursesCount,
            totalEnrollmentsResult,
            usersByRole,
            coursesByStatus,
            recentLoginLogs,
            newEnrollmentsLast7DaysCount,
            userRegistrations,
            topCoursesByEnrollment,
            courseCompletions,
            topStudentsByEnrollment,
            topStudentsByCompletion,
            topInstructorsByCourses,
        ] = await prisma.$transaction([
            prisma.user.count(),
            prisma.course.count(),
            prisma.course.count({ where: { status: 'PUBLISHED' } }),
            prisma.enrollment.count(),
            prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
            prisma.course.groupBy({ by: ['status'], _count: { id: true } }),
            prisma.securityLog.findMany({
                where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: subDays(new Date(), 7) } },
                select: { userId: true },
                distinct: ['userId']
            }),
            prisma.enrollment.count({ where: { enrolledAt: { gte: subDays(new Date(), 7) } } }),
             // --- User registration trend query ---
            prisma.user.groupBy({
                by: ['registeredDate'],
                where: {
                    registeredDate: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                _count: { _all: true },
                orderBy: { registeredDate: 'asc' },
            }),
            // --- Course Analytics Queries ---
            prisma.course.findMany({
                where: { status: 'PUBLISHED' },
                orderBy: { enrollments: { _count: 'desc' } },
                take: 5,
                select: { id: true, title: true, imageUrl: true, _count: { select: { enrollments: true } } }
            }),
            prisma.courseProgress.findMany({
                where: { progressPercentage: { gte: 99 } },
                select: { course: { select: { id: true, title: true, imageUrl: true } } }
            }),
            // --- User Analytics Queries ---
            prisma.user.findMany({
                where: { role: 'STUDENT' },
                orderBy: { enrollments: { _count: 'desc' } },
                take: 5,
                select: { id: true, name: true, avatar: true, _count: { select: { enrollments: true } } }
            }),
            prisma.user.findMany({
                where: { role: 'STUDENT' },
                orderBy: { courseProgress: { _count: 'desc' } },
                take: 5,
                select: { id: true, name: true, avatar: true, _count: { select: { courseProgress: true } } }
            }),
            prisma.user.findMany({
                where: { role: 'INSTRUCTOR' },
                orderBy: { courses: { _count: 'desc' } },
                take: 5,
                select: { id: true, name: true, avatar: true, _count: { select: { courses: true } } }
            }),
        ]);

        // --- Process User Registration Trend ---
        const dailyRegistrations = new Map<string, number>();
        const intervalDays = eachDayOfInterval({ start: startDate, end: endDate });
        intervalDays.forEach(day => {
            dailyRegistrations.set(format(day, 'yyyy-MM-dd'), 0);
        });
        userRegistrations.forEach(reg => {
            if (reg.registeredDate) {
                const dayKey = format(reg.registeredDate, 'yyyy-MM-dd');
                dailyRegistrations.set(dayKey, (dailyRegistrations.get(dayKey) || 0) + reg._count._all);
            }
        });
        const userRegistrationTrend = Array.from(dailyRegistrations.entries()).map(([date, count]) => ({ date, count }));


        // --- Process Course Completion Analytics ---
        const completionCounts = courseCompletions.reduce((acc, { course }) => {
            acc[course.id] = (acc[course.id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const allEnrollments = await prisma.enrollment.groupBy({
            by: ['courseId'],
            _count: { _all: true },
        });

        const completionRates = allEnrollments.map(enroll => {
            const course = courseCompletions.find(c => c.course.id === enroll.courseId)?.course;
            if (!course || enroll._count._all === 0) return null;
            const rate = ((completionCounts[course.id] || 0) / enroll._count._all) * 100;
            return { id: course.id, title: course.title, imageUrl: course.imageUrl, value: rate };
        }).filter(Boolean);

        const averageCompletionRate = completionRates.length > 0 ? completionRates.reduce((acc, curr) => acc + curr!.value, 0) / completionRates.length : 0;
        
        const topCoursesByCompletion = [...completionRates].sort((a, b) => b!.value - a!.value).slice(0, 5);
        const lowestCoursesByCompletion = [...completionRates].sort((a, b) => a!.value - b!.value).slice(0, 5);
        
        const responsePayload = {
            totalUsers: totalUsersResult,
            totalCourses: totalCoursesResult,
            totalPublishedCourses: totalPublishedCoursesCount,
            totalEnrollments: totalEnrollmentsResult,
            usersByRole: usersByRole.map(group => ({ role: group.role, count: group._count.id })),
            coursesByStatus: coursesByStatus.map(group => ({ status: group.status, count: group._count.id })),
            recentLogins: recentLoginLogs.length,
            newEnrollmentsLast7Days: newEnrollmentsLast7DaysCount,
            userRegistrationTrend,
            averageCompletionRate,
            topCoursesByEnrollment: topCoursesByEnrollment.map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: c._count.enrollments })),
            topCoursesByCompletion,
            lowestCoursesByCompletion,
            topStudentsByEnrollment: topStudentsByEnrollment.map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.enrollments })),
            topStudentsByCompletion: topStudentsByCompletion.map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.courseProgress })),
            topInstructorsByCourses: topInstructorsByCourses.map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.courses })),
        };

        return NextResponse.json(responsePayload);

    } catch (error) {
        console.error('[ADMIN_DASHBOARD_STATS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener estadísticas del dashboard' }, { status: 500 });
    }
}
