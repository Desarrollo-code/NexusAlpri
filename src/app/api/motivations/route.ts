
// src/app/api/motivations/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { MotivationalMessageTriggerType } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET all motivational messages
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        // Paso 1: Obtener todos los mensajes sin incluir relaciones que puedan ser nulas.
        const messages = await prisma.motivationalMessage.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Paso 2: Recopilar los IDs de los cursos que sí existen en los mensajes.
        const courseIds = messages
            .filter(m => m.triggerType === MotivationalMessageTriggerType.COURSE_COMPLETION && m.triggerId)
            .map(m => m.triggerId) as string[];

        // Paso 3: Si hay IDs de cursos, obtener su información en una sola consulta.
        let coursesMap = new Map<string, { id: string; title: string }>();
        if (courseIds.length > 0) {
            const courses = await prisma.course.findMany({
                where: {
                    id: { in: courseIds }
                },
                select: {
                    id: true,
                    title: true
                }
            });
            courses.forEach(course => coursesMap.set(course.id, course));
        }

        // Paso 4: Unir los datos manualmente.
        const results = messages.map(message => {
            const triggerCourse = message.triggerId ? coursesMap.get(message.triggerId) : null;
            return {
                ...message,
                triggerCourse: triggerCourse || null // Asegurarse de que el campo exista, aunque sea nulo.
            };
        });

        return NextResponse.json(results);

    } catch (error) {
        console.error("[MOTIVATIONS_GET_ERROR]", error);
        return NextResponse.json({ message: 'Error al obtener los mensajes de motivación' }, { status: 500 });
    }
}


// POST (create) a new motivational message
export async function POST(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado para crear mensajes' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { title, content, imageUrl, videoUrl, triggerType, triggerId } = body;

        if (!title || !triggerType || !triggerId) {
            return NextResponse.json({ message: 'Título y disparador son requeridos' }, { status: 400 });
        }

        const newMessage = await prisma.motivationalMessage.create({
            data: {
                title,
                content: content || null,
                imageUrl: imageUrl || null,
                videoUrl: videoUrl || null,
                triggerType,
                triggerId,
                creatorId: session.id,
            }
        });

        return NextResponse.json(newMessage, { status: 201 });

    } catch (error) {
        console.error('[MOTIVATIONS_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al crear el mensaje' }, { status: 500 });
    }
}
