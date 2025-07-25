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
            console.warn(`[ADMIN_DASHBOARD_AUTH_WARN] Intento de acceso no autorizado al dashboard. Usuario: ${session?.email || 'N/A'}, Rol: ${session?.role || 'N/A'}`);
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

        // Procesamiento de datos (esto asumo que está bien por ahora)
        const totalInstructors = usersByRole.find(r => r.role === 'INSTRUCTOR')?._count._all || 0;
        const totalStudents = usersByRole.find(r => r.role === 'STUDENT')?._count._all || 0;

        const usersData = recentUsersData.map(user => ({
            date: user.registeredDate,
            count: 1
        }));

        const coursesCreationData = newCoursesData.map(course => ({
            date: course.createdAt,
            count: 1
        }));

        const coursesPublicationData = publishedCoursesData.map(course => ({
            date: course.publicationDate,
            count: 1
        }));

        const enrollmentsData = newEnrollmentsData.map(enrollment => ({
            date: enrollment.enrolledAt,
            count: 1
        }));

        const courseProgressMap = new Map();
        allCourseProgressRaw.forEach(cp => {
            if (!courseProgressMap.has(cp.courseId)) {
                courseProgressMap.set(cp.courseId, { totalProgress: 0, count: 0 });
            }
            const data = courseProgressMap.get(cp.courseId);
            data.totalProgress += cp.progressPercentage;
            data.count += 1;
        });

        const averageCourseProgress = Array.from(courseProgressMap.values()).reduce((sum, data) => sum + (data.totalProgress / data.count), 0) / courseProgressMap.size || 0;


        const studentsByEnrollment = studentsByEnrollmentRaw.map(user => ({
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            enrollmentsCount: user._count.enrollments,
        }));

        const studentsByCompletions = studentsByCompletionsRaw.map(completion => ({
            userId: completion.userId,
            coursesCompleted: completion._count._all,
        }));

        const instructorsByCourses = instructorsByCoursesRaw.map(user => ({
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            coursesCount: user._count.courses,
        }));


        const adminStats = {
            totalUsers: totalUsers,
            totalCourses: totalCourses,
            totalPublishedCourses: totalPublishedCourses,
            totalEnrollments: totalEnrollments,
            usersByRole: usersByRole,
            coursesByStatus: coursesByStatus,
            recentLoginLogs: recentLoginLogs,
            newUsersLast7Days: newUsersLast7Days,
            recentUsersData: usersData,
            newCoursesData: coursesCreationData,
            publishedCoursesData: coursesPublicationData,
            newEnrollmentsData: enrollmentsData,
            averageCourseProgress: parseFloat(averageCourseProgress.toFixed(2)),
            coursesWithEnrollmentCounts: coursesWithEnrollmentCounts,
            topStudentsByEnrollment: studentsByEnrollment,
            topStudentsByCompletions: studentsByCompletions,
            topInstructorsByCourses: instructorsByCourses,
            totalInstructors: totalInstructors,
            totalStudents: totalStudents,
        };

        return NextResponse.json(adminStats);

    } catch (error) {
        console.error('[ADMIN_DASHBOARD_STATS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas del dashboard' }, { status: 500 });
    }
}