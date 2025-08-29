// src/app/api/forms/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { FormStatus, UserRole } from '@/types';

export const dynamic = 'force-dynamic';

// GET all forms based on user role and tab
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'my-forms'; // my-forms, shared-with-me, all, for-student
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const skip = (page - 1) * pageSize;

    let whereClause: any = {};

    switch (tab) {
        case 'my-forms':
            whereClause.creatorId = session.id;
            break;
        case 'shared-with-me':
            whereClause.sharedWith = { some: { id: session.id } };
            break;
        case 'all':
            if (session.role !== 'ADMINISTRATOR') {
                return NextResponse.json({ message: 'No autorizado para ver todos los formularios' }, { status: 403 });
            }
            // No extra conditions for admin seeing all
            break;
        case 'for-student':
             whereClause.status = 'PUBLISHED';
             whereClause.OR = [
                { sharedWith: { none: {} } }, // Public forms (not shared with anyone specifically)
                { sharedWith: { some: { id: session.id } } } // Or forms shared with the current user
             ]
            // We might need to add a condition to exclude already answered forms in the future
            break;
        default:
            return NextResponse.json({ message: 'Pestaña inválida' }, { status: 400 });
    }

    try {
        const [forms, totalForms] = await prisma.$transaction([
            prisma.form.findMany({
                where: whereClause,
                include: {
                    _count: {
                        select: { responses: true }
                    },
                    creator: {
                        select: { name: true }
                    },
                    sharedWith: {
                        select: { id: true, name: true, avatar: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: skip,
                take: pageSize,
            }),
            prisma.form.count({ where: whereClause })
        ]);

        return NextResponse.json({ forms, totalForms });
    } catch (error) {
        console.error('[FORMS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los formularios' }, { status: 500 });
    }
}


// POST (create) a new form
export async function POST(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado para crear formularios' }, { status: 403 });
    }

    try {
        const { title, description } = await req.json();

        if (!title) {
            return NextResponse.json({ message: 'El título es requerido' }, { status: 400 });
        }

        const newForm = await prisma.form.create({
            data: {
                title,
                description: description || '',
                creatorId: session.id,
                status: 'DRAFT',
            },
             include: {
                _count: {
                    select: { responses: true }
                },
                creator: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json(newForm, { status: 201 });

    } catch (error) {
        console.error('[FORMS_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al crear el formulario' }, { status: 500 });
    }
}
