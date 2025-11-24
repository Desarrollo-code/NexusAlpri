// src/app/api/resources/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import type { Quiz } from '@/types';

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
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    
    try {
        const { id } = params;
        const resourceToUpdate = await prisma.enterpriseResource.findUnique({ where: { id } });
        if (!resourceToUpdate) {
            return NextResponse.json({ message: 'Recurso no encontrado' }, { status: 404 });
        }
        if (session.role === 'INSTRUCTOR' && resourceToUpdate.uploaderId !== session.id) {
             return NextResponse.json({ message: 'No tienes permiso para editar este recurso' }, { status: 403 });
        }

        const { title, category, description, isPublic, sharedWithUserIds, expiresAt, status, content, observations, quiz } = await req.json();

        const createVersion = resourceToUpdate.type === 'DOCUMENTO_EDITABLE' && resourceToUpdate.content !== content;
        
        await prisma.$transaction(async (tx) => {
            const updateData: any = {
                title, category, content, observations, description, status,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                ispublic: isPublic,
                sharedWith: isPublic ? { set: [] } : { set: sharedWithUserIds.map((id: string) => ({ id })) }
            };

            if (createVersion) {
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
            
            // --- Lógica del Quiz ---
            if (category === 'Formación Interna' && quiz) {
                 const quizData = {
                    title: quiz.title || 'Evaluación del Recurso',
                    description: quiz.description,
                    maxAttempts: quiz.maxAttempts,
                    resourceId: id,
                    questions: {
                        deleteMany: {},
                        create: quiz.questions.map((q: any, qIndex: number) => ({
                            text: q.text,
                            order: qIndex,
                            type: q.type,
                            template: q.template,
                            imageUrl: q.imageUrl,
                            options: {
                                create: q.options.map((opt: any) => ({
                                    text: opt.text,
                                    isCorrect: opt.isCorrect,
                                    points: opt.points,
                                    imageUrl: opt.imageUrl
                                }))
                            }
                        }))
                    }
                 };

                 updateData.quiz = {
                     upsert: {
                         create: quizData,
                         update: quizData,
                     }
                 };
            } else {
                // Si la categoría no es "Formación Interna" o no hay quiz, nos aseguramos de que se elimine
                const existingQuiz = await tx.quiz.findFirst({ where: { resourceId: id } });
                if (existingQuiz) {
                    await tx.quiz.delete({ where: { id: existingQuiz.id }});
                }
            }
            // --------------------

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
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { id } = params;
        const resourceToDelete = await prisma.enterpriseResource.findUnique({ where: { id } });
        if (!resourceToDelete) {
            return NextResponse.json({ message: 'Recurso no encontrado' }, { status: 404 });
        }
        if (session.role === 'INSTRUCTOR' && resourceToDelete.uploaderId !== session.id) {
             return NextResponse.json({ message: 'No tienes permiso para eliminar este recurso' }, { status: 403 });
        }
        
        if (resourceToDelete.type === 'FOLDER') {
            const childrenCount = await prisma.enterpriseResource.count({
                where: {
                    parentId: id,
                    status: 'ACTIVE'
                }
            });
            if (childrenCount > 0) {
                return NextResponse.json({ message: `No se puede eliminar. La carpeta contiene ${childrenCount} recurso(s) activo(s).` }, { status: 409 });
            }
        }
        
        // Usar una transacción para eliminar el recurso y sus notificaciones asociadas
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
