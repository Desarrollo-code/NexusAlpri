// src/app/api/motivations/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { MotivationalMessage as PrismaMotivationalMessage, Course } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Interfaz para el objeto de mensaje enriquecido que se enviará al cliente
type EnrichedMotivationalMessage = PrismaMotivationalMessage & {
    triggerCourse?: {
        id: string;
        title: string;
    } | null;
};

// GET all motivational messages
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        // 1. Obtener todos los mensajes base.
        const baseMessages = await prisma.motivationalMessage.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        // 2. Extraer los IDs de los cursos de los mensajes que son de tipo COURSE_COMPLETION.
        const courseIds = baseMessages
            .filter(msg => msg.triggerType === 'COURSE_COMPLETION' && msg.triggerId)
            .map(msg => msg.triggerId!);

        let coursesMap = new Map<string, { id: string; title: string }>();

        // 3. Si hay IDs de cursos, hacer una única consulta para obtener sus detalles.
        if (courseIds.length > 0) {
            const courses = await prisma.course.findMany({
                where: {
                    id: { in: courseIds }
                },
                select: {
                    id: true,
                    title: true,
                }
            });
            courses.forEach(course => coursesMap.set(course.id, course));
        }

        // 4. Combinar los datos de forma segura.
        const enrichedMessages: EnrichedMotivationalMessage[] = baseMessages.map(message => {
            let triggerCourse = null;
            if (message.triggerType === 'COURSE_COMPLETION' && message.triggerId && coursesMap.has(message.triggerId)) {
                triggerCourse = coursesMap.get(message.triggerId);
            }
            return {
                ...message,
                triggerCourse,
            };
        });
        
        // 5. Devolver siempre un array.
        return NextResponse.json(enrichedMessages);

    } catch (error) {
        console.error("[MOTIVATIONS_GET_ERROR]", error);
        // En caso de un error inesperado, devuelve un array vacío para no romper el cliente.
        return NextResponse.json({ message: 'Error al cargar los mensajes', error: (error as Error).message }, { status: 500 });
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
