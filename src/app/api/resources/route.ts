
// src/app/api/resources/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
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
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    // Base permissions: user can see resources that are public, they own, or are shared with them.
    const permissionsClause = {
        OR: [
            { ispublic: true },
            { uploaderId: session.id },
            { sharedWith: { some: { id: session.id } } }
        ]
    };
    
    // Filters that apply ON TOP of permissions
    const filterClauses: any[] = [{ parentId }];
    if (search) {
        filterClauses.push({
            OR: [
                { title: { contains: search } },
                { description: { contains: search } },
                { tags: { contains: search } },
            ],
        });
    }

    if (category && category !== 'all') {
        filterClauses.push({ category });
    }

    // Combine all conditions correctly
    const whereClause = {
        AND: [
            permissionsClause,
            ...filterClauses,
        ]
    };


    try {
        const resources = await prisma.resource.findMany({
            where: whereClause,
            include: {
                uploader: { select: { id: true, name: true } },
                sharedWith: { select: { id: true, name: true, avatar: true } }
            },
            orderBy: [
                { type: 'asc' }, // Folders first
                { uploadDate: 'desc' },
            ],
        });
        
        // Don't expose the PIN hash to the client
        const safeResources = resources.map(({ pin, tags, ...resource }) => ({
            ...resource,
            tags: tags?.split(',').filter(Boolean) ?? [],
            hasPin: !!pin,
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
            uploaderId: session.id,
            parentId: parentId || null,
            ispublic: isPublic === true,
        };
        
        if (isPublic === false && sharedWithUserIds && Array.isArray(sharedWithUserIds)) {
            data.sharedWith = {
                connect: sharedWithUserIds.map((id:string) => ({ id }))
            };
        }

        const newResource = await prisma.resource.create({
            data,
        });
        
        const { pin, ...safeResource } = newResource;

        return NextResponse.json({ 
            ...safeResource,
            tags: safeResource.tags?.split(',').filter(Boolean) ?? [],
            hasPin: !!pin,
        }, { status: 201 });

    } catch (error) {
        console.error('[RESOURCE_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al crear el recurso' }, { status: 500 });
    }
}
