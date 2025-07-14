
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET resources
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parentId') || null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    const skip = (page - 1) * pageSize;

    let whereClause: any = { parentId };
    if (search) {
        whereClause.AND = whereClause.AND || [];
        whereClause.AND.push({
            OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { tags: { has: search.toLowerCase() } },
            ],
        });
    }
    if (category && category !== 'all') {
        whereClause.AND = whereClause.AND || [];
        whereClause.AND.push({ category: category });
    }

    try {
        const [resources, totalResources] = await prisma.$transaction([
            prisma.resource.findMany({
                where: whereClause,
                include: {
                    uploader: { select: { id: true, name: true } },
                },
                orderBy: [
                    { type: 'asc' }, // Folders first
                    { uploadDate: 'desc' },
                ],
                skip: skip,
                take: pageSize,
            }),
            prisma.resource.count({ where: whereClause })
        ]);
        
        // Don't expose the PIN hash to the client and correctly type cast JSON fields
        const safeResources = resources.map(({ pin, tags, ...resource }) => ({
            ...resource,
            tags: (Array.isArray(tags) ? tags : []) as string[],
            hasPin: !!pin,
        }));

        return NextResponse.json({ resources: safeResources, totalResources });
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
                tags: tags || [],
                uploaderId: session.id,
                parentId: parentId || null,
            },
        });
        
        const { pin, ...safeResource } = newResource;

        return NextResponse.json({ 
            ...safeResource, 
            hasPin: !!pin,
        }, { status: 201 });

    } catch (error) {
        console.error('[RESOURCE_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al crear el recurso' }, { status: 500 });
    }
}
