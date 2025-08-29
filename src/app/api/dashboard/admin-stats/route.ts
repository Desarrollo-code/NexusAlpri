// src/app/api/dashboard/admin-stats/route.ts
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { subDays, startOfDay, parseISO, endOfDay } from 'date-fns';
import type { UserRole, CourseStatus } from '@/types';

export const dynamic = 'force-dynamic';

// Función auxiliar para crear un rango de fechas para el análisis de tendencias
const createDateRange = (startDate: Date, endDate: Date) => {
    const dates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

// --- Tipos para los resultados de las consultas Raw ---
type RawInstructorResult = {
    id: string;
    name: string;
    avatar: string | null;
    value: bigint;
};

type RawStudentResult = {
    id: string;
    name: string;
    avatar: string | null;
    value: bigint;
};

export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Define the date range for filtering
    const endDate = endDateParam ? endOfDay(parseISO(endDateParam)) : endOfDay(new Date());
    const startDate = startDateParam ? startOfDay(parseISO(startDateParam)) : startOfDay(subDays(endDate, 29));

    const dateFilter = {
        gte: startDate,
        lte: endDate,
    };

    try {
        // --- Primero, obtenemos los IDs de los cursos publicados ---
        const publishedCourses = await prisma.course.findMany({
            where: { status: 'PUBLISHED' },
            select: { id: true }
        });
        const publishedCourseIds = publishedCourses.map(c => c.id);

        // --- Luego, ejecutamos el resto de las consultas en paralelo ---
        const [
            totalUsersResult,
            totalCoursesResult,
            totalPublishedCoursesCount,
            totalEnrollmentsResult,
            usersByRole,
            coursesByStatus,
            recentLoginLogs,
            newUsersCount,
            allCourseProgressRaw,
            coursesWithEnrollmentCounts,
            userRegistrationsByDay,
            courseCreationByDay,
            coursePublicationByDay,
            enrollmentsByDay,
            topInstructorsByCoursesRaw,
            topStudentsByEnrollmentRaw,
            topStudentsByCompletionRaw
        ] = await Promise.all([
            prisma.user.count(),
            prisma.course.count(),
            prisma.course.count({ where: { status: 'PUBLISHED' } }),
            prisma.enrollment.count(),
            prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
            prisma.course.groupBy({ by: ['status'], _count: { _all: true } }),
            prisma.securityLog.findMany({ 
                where: { event: 'SUCCESSFUL_LOGIN', createdAt: dateFilter },
                select: { userId: true },
                distinct: ['userId']
            }),
            prisma.user.count({ where: { registeredDate: dateFilter } }),
            prisma.courseProgress.findMany({ 
                where: { courseId: { in: publishedCourseIds } }, // Usamos los IDs filtrados
                select: { courseId: true, progressPercentage: true, userId: true } 
            }),
            prisma.course.findMany({ where: { status: 'PUBLISHED' }, select: { id: true, title: true, imageUrl: true, _count: { select: { enrollments: true } } }, orderBy: { enrollments: { _count: 'desc' } }, take: 5 }),
            prisma.user.groupBy({ by: ['registeredDate'], where: { registeredDate: dateFilter }, _count: { _all: true }, orderBy: { registeredDate: 'asc' } }),
            prisma.course.groupBy({ by: ['createdAt'], where: { createdAt: dateFilter }, _count: { _all: true }, orderBy: { createdAt: 'asc' } }),
            prisma.course.groupBy({ by: ['publicationDate'], where: { status: 'PUBLISHED', publicationDate: dateFilter }, _count: { _all: true }, orderBy: { publicationDate: 'asc' } }),
            prisma.enrollment.groupBy({ by: ['enrolledAt'], where: { enrolledAt: dateFilter }, _count: { _all: true }, orderBy: { enrolledAt: 'asc' } }),
            prisma.$queryRaw<RawInstructorResult[]>`
                SELECT u.id, u.name, u.avatar, COUNT(c.id) as value
                FROM Course c
                JOIN User u ON c.instructorId = u.id
                WHERE c.createdAt >= ${startDate} AND c.createdAt <= ${endDate}
                GROUP BY u.id
                ORDER BY value DESC
                LIMIT 5;
            `,
            prisma.$queryRaw<RawStudentResult[]>`
                SELECT u.id, u.name, u.avatar, COUNT(e.id) as value
                FROM Enrollment e
                JOIN User u ON e.userId = u.id
                WHERE e.enrolledAt >= ${startDate} AND e.enrolledAt <= ${endDate}
                GROUP BY u.id
                ORDER BY value DESC
                LIMIT 5;
            `,
            prisma.$queryRaw<RawStudentResult[]>`
                SELECT u.id, u.name, u.avatar, COUNT(cp.id) as value
                FROM CourseProgress cp
                JOIN User u ON cp.userId = u.id
                WHERE cp.progressPercentage = 100 AND cp.completedAt >= ${startDate} AND cp.completedAt <= ${endDate}
                GROUP BY u.id
                ORDER BY value DESC
                LIMIT 5;
            `,
        ]);
        
        const uniqueActiveUsers = recentLoginLogs.length;

        const dateRange = createDateRange(startDate, endDate);

        const formatTrendData = (data: { date: Date | null, count: number }[]) => {
            const map = new Map(data.map(item => [startOfDay(item.date!).toISOString().split('T')[0], item.count]));
            return dateRange.map(date => {
                const dayString = date.toISOString().split('T')[0];
                return { date: dayString, count: map.get(dayString) || 0 };
            });
        };
        
        const userRegistrationTrend = formatTrendData(userRegistrationsByDay.map(d => ({ date: d.registeredDate, count: d._count._all })));

        const courseActivity = dateRange.map(date => {
            const dayString = date.toISOString().split('T')[0];
            return {
                date: dayString,
                newCourses: courseCreationByDay.find(d => startOfDay(d.createdAt).toISOString().split('T')[0] === dayString)?._count._all || 0,
                publishedCourses: coursePublicationByDay.find(d => d.publicationDate && startOfDay(d.publicationDate).toISOString().split('T')[0] === dayString)?._count._all || 0,
                newEnrollments: enrollmentsByDay.find(d => startOfDay(d.enrolledAt).toISOString().split('T')[0] === dayString)?._count._all || 0,
            };
        });
        
        const topInstructorsData = topInstructorsByCoursesRaw.map(i => ({...i, value: Number(i.value)}));
        const topStudentsByEnrollment = topStudentsByEnrollmentRaw.map(s => ({...s, value: Number(s.value)}));
        const topStudentsByCompletion = topStudentsByCompletionRaw.map(s => ({...s, value: Number(s.value)}));

        const completionRatesByCourse = new Map<string, { total: number, sum: number }>();
        allCourseProgressRaw.forEach(p => {
            if (p.courseId) {
                const rate = completionRatesByCourse.get(p.courseId) || { total: 0, sum: 0 };
                rate.total++;
                rate.sum += p.progressPercentage || 0;
                completionRatesByCourse.set(p.courseId, rate);
            }
        });

        const avgCompletionByCourse = new Map<string, number>();
        completionRatesByCourse.forEach((value, key) => {
            avgCompletionByCourse.set(key, value.sum / value.total);
        });

        const allPublishedCoursesInfo = await prisma.course.findMany({ where: { status: 'PUBLISHED' }, select: { id: true, title: true, imageUrl: true }});

        const topCoursesByCompletion = [...avgCompletionByCourse.entries()]
            .sort(([, a], [, b]) => b - a).slice(0, 5)
            .map(([id, value]) => ({ id, value: Math.round(value), ...allPublishedCoursesInfo.find(c => c.id === id) }));

        const lowestCoursesByCompletion = [...avgCompletionByCourse.entries()]
            .sort(([, a], [, b]) => a - b).slice(0, 5)
            .map(([id, value]) => ({ id, value: Math.round(value), ...allPublishedCoursesInfo.find(c => c.id === id) }));
        
        const topCoursesByEnrollment = coursesWithEnrollmentCounts.map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: c._count.enrollments }));

        const totalProgressRecords = await prisma.courseProgress.count();
        const sumOfPercentages = await prisma.courseProgress.aggregate({ _sum: { progressPercentage: true } });
        const totalCompletionRate = totalProgressRecords > 0 ? (sumOfPercentages._sum.progressPercentage ?? 0) / totalProgressRecords : 0;


        const responsePayload = {
            totalUsers: totalUsersResult,
            totalCourses: totalCoursesResult,
            totalPublishedCourses: totalPublishedCoursesCount,
            totalEnrollments: totalEnrollmentsResult,
            usersByRole: usersByRole.map(u => ({ role: u.role, count: u._count._all })),
            coursesByStatus: coursesByStatus.map(c => ({ status: c.status, count: c._count._all })),
            recentLogins: uniqueActiveUsers,
            newUsersLast7Days: newUsersCount,
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
