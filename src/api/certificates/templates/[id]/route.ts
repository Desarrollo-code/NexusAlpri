// src/app/api/certificates/templates/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Helper to check permissions
async function checkPermissions(session: any, templateId: string) {
    if (!session || session.role !== 'ADMINISTRATOR') {
        return { authorized: false, error: NextResponse.json({ message: 'No autorizado' }, { status: 403 }) };
    }

    const template = await prisma.certificateTemplate.findUnique({
        where: { id: templateId },
    });

    if (!template) {
        return { authorized: false, error: NextResponse.json({ message: 'Plantilla no encontrada' }, { status: 404 }) };
    }
    
    return { authorized: true, error: null };
}


// PUT (Update) a specific certificate template
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    const { id: templateId } = params;
    
    const permission = await checkPermissions(session, templateId);
    if (!permission.authorized) return permission.error;

    try {
        const body = await req.json();
        const { name, backgroundImageUrl, textColor, studentNamePosition, courseNamePosition, datePosition, scorePosition } = body;
        
        if (!name || !backgroundImageUrl) {
            return NextResponse.json({ message: 'Nombre e imagen son requeridos' }, { status: 400 });
        }
        
        const updatedTemplate = await prisma.certificateTemplate.update({
            where: { id: templateId },
            data: {
                name,
                backgroundImageUrl,
                textColor,
                studentNamePosition,
                courseNamePosition,
                datePosition,
                scorePosition,
            },
        });

        return NextResponse.json(updatedTemplate);
    } catch (error) {
        if ((error as any).code === 'P2002') {
             return NextResponse.json({ message: 'Ya existe una plantilla con ese nombre.' }, { status: 409 });
        }
        console.error(`[CERTIFICATE_TEMPLATE_PUT_ERROR: ${templateId}]`, error);
        return NextResponse.json({ message: 'Error al actualizar la plantilla' }, { status: 500 });
    }
}


// DELETE a specific certificate template
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    const { id: templateId } = params;

    const permission = await checkPermissions(session, templateId);
    if (!permission.authorized) return permission.error;
    
    try {
        // Opcional: Verificar si la plantilla está en uso antes de eliminar.
        const coursesUsingTemplate = await prisma.course.count({
            where: { certificateTemplateId: templateId },
        });

        if (coursesUsingTemplate > 0) {
            return NextResponse.json({ 
                message: `No se puede eliminar. La plantilla está siendo utilizada por ${coursesUsingTemplate} curso(s).` 
            }, { status: 409 });
        }

        await prisma.certificateTemplate.delete({
            where: { id: templateId },
        });

        return new NextResponse(null, { status: 204 });

    } catch (error) {
        if ((error as any).code === 'P2025') {
            return new NextResponse(null, { status: 204 }); // Not found is okay on delete
        }
        console.error(`[CERTIFICATE_TEMPLATE_DELETE_ERROR: ${templateId}]`, error);
        return NextResponse.json({ message: 'Error al eliminar la plantilla' }, { status: 500 });
    }
}
