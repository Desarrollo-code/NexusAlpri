
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { CourseStatus, UserRole } from '@/types';

export interface AdminDashboardStats {
    totalUsers: number;
    totalCourses: number;
    totalPublishedCourses: number;
    totalEnrollments: number;
    usersByRole: { role: UserRole; count: number }[];
    coursesByStatus: { status: CourseStatus; count: number }[];
}

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const totalUsers = await prisma.user.count();
        const totalCourses = await prisma.course.count();
        const totalPublishedCourses = await prisma.course.count({ where: { status: 'PUBLISHED' } });
        const totalEnrollments = await prisma.enrollment.count();

        const usersByRole = await prisma.user.groupBy({
            by: ['role'],
            _count: {
                role: true,
            },
        });

        const coursesByStatus = await prisma.course.groupBy({
            by: ['status'],
            _count: {
                status: true,
            },
        });

        const stats: AdminDashboardStats = {
            totalUsers,
            totalCourses,
            totalPublishedCourses,
            totalEnrollments,
            usersByRole: usersByRole.map(item => ({
                role: item.role as UserRole,
                count: item._count.role,
            })),
            coursesByStatus: coursesByStatus.map(item => ({
                status: item.status as CourseStatus,
                count: item._count.status,
            })),
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('[ADMIN_STATS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas' }, { status: 500 });
    }
}
