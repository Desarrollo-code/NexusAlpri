// src/app/api/resources/route.ts
import prisma from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET resources
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parentId') || null;
    
    const baseWhere: Prisma.ResourceWhereInput = {
        parentId,
        status: 'ACTIVE',
        OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
        ]
    };
    
    const permissionsWhere: Prisma.ResourceWhereInput = {
        OR: [
            { ispublic: true },
            { uploaderId: session.id },
            { sharedWith: { some: { id: session.id } } }
        ]
    };
    
    const whereClause: Prisma.ResourceWhereInput = session.role === 'ADMINISTRATOR' 
        ? baseWhere 
        : { AND: [baseWhere, permissionsWhere] };

    try {
        const resources = await prisma.resource.findMany({
            where: whereClause,
            include: {
                uploader: { select: { id: true, name: true, avatar: true } },
                sharedWith: { select: { id: true, name: true, avatar: true } }
            },
            orderBy: [
                { type: 'asc' }, // Folders first
                { createdAt: 'desc' },
            ],
        });
        
        // No exponer el PIN hash al cliente
        const safeResources = resources.map(({ pin, tags, ...resource }) => ({
            ...resource,
            tags: tags ? tags.split(',').filter(Boolean) : [], // Safe handling of null tags
            hasPin: !!pin,
            uploaderName: resource.uploader ? resource.uploader.name || 'Sistema' : 'Sistema', // FIX: Safely access uploader name
        }));

        return NextResponse.json({ resources: safeResources, totalResources: safeResources.length });
    } catch (error) {
        console.error('[RESOURCES_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los recursos' }, { status: 500 });
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
        const { title, type, url, category, tags, parentId, description, isPublic, sharedWithUserIds, expiresAt } = body;

        if (!title || !type) {
            return NextResponse.json({ message: 'Título y tipo son requeridos' }, { status: 400 });
        }
        
        if (type !== 'FOLDER' && !url) {
            return NextResponse.json({ message: 'URL es requerida para archivos' }, { status: 400 });
        }

        const data: any = {
            title,
            type,
            description,
            url: url || null,
            category: category || 'General',
            tags: Array.isArray(tags) ? tags.join(',') : '',
            ispublic: isPublic === true,
            status: 'ACTIVE',
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            uploader: { connect: { id: session.id } },
        };
        
        if (parentId) {
            data.parent = {
                connect: { id: parentId }
            };
        }

        if (isPublic === false && sharedWithUserIds && Array.isArray(sharedWithUserIds)) {
            data.sharedWith = {
                connect: sharedWithUserIds.map((id:string) => ({ id }))
            };
        }

        const newResource = await prisma.resource.create({
            data,
             include: {
                uploader: { select: { id: true, name: true, avatar: true } },
            }
        });
        
        const { pin, tags: tagsString, ...safeResource } = newResource;

        return NextResponse.json({ 
            ...safeResource,
            tags: tagsString ? tagsString.split(',').filter(Boolean) : [],
            hasPin: !!pin,
            uploaderName: newResource.uploader ? newResource.uploader.name || 'Sistema' : 'Sistema', // FIX: Safely access uploader name
        }, { status: 201 });

    } catch (error) {
        console.error('[RESOURCE_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al crear el recurso' }, { status: 500 });
    }
}
