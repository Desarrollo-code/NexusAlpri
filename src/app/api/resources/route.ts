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
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');

    // --- Start of Advanced Permission Logic ---
    const permissionsClause = {
        OR: [
            { ispublic: true },
            { uploaderId: session.id },
            { sharedWith: { some: { id: session.id } } }
        ]
    };
    // --- End of Advanced Permission Logic ---
    
    // Filters that apply ON TOP of permissions
    const filterClauses: any[] = [{ parentId }];
    if (search) {
        filterClauses.push({
            OR: [
                { title: { contains: search } },
                { description: { contains: search } },
                { tags: { has: search } },
            ],
        });
    }
    if (category && category !== 'all') {
        filterClauses.push({ category });
    }
    if (type && type !== 'all') {
        filterClauses.push({ type });
    }
    if (dateFrom) {
        filterClauses.push({ uploadDate: { gte: new Date(dateFrom) } });
    }

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
        const safeResources = resources.map(({ pin, ...resource }) => ({
            ...resource,
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
            tags: tags || [],
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
            tags: safeResource.tags,
            hasPin: !!pin,
        }, { status: 201 });

    } catch (error) {
        console.error('[RESOURCE_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al crear el recurso' }, { status: 500 });
    }
}
