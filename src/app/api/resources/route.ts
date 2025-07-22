import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET resources
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parentId') || null;
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    let whereClause: any = { parentId };
    
    if (search) {
        whereClause.AND = whereClause.AND || [];
        whereClause.AND.push({
            OR: [
                { title: { contains: search } },
                { description: { contains: search } },
                { tags: { contains: search } },
            ],
        });
    }

    if (category) {
        whereClause.category = category;
    }

    try {
        const resources = await prisma.resource.findMany({
            where: whereClause,
            include: {
                uploader: { select: { id: true, name: true } },
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
    const session = await getSession(req);
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    
    try {
        const body = await req.json();
        const { title, type, url, category, tags, parentId, description } = body;

        if (!title || !type) {
            return NextResponse.json({ message: 'Título y tipo son requeridos' }, { status: 400 });
        }
        
        if (type !== 'FOLDER' && !url) {
            return NextResponse.json({ message: 'URL es requerida para archivos' }, { status: 400 });
        }

        const newResource = await prisma.resource.create({
            data: {
                title,
                type,
                description,
                url: url || null,
                category: category || 'General',
                tags: Array.isArray(tags) ? tags.join(',') : '',
                uploaderId: session.id,
                parentId: parentId || null,
            },
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
