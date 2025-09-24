// src/app/api/dashboard/data/route.ts
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { UserRole, CourseStatus, AdminDashboardStats, SecurityLog as AppSecurityLog, Course, EnrolledCourse } from '@/types';
import type { User as PrismaUser, Course as PrismaCourse } from '@prisma/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { mapApiCourseToAppCourse } from '@/lib/course-utils';

export const dynamic = 'force-dynamic';

interface SecurityLogWithUser extends AppSecurityLog {
    user: Pick<PrismaUser, 'id' | 'name' | 'avatar'> | null;
}

// Helper function to safely execute a Prisma query and return a fallback on error.
async function safeQuery<T>(query: Promise<T>, fallback: T, queryName: string): Promise<T> {
    try {
        return await query;
    } catch (error) {
        console.error(`Error in safeQuery for [${queryName}]:`, error);
        return fallback;
    }
}

async function getAdminDashboardData(session: PrismaUser) {
    const sevenDaysAgo = subDays(new Date(), 7);

    const [
        totalUsers, totalCourses, totalPublishedCourses, totalEnrollments,
        recentLogins, newEnrollmentsLast7Days,
        recentAnnouncements, securityLogs
    ] = await Promise.all([
        safeQuery(prisma.user.count(), 0, 'totalUsers'),
        safeQuery(prisma.course.count(), 0, 'totalCourses'),
        safeQuery(prisma.course.count({ where: { status: 'PUBLISHED' } }), 0, 'totalPublishedCourses'),
        safeQuery(prisma.enrollment.count(), 0, 'totalEnrollments'),
        safeQuery(prisma.securityLog.count({ where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: sevenDaysAgo } }, distinct: ['userId'] }), 0, 'recentLogins'),
        safeQuery(prisma.enrollment.count({ where: { enrolledAt: { gte: sevenDaysAgo } } }), 0, 'newEnrollmentsLast7Days'),
        safeQuery(prisma.announcement.findMany({
            take: 2, orderBy: { date: 'desc' },
            include: { 
                author: { select: { id: true, name: true, avatar: true } }, 
                attachments: true, 
                reactions: { select: { userId: true, reaction: true, user: { select: { id: true, name: true, avatar: true } } } }, 
                _count: { select: { reads: true, reactions: true } },
            },
        }), [], 'recentAnnouncements'),
        safeQuery(prisma.securityLog.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, avatar: true } } } }), [], 'securityLogs')
    ]);
    
    // Placeholder for more complex stats
    const stats: Partial<AdminDashboardStats> = {
        totalUsers, totalCourses, totalPublishedCourses, totalEnrollments,
        recentLogins, newEnrollmentsLast7Days,
    };

    return {
        adminStats: stats,
        recentAnnouncements,
        securityLogs,
    };
}

async function getInstructorDashboardData(session: PrismaUser) {
    const [taughtCoursesResponse, announcementsData] = await Promise.all([
        safeQuery(prisma.course.findMany({
            where: { instructorId: session.id },
            include: { _count: { select: { modules: true } } },
            orderBy: { createdAt: 'desc' },
            take: 4,
        }), [], 'taughtCourses'),
        safeQuery(prisma.announcement.findMany({
            take: 2, orderBy: { date: 'desc' },
            include: { 
                author: { select: { id: true, name: true, avatar: true } },
                attachments: true, 
                reactions: { select: { userId: true, reaction: true, user: { select: { id: true, name: true, avatar: true } } } }, 
                _count: { select: { reads: true, reactions: true } },
            },
        }), [], 'announcementsData')
    ]);
    const totalTaughtCourses = await safeQuery(prisma.course.count({ where: { instructorId: session.id } }), 0, 'totalTaughtCourses');
    
    return {
        instructorStats: { taught: totalTaughtCourses },
        taughtCourses: taughtCoursesResponse.map(c => mapApiCourseToAppCourse(c as any)),
        recentAnnouncements: announcementsData,
    };
}

async function getStudentDashboardData(session: PrismaUser) {
    const [enrolledData, announcementsData] = await Promise.all([
        safeQuery(prisma.enrollment.findMany({
            where: { userId: session.id },
            include: { course: { include: { instructor: { select: { name: true } }, _count: { select: { modules: true } } } }, progress: true },
            orderBy: { enrolledAt: 'desc' },
            take: 4,
        }), [], 'enrolledData'),
        safeQuery(prisma.announcement.findMany({
            take: 2, orderBy: { date: 'desc' },
            include: { 
                author: { select: { id: true, name: true, avatar: true } },
                attachments: true, 
                reactions: { select: { userId: true, reaction: true, user: { select: { id: true, name: true, avatar: true } } } }, 
                _count: { select: { reads: true, reactions: true } },
            },
        }), [], 'announcementsData')
    ]);

    const totalEnrollments = await safeQuery(prisma.enrollment.count({ where: { userId: session.id } }), 0, 'totalEnrollments');
    const completedCount = await safeQuery(prisma.courseProgress.count({ where: { userId: session.id, progressPercentage: 100 } }), 0, 'completedCount');

    const mappedCourses: EnrolledCourse[] = enrolledData.map(item => ({
        id: item.course.id, title: item.course.title, description: item.course.description, instructor: item.course.instructor?.name || 'N/A',
        imageUrl: item.course.imageUrl, modulesCount: item.course._count.modules || 0,
        enrolledAt: item.enrolledAt.toISOString(), isEnrolled: true, instructorId: item.course.instructorId, status: 'PUBLISHED',
        progressPercentage: item.progress?.progressPercentage || 0,
        modules: [],
    }));

    return {
        studentStats: { enrolled: totalEnrollments, completed: completedCount },
        myDashboardCourses: mappedCourses,
        recentAnnouncements: announcementsData,
    };
}

export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        let data: any = {};
        switch(session.role) {
            case 'ADMINISTRATOR':
                data = await getAdminDashboardData(session);
                break;
            case 'INSTRUCTOR':
                data = await getInstructorDashboardData(session);
                break;
            case 'STUDENT':
                data = await getStudentDashboardData(session);
                break;
            default:
                return NextResponse.json({ message: 'Rol de usuario no reconocido' }, { status: 400 });
        }
        return NextResponse.json(data);

    } catch (error) {
        console.error('[DASHBOARD_DATA_API_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los datos del panel principal' }, { status: 500 });
    }
}
