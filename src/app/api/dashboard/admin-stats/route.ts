
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export interface AdminDashboardStats {
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
}


export async function GET(req: NextRequest) {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const [
            totalUsers,
            totalCourses,
            totalEnrollments,
        ] = await prisma.$transaction([
            prisma.user.count(),
            prisma.course.count(),
            prisma.enrollment.count(),
        ]);

        const stats: AdminDashboardStats = {
            totalUsers,
            totalCourses,
            totalEnrollments,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('[ADMIN_DASHBOARD_STATS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas del dashboard' }, { status: 500 });
    }
}
