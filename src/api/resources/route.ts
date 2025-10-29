// src/app/api/resources/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { Prisma, ResourceStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const getFileType = (mimeType: string | null): string => {
    if (!mimeType) return 'Other';
    if (mimeType.startsWith('image/')) return 'Images';
    if (mimeType.startsWith('video/')) return 'Videos';
    if (mimeType === 'application/pdf' || mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('presentation')) return 'Documents';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'Archives';
    return 'Other';
};

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
        const calculateStats = searchParams.get('stats') === 'true';
        
        if (parentId === '') parentId = null;
        
        const baseWhere: Prisma.EnterpriseResourceWhereInput = { parentId, status };
        if (status === 'ACTIVE') {
            baseWhere.OR = [ { expiresAt: null }, { expiresAt: { gte: new Date() } } ];
        }
        if (searchTerm) {
            baseWhere.title = { contains: searchTerm, mode: 'insensitive' };
        }

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
        
        let stats: any = {};

        if (calculateStats) {
            const allFiles = await prisma.enterpriseResource.findMany({
                where: { type: { not: 'FOLDER' } },
                select: { type: true, size: true, fileType: true, uploadDate: true, title: true, id: true, uploader: { select: {name: true} } }
            });
            
            const storageStats = allFiles.reduce((acc, file) => {
                const fileType = getFileType(file.fileType);
                if (!acc[fileType]) {
                    acc[fileType] = { type: fileType, count: 0, size: 0 };
                }
                acc[fileType].count += 1;
                acc[fileType].size += file.size || 0;
                return acc;
            }, {} as Record<string, { type: string, count: number, size: number }>);
            
            const categoryCounts = allFiles.reduce((acc, file) => {
                const fileType = getFileType(file.fileType);
                if (!acc[fileType]) acc[fileType] = 0;
                acc[fileType]++;
                return acc;
            }, {} as Record<string, number>);

            const recentFiles = allFiles
                .sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
                .slice(0, 5)
                .map(f => ({ ...f, uploaderName: f.uploader?.name || 'Sistema' }));
                
            stats.storageStats = Object.values(storageStats);
            stats.categoryCounts = categoryCounts;
            stats.recentFiles = recentFiles;
        }

        return NextResponse.json({ resources: safeResources, ...stats });

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
