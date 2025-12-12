// src/api/resources/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import type { Quiz, AppQuestion } from '@/types';
import { checkResourceOwnership } from '@/lib/auth-utils';


export const dynamic = 'force-dynamic';

// GET a specific resource
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const resource = await prisma.enterpriseResource.findUnique({
            where: { id },
            include: {
                uploader: { select: { id: true, name: true } },
                sharedWith: { select: { id: true, name: true, avatar: true } },
                sharedWithProcesses: { select: { id: true, name: true } },
                collaborators: { select: { id: true, name: true, avatar: true } },
                quiz: { include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } } },
            },
        });
        if (!resource) {
            return NextResponse.json({ message: 'Recurso no encontrado' }, { status: 404 });
        }
        const { pin, ...safeResource } = resource;
        return NextResponse.json({
            ...safeResource,
            hasPin: !!pin,
        });
    } catch (error) {
        console.error('[RESOURCE_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener el recurso' }, { status: 500 });
    }
}


// PUT (update) a resource
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    const { id } = params;

    const hasPermission = await checkResourceOwnership(session, id);
    if (!hasPermission) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    
    try {
        const resourceToUpdate = await prisma.enterpriseResource.findUnique({ where: { id } });
        if (!resourceToUpdate) {
            return NextResponse.json({ message: 'Recurso no encontrado' }, { status: 404 });
        }
        
        const body = await req.json();
        const { title, category, description, sharingMode, sharedWithUserIds, sharedWithProcessIds, expiresAt, status, content, observations, quiz, collaboratorIds, videos } = body;

        const createVersion = resourceToUpdate.type === 'DOCUMENTO_EDITABLE' && resourceToUpdate.content !== content;
        
        await prisma.$transaction(async (tx) => {
            const updateData: any = {
                title, category, content, observations, description, status, sharingMode,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                sharedWith: { set: sharingMode === 'PRIVATE' ? (sharedWithUserIds ?? []).map((id: string) => ({ id })) : [] },
                sharedWithProcesses: { set: sharingMode === 'PROCESS' ? (sharedWithProcessIds ?? []).map((id: string) => ({ id })) : [] },
                collaborators: { set: (collaboratorIds ?? []).map((id: string) => ({ id })) },
            };

            if (createVersion && session) {
                updateData.version = { increment: 1 };
                await tx.resourceVersion.create({
                    data: {
                        resourceId: resourceToUpdate.id,
                        version: resourceToUpdate.version,
                        content: resourceToUpdate.content,
                        authorId: session.id,
                    }
                });
            }

            if (videos) {
                const existingVideos = await tx.enterpriseResource.findMany({ where: { parentId: id }, select: { id: true } });
                const newVideoIds = videos.map((v: any) => v.id).filter(Boolean);
                const videosToDelete = existingVideos.filter(ev => !newVideoIds.includes(ev.id));
                if (videosToDelete.length > 0) {
                    await tx.enterpriseResource.deleteMany({ where: { id: { in: videosToDelete.map(v => v.id) } } });
                }

                for (const video of videos) {
                    await tx.enterpriseResource.upsert({
                        where: { id: video.id.startsWith('vid-') ? '' : video.id },
                        create: { title: video.title, url: video.url, type: 'VIDEO', uploaderId: session!.id, parentId: id },
                        update: { title: video.title, url: video.url },
                    });
                }
            }
            
            if (quiz) {
                 const quizPayload = {
                    title: quiz.title || 'Evaluación del Recurso',
                    description: quiz.description,
                    maxAttempts: quiz.maxAttempts,
                };
                
                const upsertedQuiz = await tx.quiz.upsert({
                    where: { resourceId: id },
                    create: {
                        ...quizPayload,
                        resourceId: id,
                    },
                    update: quizPayload,
                });
                
                // Borrar preguntas viejas y crear las nuevas
                await tx.question.deleteMany({ where: { quizId: upsertedQuiz.id } });

                if (quiz.questions && quiz.questions.length > 0) {
                    for (const [qIndex, q] of (quiz.questions as AppQuestion[]).entries()) {
                         const newQuestion = await tx.question.create({
                            data: {
                                text: q.text,
                                order: qIndex,
                                type: q.type,
                                template: q.template || 'default',
                                imageUrl: q.imageUrl,
                                quizId: upsertedQuiz.id,
                            }
                        });

                        if (q.options && q.options.length > 0) {
                            await tx.answerOption.createMany({
                                data: q.options.map(opt => ({
                                    text: opt.text,
                                    isCorrect: opt.isCorrect,
                                    points: opt.points || 0,
                                    imageUrl: opt.imageUrl,
                                    questionId: newQuestion.id,
                                }))
                            });
                        }
                    }
                }
                updateData.quizId = upsertedQuiz.id;

            } else {
                const existingQuiz = await tx.quiz.findUnique({ where: { resourceId: id } });
                if (existingQuiz) {
                    await tx.quiz.delete({ where: { id: existingQuiz.id } });
                }
            }
            
            // Actualizar el recurso principal con toda la información
            await tx.enterpriseResource.update({
                where: { id },
                data: updateData,
            });
        });
        
        const updatedResource = await prisma.enterpriseResource.findUnique({ 
            where: { id },
            include: { quiz: { include: { questions: { include: { options: true }}}}} 
        });

        return NextResponse.json(updatedResource);
    } catch (error) {
        console.error('[RESOURCE_PUT_ERROR]', error);
        return NextResponse.json({ message: 'Error al actualizar el recurso' }, { status: 500 });
    }
}

// DELETE a resource
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    const { id } = params;

    const hasPermission = await checkResourceOwnership(session, id);
    if (!hasPermission) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const resourceToDelete = await prisma.enterpriseResource.findUnique({ where: { id }, include: { children: true } });
        if (!resourceToDelete) {
            return NextResponse.json({ message: 'Recurso no encontrado' }, { status: 404 });
        }
        
        // Si es una carpeta, eliminamos su contenido recursivamente
        if (resourceToDelete.type === 'FOLDER' || resourceToDelete.type === 'VIDEO_PLAYLIST') {
            const childrenIds = await prisma.enterpriseResource.findMany({
                where: { parentId: id },
                select: { id: true }
            });
            const idsToDelete = childrenIds.map(c => c.id);
            // Podríamos hacer esto recursivo para sub-carpetas, pero por ahora eliminamos un nivel.
            await prisma.enterpriseResource.deleteMany({ where: { id: { in: idsToDelete } } });
        }
        
        await prisma.$transaction([
            prisma.notification.deleteMany({
                where: {
                    link: `/resources?id=${id}` 
                }
            }),
            prisma.enterpriseResource.delete({ where: { id } })
        ]);
        
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[RESOURCE_DELETE_ERROR]', error);
        return NextResponse.json({ message: 'Error al eliminar el recurso' }, { status: 500 });
    }
}
