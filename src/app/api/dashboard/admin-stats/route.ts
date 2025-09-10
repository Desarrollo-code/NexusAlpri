// src/app/api/dashboard/admin-stats/route.ts
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { subDays, startOfDay, endOfDay, parseISO, format } from 'date-fns';
import type { UserRole, CourseStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    console.log("[ADMIN_STATS] Request received at:", new Date().toISOString());
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const [
            totalUsersResult,
            totalCoursesResult,
            totalPublishedCoursesCount,
            totalEnrollmentsResult,
            adminCount,
            instructorCount,
            studentCount,
            draftCoursesCount,
            publishedCoursesCount,
            archivedCoursesCount,
            recentLoginLogs,
            newEnrollmentsLast7DaysCount,
        ] = await prisma.$transaction([
            prisma.user.count(),
            prisma.course.count(),
            prisma.course.count({ where: { status: 'PUBLISHED' } }),
            prisma.enrollment.count(),
            // Counts per role
            prisma.user.count({ where: { role: 'ADMINISTRATOR' } }),
            prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
            prisma.user.count({ where: { role: 'STUDENT' } }),
            // Counts per course status
            prisma.course.count({ where: { status: 'DRAFT' } }),
            prisma.course.count({ where: { status: 'PUBLISHED' } }),
            prisma.course.count({ where: { status: 'ARCHIVED' } }),
            // Recent activity
            prisma.securityLog.findMany({
                where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: subDays(new Date(), 7) } },
                select: { userId: true },
                distinct: ['userId']
            }),
            prisma.enrollment.count({ where: { enrolledAt: { gte: subDays(new Date(), 7) } } }),
        ]);

        const usersByRole = [
            { role: 'ADMINISTRATOR', count: adminCount },
            { role: 'INSTRUCTOR', count: instructorCount },
            { role: 'STUDENT', count: studentCount },
        ];
        
        const coursesByStatus = [
            { status: 'DRAFT', count: draftCoursesCount },
            { status: 'PUBLISHED', count: publishedCoursesCount },
            { status: 'ARCHIVED', count: archivedCoursesCount },
        ];
        
        const uniqueActiveUsers = recentLoginLogs.length;

        const responsePayload = {
            totalUsers: totalUsersResult,
            totalCourses: totalCoursesResult,
            totalPublishedCourses: totalPublishedCoursesCount,
            totalEnrollments: totalEnrollmentsResult,
            usersByRole: usersByRole,
            coursesByStatus: coursesByStatus,
            recentLogins: uniqueActiveUsers,
            newEnrollmentsLast7Days: newEnrollmentsLast7DaysCount,
            // Las analíticas complejas se cargarán por separado en el cliente
            userRegistrationTrend: [],
            courseActivity: [],
            averageCompletionRate: 0,
            topCoursesByEnrollment: [],
            topCoursesByCompletion: [],
            lowestCoursesByCompletion: [],
            topStudentsByEnrollment: [],
            topStudentsByCompletion: [],
            topInstructorsByCourses: []
        };

        return NextResponse.json(responsePayload);

    } catch (error) {
        console.error('[ADMIN_DASHBOARD_STATS_ERROR] Ocurrió un error detallado:', JSON.stringify(error, null, 2));
        return NextResponse.json({ error: 'Error al obtener estadísticas del dashboard' }, { status: 500 });
    }
}
