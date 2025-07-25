
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { subDays, startOfDay, format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import type { UserRole, CourseStatus } from '@/types';

type CourseInfo = {
    id: string;
    title: string;
    imageUrl: string | null;
    value: number;
}

type UserInfo = {
    id: string;
    name: string | null;
    avatar: string | null;
    value: number;
}

export interface AdminDashboardStats {
    totalUsers: number;
    totalCourses: number;
    totalPublishedCourses: number;
    totalEnrollments: number;
    usersByRole: { role: UserRole; count: number }[];
    coursesByStatus: { status: CourseStatus; count: number }[];
    recentLogins: number; // Active users in last 7 days
    newUsersLast7Days: number;
    userRegistrationTrend: { date: string, count: number }[];
    courseActivity: { date: string, newCourses: number, publishedCourses: number, newEnrollments: number }[];
    averageCompletionRate: number;
    topCoursesByEnrollment: CourseInfo[];
    topCoursesByCompletion: CourseInfo[];
    lowestCoursesByCompletion: CourseInfo[];
    topStudentsByEnrollment: UserInfo[];
    topStudentsByCompletion: UserInfo[];
    topInstructorsByCourses: UserInfo[];
}

export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        console.log(`Intento de acceso no autorizado al dashboard. Usuario: ${session?.name || 'N/A'}, Rol: ${session?.role || 'N/A'}`);
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const thirtyDaysAgo = subDays(new Date(), 30);
        const sevenDaysAgo = subDays(new Date(), 7);

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
            prisma.user.count({}),
            prisma.course.count({}),
            prisma.course.count({ where: { status: 'PUBLISHED' } }),
            prisma.enrollment.count({}),
            prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
            prisma.course.groupBy({ by: ['status'], _count: { _all: true } }),
            prisma.securityLog.groupBy({
                by: ['userId'],
                where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: sevenDaysAgo } },
            }),
            prisma.user.count({ where: { registeredDate: { gte: sevenDaysAgo } } }),
            prisma.user.findMany({ where: { registeredDate: { gte: startOfDay(sevenDaysAgo) } }, select: { registeredDate: true } }),
            prisma.course.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } }),
            prisma.course.findMany({ where: { publicationDate: { not: null, gte: thirtyDaysAgo } }, select: { publicationDate: true } }),
            prisma.enrollment.findMany({ where: { enrolledAt: { gte: thirtyDaysAgo } }, select: { enrolledAt: true } }),
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
                where: { progressPercentage: { gte: 100 }, courseId: { not: null } },
                _count: { userId: true },
                orderBy: { _count: { userId: 'desc' } },
                take: 5
            }),
            prisma.user.findMany({
                where: { role: { in: ['INSTRUCTOR', 'ADMINISTRATOR'] } },
                select: { id: true, name: true, avatar: true, _count: { select: { courses: true } } },
                orderBy: { courses: { _count: 'desc' } },
                take: 5
            }),
        ]);
        
        const dateRange7Days = eachDayOfInterval({ start: sevenDaysAgo, end: new Date() });
        const registrationsByDate = new Map<string, number>();
        recentUsersData.forEach(user => {
            if (user.registeredDate) {
                const dateKey = format(new Date(user.registeredDate), 'yyyy-MM-dd');
                registrationsByDate.set(dateKey, (registrationsByDate.get(dateKey) || 0) + 1);
            }
        });

        const userRegistrationTrend = dateRange7Days.map(date => {
            const dateKey = format(date, 'yyyy-MM-dd');
            return {
                date: format(date, 'MMM d', { locale: es }),
                count: registrationsByDate.get(dateKey) || 0,
            };
        });

        const dateRange30Days = eachDayOfInterval({ start: thirtyDaysAgo, end: new Date() });
        const courseActivityMap = new Map<string, { newCourses: number, publishedCourses: number, newEnrollments: number }>();
        
        dateRange30Days.forEach(day => {
            courseActivityMap.set(format(day, 'yyyy-MM-dd'), { newCourses: 0, publishedCourses: 0, newEnrollments: 0 });
        });

        newCoursesData.forEach(c => { const key = format(c.createdAt, 'yyyy-MM-dd'); if(courseActivityMap.has(key)) courseActivityMap.get(key)!.newCourses++; });
        publishedCoursesData.forEach(c => { if(c.publicationDate) { const key = format(c.publicationDate, 'yyyy-MM-dd'); if(courseActivityMap.has(key)) courseActivityMap.get(key)!.publishedCourses++; } });
        newEnrollmentsData.forEach(e => { const key = format(e.enrolledAt, 'yyyy-MM-dd'); if(courseActivityMap.has(key)) courseActivityMap.get(key)!.newEnrollments++; });
        
        const courseActivity = Array.from(courseActivityMap.entries()).map(([date, counts]) => ({
            date: format(new Date(date), 'MMM d', { locale: es }),
            ...counts
        }));

        const totalProgressSum = allCourseProgressRaw.reduce((sum, p) => sum + (p.progressPercentage || 0), 0);
        const averageCompletionRate = allCourseProgressRaw.length > 0 ? totalProgressSum / allCourseProgressRaw.length : 0;

        const topCoursesByEnrollment = coursesWithEnrollmentCounts
            .sort((a, b) => b._count.enrollments - a._count.enrollments)
            .slice(0, 5)
            .map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: c._count.enrollments }));

        const completionRatesByCourse = new Map<string, { total: number; count: number }>();
        allCourseProgressRaw.forEach(p => {
            if (p.courseId) {
                if (!completionRatesByCourse.has(p.courseId)) {
                    completionRatesByCourse.set(p.courseId, { total: 0, count: 0 });
                }
                const courseData = completionRatesByCourse.get(p.courseId)!;
                courseData.total += p.progressPercentage || 0;
                courseData.count++;
            }
        });

        const coursesWithAvgRates = coursesWithEnrollmentCounts.map(course => ({
            ...course,
            avgCompletion: completionRatesByCourse.has(course.id)
                ? completionRatesByCourse.get(course.id)!.total / completionRatesByCourse.get(course.id)!.count
                : 0,
        }));
        
        const topCoursesByCompletion = [...coursesWithAvgRates].sort((a, b) => b.avgCompletion - a.avgCompletion).slice(0, 5).map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: Math.round(c.avgCompletion) }));
        const lowestCoursesByCompletion = [...coursesWithAvgRates].filter(c => c._count.enrollments > 0).sort((a, b) => a.avgCompletion - b.avgCompletion).slice(0, 5).map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: Math.round(c.avgCompletion) }));
        
        const topCompleterIds = studentsByCompletionsRaw.map(s => s.userId);
        const topCompleterDetails = await prisma.user.findMany({ where: { id: { in: topCompleterIds } }, select: { id: true, name: true, avatar: true } });
        
        const topStudentsByCompletion = studentsByCompletionsRaw.map(s => {
            const userDetails = topCompleterDetails.find(u => u.id === s.userId);
            return { id: s.userId, name: userDetails?.name || 'Usuario desconocido', avatar: userDetails?.avatar || null, value: s._count.userId };
        });

        const stats: AdminDashboardStats = {
            totalUsers,
            totalCourses,
            totalPublishedCourses,
            totalEnrollments,
            usersByRole: usersByRole.map(item => ({ role: item.role as UserRole, count: item._count._all })),
            coursesByStatus: coursesByStatus.map(item => ({ status: item.status as CourseStatus, count: item._count._all })),
            recentLogins: recentLoginLogs.length,
            newUsersLast7Days,
            userRegistrationTrend,
            courseActivity,
            averageCompletionRate: Math.round(averageCompletionRate),
            topCoursesByEnrollment,
            topCoursesByCompletion,
            lowestCoursesByCompletion,
            topStudentsByEnrollment: studentsByEnrollmentRaw.map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.enrollments })),
            topStudentsByCompletion,
            topInstructorsByCourses: instructorsByCoursesRaw.map(i => ({ id: i.id, name: i.name, avatar: i.avatar, value: i._count.courses })),
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('[ADMIN_DASHBOARD_STATS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas del dashboard' }, { status: 500 });
    }
}
