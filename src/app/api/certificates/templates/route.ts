// src/app/api/certificates/templates/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all certificate templates
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const templates = await prisma.certificateTemplate.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
        return NextResponse.json(templates);
    } catch (error) {
        console.error("[CERTIFICATE_TEMPLATES_GET_ERROR]", error);
        return NextResponse.json({ message: 'Error al cargar las plantillas' }, { status: 500 });
    }
}

// POST a new certificate template
export async function POST(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { name, backgroundImageUrl, textColor, studentNamePosition, courseNamePosition, datePosition, scorePosition } = body;

        if (!name || !backgroundImageUrl) {
            return NextResponse.json({ message: 'El nombre y la imagen de fondo son requeridos' }, { status: 400 });
        }

        const newTemplate = await prisma.certificateTemplate.create({
            data: {
                name,
                backgroundImageUrl,
                textColor,
                studentNamePosition,
                courseNamePosition,
                datePosition,
                scorePosition,
            },
        });

        return NextResponse.json(newTemplate, { status: 201 });
    } catch (error) {
        if ((error as any).code === 'P2002') {
             return NextResponse.json({ message: 'Ya existe una plantilla con ese nombre.' }, { status: 409 });
        }
        console.error('[CERTIFICATE_TEMPLATES_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al crear la plantilla' }, { status: 500 });
    }
}
