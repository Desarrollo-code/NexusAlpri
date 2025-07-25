
// src/app/api/dashboard/admin-stats/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { startOfDay, subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getCurrentUser();

        if (!session || session.role !== 'ADMINISTRATOR') {
            return NextResponse.json({ message: 'Acceso no autorizado. Se requieren permisos de administrador.' }, { status: 403 });
        }

        const today = new Date();
        const thirtyDaysAgo = subDays(today, 30);
        const sevenDaysAgo = subDays(today, 7);

        const [
            totalUsers,
            totalCourses,
            totalPublishedCourses,
            totalEnrollments,
            usersByRole,
            coursesByStatus,
            recentLoginLogs,
            newUsersLast7Days,
            recentUsersData,
            newCoursesData,
            publishedCoursesData,
            newEnrollmentsData,
            allCourseProgressRaw,
            coursesWithEnrollmentCounts,
            studentsByEnrollmentRaw,
            studentsByCompletionsRaw,
            instructorsByCoursesRaw
        ] = await prisma.$transaction([
            prisma.user.count(),
            prisma.course.count(),
            prisma.course.count({ where: { status: 'PUBLISHED' } }),
            prisma.enrollment.count(),
            prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
            prisma.course.groupBy({ by: ['status'], _count: { _all: true } }),
            prisma.securityLog.groupBy({
                by: ['userId'],
                where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: startOfDay(sevenDaysAgo) } },
            }),
            prisma.user.count({ where: { registeredDate: { gte: startOfDay(sevenDaysAgo) } } }),
            prisma.user.findMany({ where: { registeredDate: { gte: startOfDay(sevenDaysAgo) } }, select: { registeredDate: true } }),
            prisma.course.findMany({ where: { createdAt: { gte: startOfDay(thirtyDaysAgo) } }, select: { createdAt: true } }),
            prisma.course.findMany({ where: { publicationDate: { not: null, gte: startOfDay(thirtyDaysAgo) } }, select: { publicationDate: true } }),
            prisma.enrollment.findMany({ where: { enrolledAt: { gte: startOfDay(thirtyDaysAgo) } }, select: { enrolledAt: true } }),
            prisma.courseProgress.findMany({ where: { courseId: { not: null } }, select: { courseId: true, progressPercentage: true, userId: true } }),
            prisma.course.findMany({
                where: { status: 'PUBLISHED' },
                select: { id: true, title: true, imageUrl: true, _count: { select: { enrollments: true } } },
            }),
            prisma.user.findMany({
                where: { role: 'STUDENT' },
                select: { id: true, name: true, avatar: true, _count: { select: { enrollments: true } } },
                orderBy: { enrollments: { _count: 'desc' } },
                take: 5
            }),
            prisma.courseProgress.groupBy({
                by: ['userId'],
                where: { progressPercentage: { gte: 100 } },
                _count: { _all: true },
                orderBy: { _count: { _all: 'desc' } },
                take: 5
            }),
            prisma.user.findMany({
                where: { role: { in: ['INSTRUCTOR', 'ADMINISTRATOR'] } },
                select: { id: true, name: true, avatar: true, _count: { select: { courses: true } } },
                orderBy: { courses: { _count: 'desc' } },
                take: 5
            }),
        ]);

        const recentLoginsCount = recentLoginLogs.length;

        // Procesamiento de datos
        const usersData = recentUsersData.map(user => ({
            date: user.registeredDate,
            count: 1
        }));

        const courseActivityData: Record<string, { newCourses: number, publishedCourses: number, newEnrollments: number }> = {};

        newCoursesData.forEach(course => {
            const date = format(course.createdAt, 'yyyy-MM-dd');
            if (!courseActivityData[date]) courseActivityData[date] = { newCourses: 0, publishedCourses: 0, newEnrollments: 0 };
            courseActivityData[date].newCourses++;
        });

        publishedCoursesData.forEach(course => {
            if (course.publicationDate) {
                const date = format(course.publicationDate, 'yyyy-MM-dd');
                if (!courseActivityData[date]) courseActivityData[date] = { newCourses: 0, publishedCourses: 0, newEnrollments: 0 };
                courseActivityData[date].publishedCourses++;
            }
        });

        newEnrollmentsData.forEach(enrollment => {
            const date = format(enrollment.enrolledAt, 'yyyy-MM-dd');
            if (!courseActivityData[date]) courseActivityData[date] = { newCourses: 0, publishedCourses: 0, newEnrollments: 0 };
            courseActivityData[date].newEnrollments++;
        });
        
        const courseActivity = Object.entries(courseActivityData).map(([date, counts]) => ({ date, ...counts }));


        const courseProgressMap = new Map();
        allCourseProgressRaw.forEach(cp => {
            if (!courseProgressMap.has(cp.courseId)) {
                courseProgressMap.set(cp.courseId, { totalProgress: 0, count: 0 });
            }
            const data = courseProgressMap.get(cp.courseId);
            data.totalProgress += cp.progressPercentage || 0;
            data.count += 1;
        });

        let totalCompletionRate = 0;
        let coursesWithProgress = 0;
        courseProgressMap.forEach(data => {
            totalCompletionRate += data.totalProgress / data.count;
            coursesWithProgress++;
        });
        const averageCompletionRate = coursesWithProgress > 0 ? totalCompletionRate / coursesWithProgress : 0;
        
        const topCoursesByEnrollment = coursesWithEnrollmentCounts.sort((a, b) => b._count.enrollments - a._count.enrollments).slice(0, 5).map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: c._count.enrollments }));

        const courseCompletionStats: { [courseId: string]: { totalProgress: number; count: number; title: string; imageUrl: string | null } } = {};

        allCourseProgressRaw.forEach(cp => {
            if (!courseCompletionStats[cp.courseId]) {
                const courseInfo = coursesWithEnrollmentCounts.find(c => c.id === cp.courseId);
                courseCompletionStats[cp.courseId] = {
                    totalProgress: 0,
                    count: 0,
                    title: courseInfo?.title || 'Curso Desconocido',
                    imageUrl: courseInfo?.imageUrl || null,
                };
            }
            courseCompletionStats[cp.courseId].totalProgress += cp.progressPercentage || 0;
            courseCompletionStats[cp.courseId].count++;
        });

        const allCourseCompletions = Object.entries(courseCompletionStats).map(([id, stats]) => ({
            id,
            title: stats.title,
            imageUrl: stats.imageUrl,
            value: stats.count > 0 ? parseFloat((stats.totalProgress / stats.count).toFixed(2)) : 0,
        }));

        const topCoursesByCompletion = [...allCourseCompletions].sort((a,b) => b.value - a.value).slice(0, 5);
        const lowestCoursesByCompletion = [...allCourseCompletions].sort((a,b) => a.value - b.value).slice(0, 5);
        
        const studentCompletionCounts: { [userId: string]: number } = {};
        allCourseProgressRaw.forEach(cp => {
            if (cp.progressPercentage && cp.progressPercentage >= 100) {
                studentCompletionCounts[cp.userId] = (studentCompletionCounts[cp.userId] || 0) + 1;
            }
        });
        
        const studentInfoMap = new Map((await prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true, name: true, avatar: true } })).map(u => [u.id, u]));

        const topStudentsByEnrollment = studentsByEnrollmentRaw.map(user => ({
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            value: user._count.enrollments,
        }));
        
        const topStudentsByCompletion = Object.entries(studentCompletionCounts)
            .map(([userId, count]) => ({
                id: userId,
                name: studentInfoMap.get(userId)?.name || 'Estudiante Desconocido',
                avatar: studentInfoMap.get(userId)?.avatar || null,
                value: count,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const topInstructorsByCourses = instructorsByCoursesRaw.map(user => ({
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            value: user._count.courses,
        }));
        
        const formattedUsersByRole = usersByRole.map(item => ({ role: item.role, count: item._count._all }));
        const formattedCoursesByStatus = coursesByStatus.map(item => ({ status: item.status, count: item._count._all }));
        
        const userRegistrationTrendData: { [key: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
            const date = format(subDays(today, i), 'yyyy-MM-dd');
            userRegistrationTrendData[date] = 0;
        }
        recentUsersData.forEach(user => {
            const date = format(user.registeredDate, 'yyyy-MM-dd');
            if (userRegistrationTrendData[date] !== undefined) {
                userRegistrationTrendData[date]++;
            }
        });
        const userRegistrationTrend = Object.keys(userRegistrationTrendData).map(date => ({ date, count: userRegistrationTrendData[date] }));


        const adminStats = {
            totalUsers,
            totalCourses,
            totalPublishedCourses,
            totalEnrollments,
            usersByRole: formattedUsersByRole,
            coursesByStatus: formattedCoursesByStatus,
            recentLogins: recentLoginsCount,
            newUsersLast7Days: newUsersLast7Days,
            userRegistrationTrend: userRegistrationTrend,
            courseActivity: courseActivity,
            averageCompletionRate: parseFloat(averageCompletionRate.toFixed(2)),
            topCoursesByEnrollment,
            topCoursesByCompletion,
            lowestCoursesByCompletion,
            topStudentsByEnrollment,
            topStudentsByCompletion,
            topInstructorsByCourses,
        };

        return NextResponse.json(adminStats);

    } catch (error) {
        console.error('[ADMIN_DASHBOARD_STATS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas del dashboard' }, { status: 500 });
    }
}