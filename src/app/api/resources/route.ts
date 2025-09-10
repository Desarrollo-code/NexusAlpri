// src/app/api/resources/route.ts
import prisma from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET resources
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parentId') || null;
    
    // --- Lógica de permisos simplificada y robusta ---
    const whereClause: any = {
        parentId,
        OR: [
            { ispublic: true }, // Es público
            { uploaderId: session.id }, // Lo subió el usuario actual
            { sharedWith: { some: { id: session.id } } } // Está compartido con el usuario actual
        ]
    };

    try {
        const resources = await prisma.resource.findMany({
            where: whereClause,
            include: {
                uploader: { select: { id: true, name: true, avatar: true } },
                sharedWith: { select: { id: true, name: true, avatar: true } }
            },
            orderBy: [
                { type: 'asc' }, // Folders first
                { createdAt: 'desc' }, // CORREGIDO: Usar 'createdAt' en lugar de 'uploadDate'
            ],
        });
        
        // No exponer el PIN hash al cliente
        const safeResources = resources.map(({ pin, tags, ...resource }) => ({
            ...resource,
            tags: tags ? tags.split(',').filter(Boolean) : [],
            hasPin: !!pin,
            uploaderName: resource.uploader?.name || 'Sistema',
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
        const { title, type, url, category, tags, parentId, description, isPublic, sharedWithUserIds } = body;

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
            uploaderName: newResource.uploader?.name || 'Sistema'
        }, { status: 201 });

    } catch (error) {
        console.error('[RESOURCE_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al crear el recurso' }, { status: 500 });
    }
}
