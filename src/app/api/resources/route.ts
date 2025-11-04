// src/app/api/resources/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { Prisma, ResourceStatus } from '@prisma/client';

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
        return { fileType: { in: mimeTypes } };
    }
    if (fileType === 'other') {
        const allKnownMimes = Object.values(mimeMap).flat();
        return { fileType: { notIn: allKnownMimes } };
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

        if (parentId === '') parentId = null;
        
        const baseWhere: Prisma.EnterpriseResourceWhereInput = { parentId, status };
        if (status === 'ACTIVE') {
            baseWhere.OR = [ { expiresAt: null }, { expiresAt: { gte: new Date() } } ];
        }
        if (searchTerm) {
            baseWhere.title = { contains: searchTerm, mode: 'insensitive' };
        }
        
        // Apply advanced filters
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
            whereClause.AND = [baseWhere, { OR: [ { ispublic: true }, { uploaderId: session.id }, { sharedWith: { some: { id: session.id } } } ] }];
        }

        const resources = await prisma.enterpriseResource.findMany({
            where: whereClause,
            include: {
                uploader: { select: { id: true, name: true, avatar: true } },
                sharedWith: { select: { id: true, name: true, avatar: true } }
            },
            orderBy: [ { type: 'asc' }, { uploadDate: 'desc' } ],
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
        const { title, type, url, category, tags, parentId, description, isPublic, sharedWithUserIds, expiresAt, status, size, fileType } = body;

        if (!title || !type) {
            return NextResponse.json({ message: 'Título y tipo son requeridos' }, { status: 400 });
        }
        
        if (type !== 'FOLDER' && type !== 'EXTERNAL_LINK' && type !== 'DOCUMENTO_EDITABLE' && !url) {
            return NextResponse.json({ message: 'URL es requerida para este tipo de recurso' }, { status: 400 });
        }

        const data: any = {
            title, type, description, url: url || null,
            content: type === 'DOCUMENTO_EDITABLE' ? ' ' : null,
            category: category || 'General',
            tags: Array.isArray(tags) ? tags.join(',') : '',
            ispublic: isPublic === true, status: status || 'ACTIVE',
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            size, fileType,
            uploader: { connect: { id: session.id } },
        };
        
        if (parentId) data.parent = { connect: { id: parentId } };
        if (isPublic === false && sharedWithUserIds && Array.isArray(sharedWithUserIds)) {
            data.sharedWith = { connect: sharedWithUserIds.map((id:string) => ({ id })) };
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
