// src/app/api/courses/[courseId]/comments/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET comments for a course
export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { courseId } = params;

    try {
        const comments = await prisma.courseComment.findMany({
            where: { courseId },
            include: {
                author: { select: { id: true, name: true, avatar: true, role: true } },
                attachments: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        return NextResponse.json(comments);
    } catch (error) {
        console.error(`[COURSE_COMMENTS_GET_ERROR: ${courseId}]`, error);
        return NextResponse.json({ message: 'Error al obtener los comentarios' }, { status: 500 });
    }
}


// POST a new comment
export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { courseId } = params;

    try {
        const body = await req.json();
        const { content, attachments } = body;

        if (!content && (!attachments || attachments.length === 0)) {
            return NextResponse.json({ message: 'Se requiere contenido o un archivo adjunto' }, { status: 400 });
        }
        
        const newComment = await prisma.courseComment.create({
            data: {
                content,
                courseId,
                authorId: session.id,
                attachments: attachments && attachments.length > 0 ? {
                    create: attachments.map((att: { name: string; url: string; type: string; size: number }) => ({
                        name: att.name,
                        url: att.url,
                        type: att.type,
                        size: att.size,
                    }))
                } : undefined,
            },
            include: {
                author: { select: { id: true, name: true, avatar: true, role: true } },
                attachments: true,
            },
        });
        
        return NextResponse.json(newComment, { status: 201 });

    } catch (error) {
        console.error(`[COURSE_COMMENTS_POST_ERROR: ${courseId}]`, error);
        return NextResponse.json({ message: 'Error al publicar el comentario' }, { status: 500 });
    }
}
