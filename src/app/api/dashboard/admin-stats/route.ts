// src/app/api/dashboard/admin-stats/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { startOfDay, subDays, format } from 'date-fns';
import type { UserRole, CourseStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getCurrentUser();

        if (!session || session.role !== 'ADMINISTRATOR') {
            return NextResponse.json({ message: 'Acceso no autorizado. Se requieren permisos de administrador.' }, { status: 403 });
        }

        const today = new Date();
        const thirtyDaysAgo = startOfDay(subDays(today, 30));
        const sevenDaysAgo = startOfDay(subDays(today, 7));

        const [
            totalUsersResult,
            totalCoursesResult,
            totalPublishedCoursesCount,
            totalEnrollmentsResult,
            usersByRole,
            coursesByStatus,
            recentLoginsCount,
            newUsersLast7DaysCount,
            recentUsersData,
            newCoursesData,
            publishedCoursesData,
            newEnrollmentsData,
            allCourseProgressRaw,
            coursesWithEnrollmentCounts,
            studentsByEnrollmentRaw,
            instructorsByCoursesRaw
        ] = await prisma.$transaction([
            // ✅ CORRECCIÓN: Se usa `{ where: {} }` para evitar errores de validación con count().
            prisma.user.count({ where: {} }), 
            prisma.course.count({ where: {} }),
            prisma.course.count({ where: { status: 'PUBLISHED' } }),
            prisma.enrollment.count({ where: {} }),
            prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
            prisma.course.groupBy({ by: ['status'], _count: { _all: true } }),
            prisma.securityLog.count({ where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: sevenDaysAgo } } }),
            prisma.user.count({ where: { registeredDate: { gte: sevenDaysAgo } } }),
            prisma.user.findMany({ where: { registeredDate: { gte: sevenDaysAgo } }, select: { registeredDate: true } }),
            prisma.course.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } }),
            prisma.course.findMany({ where: { publicationDate: { not: null, gte: thirtyDaysAgo } }, select: { publicationDate: true } }),
            prisma.enrollment.findMany({ where: { enrolledAt: { gte: thirtyDaysAgo } }, select: { enrolledAt: true } }),
            prisma.courseProgress.findMany({ where: { enrollment: { userId: { not: null } } }, select: { enrollment: { select: { userId: true, courseId: true } }, progressPercentage: true } }),
            prisma.course.findMany({ where: { status: 'PUBLISHED' }, select: { id: true, title: true, imageUrl: true, _count: { select: { enrollments: true } } } }),
            prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true, name: true, avatar: true, _count: { select: { enrollments: true } } }, orderBy: { enrollments: { _count: 'desc' } }, take: 5 }),
            prisma.user.findMany({ where: { role: { in: ['INSTRUCTOR', 'ADMINISTRATOR'] } }, select: { id: true, name: true, avatar: true, _count: { select: { courses: true } } }, orderBy: { courses: { _count: 'desc' } }, take: 5 }),
        ]);

        // ✅ LOG PARA DEPURACIÓN
        console.log('[DEBUG-ADMIN-STATS] Resultados de Prisma:', {
            totalUsersResult,
            totalCoursesResult,
            totalPublishedCoursesCount,
            totalEnrollmentsResult,
            usersByRole,
            coursesByStatus,
            recentLoginsCount,
            newUsersLast7DaysCount,
        });

        const courseActivityData: Record<string, { newCourses: number, publishedCourses: number, newEnrollments: number }> = {};
        for (let i = 0; i < 30; i++) {
            const date = format(subDays(today, i), 'yyyy-MM-dd');
            courseActivityData[date] = { newCourses: 0, publishedCourses: 0, newEnrollments: 0 };
        }

        newCoursesData.forEach(course => {
            const date = format(course.createdAt, 'yyyy-MM-dd');
            if (courseActivityData[date]) courseActivityData[date].newCourses++;
        });
        publishedCoursesData.forEach(course => {
            if (course.publicationDate) {
                const date = format(course.publicationDate, 'yyyy-MM-dd');
                if (courseActivityData[date]) courseActivityData[date].publishedCourses++;
            }
        });
        newEnrollmentsData.forEach(enrollment => {
            const date = format(enrollment.enrolledAt, 'yyyy-MM-dd');
            if (courseActivityData[date]) courseActivityData[date].newEnrollments++;
        });
        const courseActivity = Object.entries(courseActivityData).map(([date, counts]) => ({ date, ...counts })).reverse();

        const userRegistrationTrendData: { [key: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
            const date = format(subDays(today, i), 'yyyy-MM-dd');
            userRegistrationTrendData[date] = 0;
        }
        recentUsersData.forEach(user => {
            if (user.registeredDate) {
              const date = format(user.registeredDate, 'yyyy-MM-dd');
              if (userRegistrationTrendData[date] !== undefined) userRegistrationTrendData[date]++;
            }
        });
        const userRegistrationTrend = Object.keys(userRegistrationTrendData).map(date => ({ date, count: userRegistrationTrendData[date] }));

        const courseCompletionStats: { [courseId: string]: { totalProgress: number; count: number; title: string; imageUrl: string | null } } = {};
        allCourseProgressRaw.forEach(cp => {
            if (cp.enrollment?.courseId) {
                const courseInfo = coursesWithEnrollmentCounts.find(c => c.id === cp.enrollment.courseId);
                if (courseInfo) {
                    if (!courseCompletionStats[cp.enrollment.courseId]) {
                        courseCompletionStats[cp.enrollment.courseId] = { totalProgress: 0, count: 0, title: courseInfo.title, imageUrl: courseInfo.imageUrl };
                    }
                    courseCompletionStats[cp.enrollment.courseId].totalProgress += cp.progressPercentage || 0;
                    courseCompletionStats[cp.enrollment.courseId].count++;
                }
            }
        });

        const allCourseCompletions = Object.entries(courseCompletionStats).map(([id, stats]) => ({
            id,
            title: stats.title,
            imageUrl: stats.imageUrl,
            value: stats.count > 0 ? parseFloat((stats.totalProgress / stats.count).toFixed(2)) : 0,
        }));
        
        const totalCompletionRateSum = allCourseCompletions.reduce((acc, curr) => acc + curr.value, 0);
        const averageCompletionRate = allCourseCompletions.length > 0 ? totalCompletionRateSum / allCourseCompletions.length : 0;

        const topCoursesByCompletion = [...allCourseCompletions].sort((a,b) => b.value - a.value).slice(0, 5);
        const lowestCoursesByCompletion = [...allCourseCompletions].sort((a,b) => a.value - b.value).slice(0, 5);
        
        const studentInfoMap = new Map((await prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true, name: true, avatar: true } })).map(u => [u.id, u]));

        const studentCompletionCounts = allCourseProgressRaw.reduce((acc, cp) => {
            if (cp.enrollment && cp.progressPercentage && cp.progressPercentage >= 100 && cp.enrollment.userId) {
                acc[cp.enrollment.userId] = (acc[cp.enrollment.userId] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const topStudentsByCompletion = Object.entries(studentCompletionCounts)
            .map(([userId, count]) => ({
                id: userId,
                name: studentInfoMap.get(userId)?.name || 'Estudiante Desconocido',
                avatar: studentInfoMap.get(userId)?.avatar || null,
                value: count,
            }))
            .sort((a, b) => b.value - a.value).slice(0, 5);

        const adminStats = {
            totalUsers: totalUsersResult,
            totalCourses: totalCoursesResult,
            totalPublishedCourses: totalPublishedCoursesCount,
            totalEnrollments: totalEnrollmentsResult,
            usersByRole: usersByRole.map(item => ({ role: item.role, count: item._count._all })),
            coursesByStatus: coursesByStatus.map(item => ({ status: item.status, count: item._count._all })),
            recentLogins: recentLoginsCount,
            newUsersLast7Days: newUsersLast7DaysCount,
            userRegistrationTrend,
            courseActivity,
            averageCompletionRate: parseFloat(averageCompletionRate.toFixed(2)),
            topCoursesByEnrollment: coursesWithEnrollmentCounts.sort((a, b) => b._count.enrollments - a._count.enrollments).slice(0, 5).map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: c._count.enrollments })),
            topCoursesByCompletion,
            lowestCoursesByCompletion,
            topStudentsByEnrollment: studentsByEnrollmentRaw.map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.enrollments })),
            topStudentsByCompletion,
            topInstructorsByCourses: instructorsByCoursesRaw.map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.courses })),
        };

        return NextResponse.json(adminStats);

    } catch (error) {
        console.error('[ADMIN_DASHBOARD_STATS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas del dashboard' }, { status: 500 });
    }
}
