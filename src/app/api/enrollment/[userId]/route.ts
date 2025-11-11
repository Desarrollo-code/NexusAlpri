// src/app/api/enrollment/[userId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Get all courses a specific user is enrolled in
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
    const session = await getCurrentUser();
    const { userId } = params;

    if (!session || session.id !== userId) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: userId },
            include: {
                course: {
                    include: {
                        instructor: {
                            select: { id: true, name: true, avatar: true },
                        },
                        _count: {
                            select: { modules: true },
                        },
                    },
                },
                progress: true, // Incluir el registro de progreso
            },
            orderBy: {
                enrolledAt: 'desc',
            },
        });
        
        // Mapear los datos para que coincidan con la estructura esperada por el frontend
        const data = enrollments.map(enrollment => {
            return {
                ...enrollment, // Devuelve el objeto de inscripción completo
                course: {
                    ...enrollment.course,
                    instructor: enrollment.course.instructor, // Asegura que el instructor esté en el objeto del curso
                    _count: {
                        modules: enrollment.course._count.modules
                    }
                },
                progressPercentage: enrollment.progress?.progressPercentage || 0
            };
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('[USER_ENROLLMENTS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las inscripciones del usuario' }, { status: 500 });
    }
}
