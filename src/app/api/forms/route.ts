// src/app/api/forms/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all forms visible to the current user
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const forms = await prisma.form.findMany({
            where: {
                creatorId: session.id, // For now, users can only see their own forms
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                _count: {
                    select: { responses: true }
                }
            }
        });
        return NextResponse.json(forms);
    } catch (error) {
        console.error('[FORMS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los formularios' }, { status: 500 });
    }
}
