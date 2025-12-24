
// src/app/api/resources/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { Prisma, ResourceStatus, ResourceSharingMode } from '@prisma/client';

export const dynamic = 'force-dynamic';

const getFileTypeFilter = (fileType: string): Prisma.EnterpriseResourceWhereInput => {
    const mimeMap: Record<string, string[]> = {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        video: ['video/mp4', 'video/webm', 'video/ogg'],
        pdf: ['application/pdf'],
        doc: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        xls: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        ppt: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        zip: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    };
    const mimeTypes = mimeMap[fileType];
    if (mimeTypes) {
        return { filetype: { in: mimeTypes } };
    }
    if (fileType === 'other') {
        const allKnownMimes = Object.values(mimeMap).flat();
        return { filetype: { notIn: allKnownMimes } };
    }
    return {};
}

// GET resources
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();

    if (!session || !session.id || !session.role) {
        return NextResponse.json({ message: 'No autorizado o sesión inválida.' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        let parentId = searchParams.get('parentId');
        const status = (searchParams.get('status') as ResourceStatus) || 'ACTIVE';
        const searchTerm = searchParams.get('search');

        // Advanced filters
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const fileType = searchParams.get('fileType');
        const hasPin = searchParams.get('hasPin') === 'true';
        const hasExpiry = searchParams.get('hasExpiry') === 'true';

        const sortBy = searchParams.get('sortBy') || 'date';
        const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

        if (parentId === '') parentId = null;

        const baseWhere: Prisma.EnterpriseResourceWhereInput = { parentId, status };
        if (status === 'ACTIVE') {
            baseWhere.OR = [{ expiresAt: null }, { expiresAt: { gte: new Date() } }];
        }
        if (searchTerm) {
            baseWhere.title = { contains: searchTerm, mode: 'insensitive' };
        }

        const tagsParam = searchParams.get('tags');
        if (tagsParam) {
            const tagsToFilter = tagsParam.split(',').filter(Boolean);
            if (tagsToFilter.length > 0) {
                // Filter resources that contain ALL specified tags
                // Since tags are stored as a string, we use AND with contains for each tag
                baseWhere.AND = (baseWhere.AND as any[]) || [];
                tagsToFilter.forEach(tag => {
                    (baseWhere.AND as any[]).push({
                        tags: { contains: tag }
                    });
                });
            }
        }

        if (startDate) baseWhere.uploadDate = { ...baseWhere.uploadDate, gte: new Date(startDate) };
        if (endDate) baseWhere.uploadDate = { ...baseWhere.uploadDate, lte: new Date(endDate) };
        if (fileType && fileType !== 'all') {
            const fileTypeFilter = getFileTypeFilter(fileType);
            if (baseWhere.AND) {
                (baseWhere.AND as any[]).push(fileTypeFilter);
            } else {
                baseWhere.AND = [fileTypeFilter];
            }
        }
        if (hasPin) baseWhere.pin = { not: null };
        if (hasExpiry) baseWhere.expiresAt = { not: null };

        let whereClause: Prisma.EnterpriseResourceWhereInput = {};
        if (session.role === 'ADMINISTRATOR') {
            whereClause = baseWhere;
        } else {
            const userProcessIds = await prisma.user.findUnique({
                where: { id: session.id },
                select: { processId: true }
            }).then(u => u?.processId ? [u.processId] : []);

            whereClause.AND = [
                baseWhere,
                {
                    OR: [
                        { sharingMode: 'PUBLIC' },
                        { sharingMode: 'PRIVATE', sharedWith: { some: { id: session.id } } },
                        { sharingMode: 'PROCESS', sharedWithProcesses: { some: { id: { in: userProcessIds } } } },
                        { uploaderId: session.id },
                    ]
                }
            ];
        }

        // Sorting Logic
        const orderBy: Prisma.EnterpriseResourceOrderByWithRelationInput[] = [];

        // Pinned always first by default
        orderBy.push({ isPinned: 'desc' });

        // Folders always before files if sorting by name or date, OR if no specific sort 
        if (sortBy === 'name' || sortBy === 'date') {
            orderBy.push({ type: 'asc' }); // FOLDER comes before VIDEO/DOCUMENT usually alphabetically? Actually no.
            // We want folders first. 'FOLDER' vs 'DOCUMENT'. D < F. 
            // Let's rely on specific logic if needed, but typically users want folders first.
            // A simple way is to use a specific convention or rely on client grouping.
            // Current usage groups by category then separates folders/files.
            // The API just sends a list. Let's stick to requested sort.
        }

        if (sortBy === 'name') {
            orderBy.push({ title: sortOrder });
        } else if (sortBy === 'size') {
            orderBy.push({ size: sortOrder });
        } else {
            // Default 'date'
            orderBy.push({ uploadDate: sortOrder });
        }

        const resources = await prisma.enterpriseResource.findMany({
            where: whereClause,
            include: {
                uploader: { select: { id: true, name: true, avatar: true } },
                sharedWith: { select: { id: true, name: true, avatar: true } }
            },
            orderBy,
        });

        const safeResources = resources.map(({ pin, tags, uploader, ...resource }) => ({
            ...resource, uploader, tags: tags ? tags.split(',').filter(Boolean) : [],
            hasPin: !!pin, uploaderName: uploader ? uploader.name || 'Sistema' : 'Sistema',
        }));

        return NextResponse.json({ resources: safeResources });

    } catch (error) {
        console.error('[RESOURCES_GET_ERROR]', (error as Error).message);
        return NextResponse.json({ message: `Error al obtener los recursos: ${(error as Error).message}` }, { status: 500 });
    }
}


// POST a new resource (file or folder)
export async function POST(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { title, type, url, category, tags, parentId, description, sharingMode, sharedWithUserIds, sharedWithProcessIds, expiresAt, status, size, fileType, filename, videos, collaboratorIds, quiz } = body;

        const finalTitle = title || filename;

        if (!finalTitle || !type) {
            return NextResponse.json({ message: 'Título y tipo son requeridos' }, { status: 400 });
        }

        if (type !== 'FOLDER' && type !== 'VIDEO_PLAYLIST' && type !== 'EXTERNAL_LINK' && type !== 'DOCUMENTO_EDITABLE' && !url && (!videos || videos.length === 0)) {
            return NextResponse.json({ message: 'URL o videos son requeridos para este tipo de recurso' }, { status: 400 });
        }

        // Helper to construct quiz creation data if quiz exists
        const getQuizCreateData = () => {
            if (!quiz) return undefined;

            const questionsCreateData = (quiz.questions || []).map((q: any, qIndex: number) => ({
                text: q.text,
                order: qIndex,
                type: q.type,
                template: q.template,
                imageUrl: q.imageUrl,
                options: {
                    create: (q.options || []).map((opt: any) => ({
                        text: opt.text,
                        isCorrect: opt.isCorrect,
                        points: opt.points || 0,
                        imageUrl: opt.imageUrl
                    }))
                }
            }));

            return {
                create: {
                    title: quiz.title || 'Evaluación del Recurso',
                    description: quiz.description,
                    maxAttempts: quiz.maxAttempts,
                    questions: {
                        create: questionsCreateData
                    }
                }
            };
        };

        const quizData = getQuizCreateData();

        if (type === 'VIDEO_PLAYLIST') {
            const playlist = await prisma.enterpriseResource.create({
                data: {
                    title: finalTitle,
                    type, description, category,
                    sharingMode: 'PUBLIC',
                    uploader: { connect: { id: session.id } },
                    parent: parentId ? { connect: { id: parentId } } : undefined,
                    collaborators: collaboratorIds && collaboratorIds.length > 0 ? {
                        connect: collaboratorIds.map((id: string) => ({ id }))
                    } : undefined,
                    status: 'ACTIVE',
                    quiz: quizData // Add quiz to playlist
                }
            });

            if (videos && videos.length > 0) {
                for (const [index, video] of videos.entries()) {
                    await prisma.enterpriseResource.create({
                        data: {
                            title: video.title,
                            type: 'VIDEO',
                            url: video.url,
                            uploader: { connect: { id: session.id } },
                            parent: { connect: { id: playlist.id } },
                            sharingMode: 'PUBLIC',
                            category,
                            status: 'ACTIVE',
                        }
                    })
                }
            }
            return NextResponse.json(playlist, { status: 201 });
        }

        const data: Prisma.EnterpriseResourceCreateInput = {
            title: finalTitle, type, description, url: url || null,
            content: type === 'DOCUMENTO_EDITABLE' ? ' ' : null,
            category: category || 'General',
            tags: Array.isArray(tags) ? tags.join(',') : '',
            sharingMode,
            status: status || 'ACTIVE',
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            size, filetype: fileType,
            uploader: { connect: { id: session.id } },
            parent: parentId ? { connect: { id: parentId } } : undefined,
            quiz: quizData, // Add quiz to generic resource
        };

        if (sharingMode === 'PRIVATE' && sharedWithUserIds && Array.isArray(sharedWithUserIds)) {
            data.sharedWith = { connect: sharedWithUserIds.map((id: string) => ({ id })) };
        }
        if (sharingMode === 'PROCESS' && sharedWithProcessIds && Array.isArray(sharedWithProcessIds)) {
            data.sharedWithProcesses = { connect: sharedWithProcessIds.map((id: string) => ({ id })) };
        }

        const newResource = await prisma.enterpriseResource.create({
            data,
            include: {
                uploader: { select: { id: true, name: true, avatar: true } },
                sharedWith: { select: { id: true, name: true, avatar: true } },
            }
        });

        const { pin, tags: tagsString, ...safeResource } = newResource;

        return NextResponse.json({
            ...safeResource,
            tags: tagsString ? tagsString.split(',').filter(Boolean) : [],
            hasPin: !!pin,
            uploaderName: newResource.uploader ? newResource.uploader.name || 'Sistema' : 'Sistema',
        }, { status: 201 });

    } catch (error) {
        console.error('[RESOURCE_POST_ERROR]', (error as Error).message);
        return NextResponse.json({ message: 'Error al crear el recurso' }, { status: 500 });
    }
}

