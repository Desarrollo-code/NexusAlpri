
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { CourseStatus, UserRole } from '@/types';
import type { NextRequest } from 'next/server';

export interface AnalyticsSummary {
    usersByRole: { role: UserRole; count: number }[];
    coursesByStatus: { status: CourseStatus; count: number }[];
}

export async function GET(req: NextRequest) {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const usersByRole = await prisma.user.groupBy({
            by: ['role'],
            _count: { role: true },
        });

        const coursesByStatus = await prisma.course.groupBy({
            by: ['status'],
            _count: { status: true },
        });

        const summary: AnalyticsSummary = {
            usersByRole: usersByRole.map(item => ({
                role: item.role as UserRole,
                count: item._count.role,
            })),
            coursesByStatus: coursesByStatus.map(item => ({
                status: item.status as CourseStatus,
                count: item._count.status,
            })),
        };

        return NextResponse.json(summary);
    } catch (error) {
        console.error('[ANALYTICS_SUMMARY_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener el resumen de analíticas' }, { status: 500 });
    }
}
