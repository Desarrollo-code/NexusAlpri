
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { subDays, startOfDay } from 'date-fns';
import type { UserRole, CourseStatus } from '@/types';

export const dynamic = 'force-dynamic';

// Helper function to create a date range for trend analysis
const createDateRange = (startDate: Date, endDate: Date) => {
    const dates = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const today = new Date();
        const thirtyDaysAgo = startOfDay(subDays(today, 30));
        const sevenDaysAgo = startOfDay(subDays(today, 7));

        // --- Aggregate Queries in a Transaction ---
        const [
            totalUsersResult,
            totalCoursesResult,
            totalPublishedCoursesCount,
            totalEnrollmentsResult,
            usersByRole,
            coursesByStatus,
            recentLoginLogs,
            newUsersLast7DaysCount,
            allCourseProgressRaw,
            coursesWithEnrollmentCounts,
            topInstructorsByCourses,
            userRegistrationsByDay,
            courseCreationByDay,
            coursePublicationByDay,
            enrollmentsByDay
        ] = await prisma.$transaction([
            prisma.user.count(),
            prisma.course.count(),
            prisma.course.count({ where: { status: 'PUBLISHED' } }),
            prisma.enrollment.count(),
            prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
            prisma.course.groupBy({ by: ['status'], _count: { status: true } }),
            prisma.securityLog.findMany({ 
                where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: sevenDaysAgo } },
                select: { userId: true },
                distinct: ['userId']
            }),
            prisma.user.count({ where: { registeredDate: { gte: sevenDaysAgo, not: null } } }),
            prisma.courseProgress.findMany({ 
                where: { course: { status: 'PUBLISHED' } }, // Only consider progress for published courses
                select: { courseId: true, progressPercentage: true, userId: true } 
            }),
            prisma.course.findMany({ where: { status: 'PUBLISHED' }, select: { id: true, title: true, imageUrl: true, _count: { select: { enrollments: true } } }, orderBy: { enrollments: { _count: 'desc' } }, take: 5 }),
            prisma.course.groupBy({ by: ['instructorId'], where: { instructorId: { not: null } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5 }),
            prisma.user.groupBy({ by: ['registeredDate'], where: { registeredDate: { gte: thirtyDaysAgo, not: null } }, _count: { _all: true }, orderBy: { registeredDate: 'asc' } }),
            prisma.course.groupBy({ by: ['createdAt'], where: { createdAt: { gte: thirtyDaysAgo } }, _count: { _all: true }, orderBy: { createdAt: 'asc' } }),
            prisma.course.groupBy({ by: ['publicationDate'], where: { status: 'PUBLISHED', publicationDate: { gte: thirtyDaysAgo, not: null } }, _count: { _all: true }, orderBy: { publicationDate: 'asc' } }),
            prisma.enrollment.groupBy({ by: ['enrolledAt'], where: { enrolledAt: { gte: thirtyDaysAgo } }, _count: { _all: true }, orderBy: { enrolledAt: 'asc' } })
        ]);
        
        const uniqueActiveUsers = recentLoginLogs.length;

        const dateRange = createDateRange(thirtyDaysAgo, today);

        const formatTrendData = (data: { registeredDate?: Date | null, createdAt?: Date, publicationDate?: Date | null, enrolledAt?: Date, _count: { _all: number }} []) => {
            const dateKey = 'registeredDate' in data[0] ? 'registeredDate' : 'createdAt' in data[0] ? 'createdAt' : 'publicationDate' in data[0] ? 'publicationDate' : 'enrolledAt';
            const map = new Map(data.map(item => [startOfDay(item[dateKey]!).toISOString().split('T')[0], item._count._all]));
            return dateRange.map(date => {
                const dayString = date.toISOString().split('T')[0];
                return { date: dayString, count: map.get(dayString) || 0 };
            });
        };
        const userRegistrationTrend = userRegistrationsByDay.length > 0 ? formatTrendData(userRegistrationsByDay as any) : [];

        const courseActivity = dateRange.map(date => {
            const dayString = date.toISOString().split('T')[0];
            return {
                date: dayString,
                newCourses: courseCreationByDay.find(d => startOfDay(d.createdAt).toISOString().split('T')[0] === dayString)?._count._all || 0,
                publishedCourses: coursePublicationByDay.find(d => d.publicationDate && startOfDay(d.publicationDate).toISOString().split('T')[0] === dayString)?._count._all || 0,
                newEnrollments: enrollmentsByDay.find(d => startOfDay(d.enrolledAt).toISOString().split('T')[0] === dayString)?._count._all || 0,
            };
        });
        
        const instructorIds = topInstructorsByCourses.map(i => i.instructorId).filter(Boolean) as string[];
        const topInstructorsInfo = await prisma.user.findMany({ where: { id: { in: instructorIds } }, select: { id: true, name: true, avatar: true } });
        
        const topInstructorsData = topInstructorsByCourses.map(i => {
            const instructor = topInstructorsInfo.find(info => info.id === i.instructorId);
            return { id: instructor?.id || '', name: instructor?.name, avatar: instructor?.avatar, value: i._count.id };
        });

        const completionRatesByCourse = new Map<string, { total: number, sum: number }>();
        allCourseProgressRaw.forEach(p => {
            const rate = completionRatesByCourse.get(p.courseId) || { total: 0, sum: 0 };
            rate.total++;
            rate.sum += p.progressPercentage || 0;
            completionRatesByCourse.set(p.courseId, rate);
        });

        const avgCompletionByCourse = new Map<string, number>();
        completionRatesByCourse.forEach((value, key) => {
            avgCompletionByCourse.set(key, value.sum / value.total);
        });

        const allPublishedCourses = await prisma.course.findMany({ where: { status: 'PUBLISHED' }, select: { id: true, title: true, imageUrl: true }});

        const topCoursesByCompletion = [...avgCompletionByCourse.entries()]
            .sort(([, a], [, b]) => b - a).slice(0, 5)
            .map(([id, value]) => ({ id, value: Math.round(value), ...allPublishedCourses.find(c => c.id === id) }));

        const lowestCoursesByCompletion = [...avgCompletionByCourse.entries()]
            .sort(([, a], [, b]) => a - b).slice(0, 5)
            .map(([id, value]) => ({ id, value: Math.round(value), ...allPublishedCourses.find(c => c.id === id) }));
        
        const topCoursesByEnrollment = coursesWithEnrollmentCounts.map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: c._count.enrollments }));

        const topStudentsByEnrollmentRaw = await prisma.enrollment.groupBy({ by: ['userId'], _count: { userId: true }, orderBy: { _count: { userId: 'desc' } }, take: 5 });
        const studentEnrollmentIds = topStudentsByEnrollmentRaw.map(s => s.userId);
        const topStudentsEnrollmentInfo = await prisma.user.findMany({ where: { id: { in: studentEnrollmentIds } }, select: { id: true, name: true, avatar: true }});
        const topStudentsByEnrollment = topStudentsByEnrollmentRaw.map(s => ({...topStudentsEnrollmentInfo.find(u => u.id === s.userId), value: s._count.userId }));

        const topStudentsByCompletionRaw = await prisma.courseProgress.groupBy({ by: ['userId'], where: { progressPercentage: 100 }, _count: { userId: true }, orderBy: { _count: { userId: 'desc' } }, take: 5 });
        const studentCompletionIds = topStudentsByCompletionRaw.map(s => s.userId);
        const topStudentsCompletionInfo = await prisma.user.findMany({ where: { id: { in: studentCompletionIds } }, select: { id: true, name: true, avatar: true }});
        const topStudentsByCompletion = topStudentsByCompletionRaw.map(s => ({...topStudentsCompletionInfo.find(u => u.id === s.userId), value: s._count.userId }));

        const totalProgressRecords = await prisma.courseProgress.count();
        const sumOfPercentages = await prisma.courseProgress.aggregate({ _sum: { progressPercentage: true } });
        const totalCompletionRate = totalProgressRecords > 0 ? (sumOfPercentages._sum.progressPercentage ?? 0) / totalProgressRecords : 0;


        const responsePayload = {
            totalUsers: totalUsersResult,
            totalCourses: totalCoursesResult,
            totalPublishedCourses: totalPublishedCoursesCount,
            totalEnrollments: totalEnrollmentsResult,
            usersByRole: usersByRole.map(u => ({ role: u.role, count: u._count.role })),
            coursesByStatus: coursesByStatus.map(c => ({ status: c.status, count: c._count.status })),
            recentLogins: uniqueActiveUsers,
            newUsersLast7Days: newUsersLast7DaysCount,
            userRegistrationTrend,
            courseActivity,
            averageCompletionRate: Math.round(totalCompletionRate),
            topCoursesByEnrollment,
            topCoursesByCompletion,
            lowestCoursesByCompletion,
            topStudentsByEnrollment,
            topStudentsByCompletion,
            topInstructorsByCourses: topInstructorsData
        };

        return NextResponse.json(responsePayload);

    } catch (error) {
        console.error('[ADMIN_DASHBOARD_STATS_ERROR]', error);
        return NextResponse.json({ error: 'Error al obtener estadísticas del dashboard' }, { status: 500 });
    }
}
