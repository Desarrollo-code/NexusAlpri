// src/app/api/notes/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all notes for the current user
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        const notes = await prisma.userNote.findMany({
            where: { userId: session.id },
            include: {
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        module: {
                            select: {
                                id: true,
                                title: true,
                                course: {
                                    select: {
                                        id: true,
                                        title: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                lesson: {
                    module: {
                        courseId: 'asc'
                    }
                }
            }
        });
        return NextResponse.json(notes);
    } catch (error) {
        console.error('[NOTES_GET_ALL_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las notas' }, { status: 500 });
    }
}


// POST (create or update) a note
export async function POST(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        const { lessonId, content, color } = await req.json();

        if (!lessonId) {
            return NextResponse.json({ message: 'lessonId es requerido' }, { status: 400 });
        }

        const note = await prisma.userNote.upsert({
            where: {
                userId_lessonId: {
                    userId: session.id,
                    lessonId: lessonId,
                },
            },
            update: {
                content: content,
                color: color || 'yellow',
            },
            create: {
                userId: session.id,
                lessonId: lessonId,
                content: content,
                color: color || 'yellow',
            },
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error('[NOTE_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al guardar la nota' }, { status: 500 });
    }
}

// DELETE a note
export async function DELETE(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        const { noteId } = await req.json();
        if (!noteId) {
            return NextResponse.json({ message: 'noteId es requerido' }, { status: 400 });
        }
        
        // Find the note and verify ownership
        const noteToDelete = await prisma.userNote.findUnique({
            where: { id: noteId },
        });

        if (!noteToDelete) {
            return NextResponse.json({ message: 'Nota no encontrada' }, { status: 404 });
        }

        if (noteToDelete.userId !== session.id) {
            return NextResponse.json({ message: 'No tienes permiso para eliminar esta nota' }, { status: 403 });
        }
        
        await prisma.userNote.delete({
            where: { id: noteId },
        });
        
        return new NextResponse(null, { status: 204 });
    } catch (error) {
         console.error('[NOTE_DELETE_ERROR]', error);
        return NextResponse.json({ message: 'Error al eliminar la nota' }, { status: 500 });
    }
}
