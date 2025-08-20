// src/app/api/notes/[lessonId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET a specific note for a lesson
export async function GET(req: NextRequest, context: { params: { lessonId: string } }) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { lessonId } = context.params;

    try {
        const note = await prisma.userNote.findUnique({
            where: {
                userId_lessonId: {
                    userId: session.id,
                    lessonId,
                },
            },
        });

        if (!note) {
            return NextResponse.json({ content: '' }); // Return empty if no note exists
        }

        return NextResponse.json(note);
    } catch (error) {
        console.error('[NOTE_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener la nota' }, { status: 500 });
    }
}
