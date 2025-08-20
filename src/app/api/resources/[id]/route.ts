// src/app/api/resources/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// GET a specific resource
export async function GET(req: NextRequest, context: { params: { id: string } }) {
    try {
        const { id } = context.params;
        const resource = await prisma.enterpriseResource.findUnique({
            where: { id },
            include: {
                uploader: { select: { id: true, name: true } },
                sharedWith: { select: { id: true, name: true, avatar: true } }
            },
        });
        if (!resource) {
            return NextResponse.json({ message: 'Recurso no encontrado' }, { status: 404 });
        }
        const { pin, tags, ...safeResource } = resource;
        return NextResponse.json({
            ...safeResource,
            tags: tags ? tags.split(',').filter(Boolean) : [],
            hasPin: !!pin,
        });
    } catch (error) {
        console.error('[RESOURCE_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener el recurso' }, { status: 500 });
    }
}


// PUT (update) a resource
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    
    try {
        const { id } = context.params;
        const resourceToUpdate = await prisma.enterpriseResource.findUnique({ where: { id } });
        if (!resourceToUpdate) {
            return NextResponse.json({ message: 'Recurso no encontrado' }, { status: 404 });
        }
        if (session.role === 'INSTRUCTOR' && resourceToUpdate.uploaderId !== session.id) {
             return NextResponse.json({ message: 'No tienes permiso para editar este recurso' }, { status: 403 });
        }

        const { title, category, tags, description, isPublic, sharedWithUserIds } = await req.json();

        const updatedResource = await prisma.enterpriseResource.update({
            where: { id },
            data: { 
                title, 
                category, 
                tags: Array.isArray(tags) ? tags.join(',') : '',
                description,
                ispublic: isPublic,
                sharedWith: isPublic ? { set: [] } : { set: sharedWithUserIds.map((id: string) => ({ id })) }
            },
        });

        return NextResponse.json(updatedResource);
    } catch (error) {
        console.error('[RESOURCE_PUT_ERROR]', error);
        return NextResponse.json({ message: 'Error al actualizar el recurso' }, { status: 500 });
    }
}

// DELETE a resource
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { id } = context.params;
        const resourceToDelete = await prisma.enterpriseResource.findUnique({ where: { id } });
        if (!resourceToDelete) {
            return NextResponse.json({ message: 'Recurso no encontrado' }, { status: 404 });
        }
        if (session.role === 'INSTRUCTOR' && resourceToDelete.uploaderId !== session.id) {
             return NextResponse.json({ message: 'No tienes permiso para eliminar este recurso' }, { status: 403 });
        }
        
        if (resourceToDelete.type === 'FOLDER') {
            const children = await prisma.enterpriseResource.findMany({ where: { parentId: id } });
            if (children.length > 0) {
                return NextResponse.json({ message: 'No se puede eliminar una carpeta que contiene otros recursos.' }, { status: 409 });
            }
        }

        await prisma.enterpriseResource.delete({ where: { id } });
        
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[RESOURCE_DELETE_ERROR]', error);
        return NextResponse.json({ message: 'Error al eliminar el recurso' }, { status: 500 });
    }
}