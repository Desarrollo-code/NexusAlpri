// src/app/api/resources/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { Prisma, ResourceStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET resources
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    
    if (!session || !session.id || !session.role) {
      return NextResponse.json({ message: 'No autorizado o sesión inválida.' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        let parentId = searchParams.get('parentId');
        const status = (searchParams.get('status') as ResourceStatus) || 'ACTIVE'; // Nuevo filtro de estado
        
        if (parentId === '') {
            parentId = null;
        }
        
        const baseWhere: Prisma.EnterpriseResourceWhereInput = {
            parentId: parentId,
            status: status, // Usar el filtro de estado
        };
        
        // Si el estado es ACTIVE, aplicamos la lógica de expiración. Para ARCHIVED, los mostramos todos.
        if (status === 'ACTIVE') {
            baseWhere.OR = [
                { expiresAt: null },
                { expiresAt: { gte: new Date() } }
            ]
        }

        let whereClause: Prisma.EnterpriseResourceWhereInput;

        if (session.role === 'ADMINISTRATOR') {
            whereClause = baseWhere;
        } else {
            const permissionsWhere: Prisma.EnterpriseResourceWhereInput = {
                OR: [
                    { ispublic: true },
                    { uploaderId: session.id },
                    { sharedWith: { some: { id: session.id } } }
                ]
            };
            whereClause = { AND: [baseWhere, permissionsWhere] };
        }

        const resources = await prisma.enterpriseResource.findMany({
            where: whereClause,
            include: {
                uploader: { select: { id: true, name: true, avatar: true } },
                sharedWith: { select: { id: true, name: true, avatar: true } }
            },
            orderBy: [
                { type: 'asc' }, // Folders first
                { uploadDate: 'desc' },
            ],
        });
        
        const safeResources = resources.map(({ pin, tags, uploader, ...resource }) => ({
            ...resource,
            uploader: uploader,
            tags: tags ? tags.split(',').filter(Boolean) : [], 
            hasPin: !!pin,
            uploaderName: uploader ? uploader.name || 'Sistema' : 'Sistema', 
        }));

        return NextResponse.json({ resources: safeResources, totalResources: safeResources.length });

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
        const { title, type, url, category, tags, parentId, description, isPublic, sharedWithUserIds, expiresAt, status } = body;

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
            status: status || 'ACTIVE',
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
