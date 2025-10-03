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
        const messages = await prisma.motivationalMessage.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                triggerCourse: {
                    select: {
                        id: true,
                        title: true,
                    }
                }
            }
        });
        
        // La API ahora devuelve directamente el resultado de la base de datos,
        // que está garantizado que es un array.
        return NextResponse.json(messages || []);

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