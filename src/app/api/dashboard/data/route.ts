
// src/app/api/dashboard/data/route.ts
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { UserRole, CourseStatus, AdminDashboardStats, EnrolledCourse, Course, Announcement } from '@/types';
import type { User as PrismaUser, Course as PrismaCourse } from '@prisma/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { mapApiCourseToAppCourse } from '@/lib/course-utils';

export const dynamic = 'force-dynamic';

// Helper function to safely execute a Prisma query and return a fallback on error.
async function safeQuery<T>(query: Promise<T>, fallback: T, queryName: string): Promise<T> {
    try {
        return await query;
    } catch (error) {
        console.error(`Error in safeQuery for [${queryName}]:`, error);
        return fallback;
    }
}

async function getAdminDashboardData(startDate?: Date, endDate?: Date) {
    const dateFilter = {
        createdAt: {
            gte: startDate,
            lte: endDate
        }
    };
    const enrollmentDateFilter = {
        enrolledAt: {
            gte: startDate,
            lte: endDate
        }
    };

    const [
        totalUsers, totalCourses, totalPublishedCourses, totalEnrollments,
        totalResources, totalAnnouncements, totalForms, usersByRole, coursesByStatus,
        recentLogins, newEnrollmentsLast7Days,
        recentAnnouncements, securityLogs,
        coursesWithProgress, instructorsWithCourseCounts
    ] = await Promise.all([
        safeQuery(prisma.user.count({ where: startDate ? dateFilter : undefined }), 0, 'totalUsers'),
        safeQuery(prisma.course.count({ where: startDate ? dateFilter : undefined }), 0, 'totalCourses'),
        safeQuery(prisma.course.count({ where: { status: 'PUBLISHED', ...(startDate && { createdAt: { gte: startDate, lte: endDate } }) } }), 0, 'totalPublishedCourses'),
        safeQuery(prisma.enrollment.count({ where: startDate ? enrollmentDateFilter : undefined }), 0, 'totalEnrollments'),
        safeQuery(prisma.enterpriseResource.count({ where: startDate ? dateFilter : undefined }), 0, 'totalResources'),
        safeQuery(prisma.announcement.count({ where: startDate ? dateFilter : undefined }), 0, 'totalAnnouncements'),
        safeQuery(prisma.form.count({ where: startDate ? dateFilter : undefined }), 0, 'totalForms'),
        safeQuery(prisma.user.groupBy({ by: ['role'], _count: { role: true }, where: startDate ? dateFilter : undefined }), [], 'usersByRole'),
        safeQuery(prisma.course.groupBy({ by: ['status'], _count: { status: true }, where: startDate ? dateFilter : undefined }), [], 'coursesByStatus'),
        safeQuery(prisma.securityLog.count({ where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: subDays(new Date(), 7) } }, distinct: ['userId'] }), 0, 'recentLogins'),
        safeQuery(prisma.enrollment.count({ where: { enrolledAt: { gte: subDays(new Date(), 7) } } }), 0, 'newEnrollmentsLast7Days'),
        safeQuery(prisma.announcement.findMany({ take: 2, orderBy: { date: 'desc' }, include: { author: { select: { id: true, name: true, avatar: true } }, attachments: true, reactions: { select: { userId: true, reaction: true, user: { select: { id: true, name: true, avatar: true } } } }, _count: { select: { reads: true, reactions: true } } } }), [], 'recentAnnouncements'),
        safeQuery(prisma.securityLog.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, avatar: true } } } }), [], 'securityLogs'),
        safeQuery(prisma.course.findMany({
            where: { status: 'PUBLISHED' },
            include: {
                _count: { select: { enrollments: true } },
                enrollments: { select: { progress: { select: { progressPercentage: true } } } }
            }
        }), [], 'coursesWithProgress'),
        safeQuery(prisma.user.findMany({
            where: { role: 'INSTRUCTOR' },
            include: { _count: { select: { courses: true } } }
        }), [], 'instructorsWithCourseCounts'),
    ]);

    const activityEndDate = endDate || new Date();
    const activityStartDate = startDate || subDays(activityEndDate, 29);
    
    const [newCoursesTrend, newEnrollmentsTrend] = await Promise.all([
        safeQuery(prisma.course.groupBy({ by: ['createdAt'], _count: { _all: true }, where: { createdAt: { gte: activityStartDate, lte: activityEndDate } }, orderBy: { createdAt: 'asc' } }), [], 'newCoursesTrend'),
        safeQuery(prisma.enrollment.groupBy({ by: ['enrolledAt'], _count: { _all: true }, where: { enrolledAt: { gte: activityStartDate, lte: activityEndDate } }, orderBy: { enrolledAt: 'asc' } }), [], 'newEnrollmentsTrend'),
    ]);

    const activityMap = new Map<string, { newCourses: number, newEnrollments: number }>();
    for (let d = new Date(activityStartDate); d <= activityEndDate; d.setDate(d.getDate() + 1)) {
        activityMap.set(d.toISOString().split('T')[0], { newCourses: 0, newEnrollments: 0 });
    }
    newCoursesTrend.forEach(item => { const date = item.createdAt.toISOString().split('T')[0]; if (activityMap.has(date)) activityMap.get(date)!.newCourses += item._count._all; });
    newEnrollmentsTrend.forEach(item => { const date = item.enrolledAt.toISOString().split('T')[0]; if (activityMap.has(date)) activityMap.get(date)!.newEnrollments += item._count._all; });
    const userRegistrationTrend = Array.from(activityMap.entries()).map(([date, counts]) => ({ date, ...counts }));

    // --- Complex Calculations ---
    const completionRates = coursesWithProgress
        .map(c => {
            const validProgresses = c.enrollments.map(e => e.progress?.progressPercentage).filter(p => p !== null) as number[];
            return validProgresses.length > 0 ? validProgresses.reduce((a, b) => a + b, 0) / validProgresses.length : 0;
        })
        .filter(rate => rate > 0);
    const averageCompletionRate = completionRates.length > 0 ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length : 0;
    
    const topCoursesByEnrollment = coursesWithProgress.sort((a, b) => b._count.enrollments - a._count.enrollments).slice(0, 5).map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: c._count.enrollments }));
    const topCoursesByCompletion = coursesWithProgress.map(c => {
        const validProgresses = c.enrollments.map(e => e.progress?.progressPercentage).filter(p => p !== null) as number[];
        const avg = validProgresses.length > 0 ? validProgresses.reduce((a, b) => a + b, 0) / validProgresses.length : 0;
        return { id: c.id, title: c.title, imageUrl: c.imageUrl, value: avg };
    }).filter(c => c.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);

    const lowestCoursesByCompletion = [...topCoursesByCompletion].sort((a, b) => a.value - b.value).slice(0, 5);

    const studentsWithData = await safeQuery(prisma.user.findMany({ where: { role: 'STUDENT' }, include: { _count: { select: { enrollments: true, courseProgress: { where: { progressPercentage: 100 } } } } } }), [], 'studentsWithData');
    const topStudentsByEnrollment = studentsWithData.sort((a,b) => b._count.enrollments - a._count.enrollments).slice(0,5).map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.enrollments }));
    const topStudentsByCompletion = studentsWithData.sort((a,b) => b._count.courseProgress - a._count.courseProgress).slice(0,5).map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.courseProgress }));
    const topInstructorsByCourses = instructorsWithCourseCounts.sort((a, b) => b._count.courses - a._count.courses).slice(0, 5).map(i => ({ id: i.id, name: i.name, avatar: i.avatar, value: i._count.courses }));

    const stats: AdminDashboardStats = {
        totalUsers, totalCourses, totalPublishedCourses, totalEnrollments,
        totalResources, totalAnnouncements, totalForms,
        usersByRole: usersByRole.map(item => ({ role: item.role, count: item._count.role })),
        coursesByStatus: coursesByStatus.map(item => ({ status: item.status, count: item._count.status })),
        recentLogins, newEnrollmentsLast7Days, userRegistrationTrend,
        averageCompletionRate,
        topCoursesByEnrollment, topCoursesByCompletion, lowestCoursesByCompletion,
        topStudentsByEnrollment, topStudentsByCompletion, topInstructorsByCourses
    };

    return { adminStats: stats, recentAnnouncements, securityLogs };
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
        category: item.course.category || undefined,
        publicationDate: item.course.publicationDate
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
    
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    const startDate = startDateParam ? startOfDay(new Date(startDateParam)) : undefined;
    const endDate = endDateParam ? endOfDay(new Date(endDateParam)) : undefined;

    try {
        let data: any = {};
        switch(session.role) {
            case 'ADMINISTRATOR':
                data = await getAdminDashboardData(startDate, endDate);
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
