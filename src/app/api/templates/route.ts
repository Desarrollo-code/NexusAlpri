
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET all available lesson templates
export async function GET(req: NextRequest) {
    const session = await getSession(req);
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        const templates = await prisma.lessonTemplate.findMany({
            where: {
                OR: [
                    { type: 'SYSTEM' },
                    { creatorId: session.id },
                ],
            },
            include: {
                creator: { select: { name: true } },
                templateBlocks: { orderBy: { order: 'asc' } },
            },
            orderBy: {
                type: 'asc', // Show SYSTEM templates first
            },
        });
        return NextResponse.json(templates);
    } catch (error) {
        console.error('[TEMPLATES_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las plantillas' }, { status: 500 });
    }
}

// POST a new lesson template from an existing lesson
export async function POST(req: NextRequest) {
    const session = await getSession(req);
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { name, description, lessonId } = await req.json();

        if (!name || !lessonId) {
            return NextResponse.json({ message: 'Nombre y ID de lección son requeridos' }, { status: 400 });
        }
        
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { contentBlocks: { orderBy: { order: 'asc' } } },
        });

        if (!lesson) {
            return NextResponse.json({ message: 'Lección original no encontrada' }, { status: 404 });
        }
        
        const newTemplate = await prisma.lessonTemplate.create({
            data: {
                name,
                description,
                type: 'USER',
                creatorId: session.id,
                templateBlocks: {
                    create: lesson.contentBlocks.map(block => ({
                        type: block.type,
                        order: block.order,
                    })),
                },
            },
        });

        return NextResponse.json(newTemplate, { status: 201 });
    } catch (error) {
        console.error('[TEMPLATE_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al crear la plantilla' }, { status: 500 });
    }
}
