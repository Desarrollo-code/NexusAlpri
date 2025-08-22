// src/app/api/forms/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { FormField, FormFieldType } from '@prisma/client';

export const dynamic = 'force-dynamic';

async function checkPermissions(formId: string, session: any) {
    const form = await prisma.form.findUnique({
        where: { id: formId },
        select: { creatorId: true }
    });

    if (!form) {
        return { authorized: false, error: NextResponse.json({ message: 'Formulario no encontrado' }, { status: 404 }) };
    }

    if (session.role !== 'ADMINISTRATOR' && form.creatorId !== session.id) {
        return { authorized: false, error: NextResponse.json({ message: 'No tienes permiso para modificar este formulario' }, { status: 403 }) };
    }
    
    return { authorized: true, error: null };
}

// GET a specific form by ID with its fields
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    
    const { id: formId } = params;

    try {
        const form = await prisma.form.findUnique({
            where: { id: formId },
            include: {
                fields: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!form) {
            return NextResponse.json({ message: 'Formulario no encontrado' }, { status: 404 });
        }
        
        // Optional: Check if user has access to view it (if it's not their own)
        const isCreator = form.creatorId === session.id;
        const isAdmin = session.role === 'ADMINISTRATOR';

        if (!isCreator && !isAdmin) {
             // You might want to check for shared access here in the future
             return NextResponse.json({ message: 'No tienes permiso para ver este formulario' }, { status: 403 });
        }

        return NextResponse.json(form);
    } catch (error) {
        console.error(`[GET_FORM_ID: ${formId}]`, error);
        return NextResponse.json({ message: 'Error al obtener el formulario' }, { status: 500 });
    }
}


// PUT (update) a form, including its fields
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    
    const { id: formId } = params;
    const authResult = await checkPermissions(formId, session);
    if (!authResult.authorized) return authResult.error;

    try {
        const body = await req.json();
        const { title, description, status, fields } = body;
        
        // Basic form data
        const dataToUpdate: any = { title, description, status };

        await prisma.$transaction(async (tx) => {
            // Update the main form data
            await tx.form.update({
                where: { id: formId },
                data: dataToUpdate,
            });

            // Handle fields
            if (fields && Array.isArray(fields)) {
                const currentFields = await tx.formField.findMany({ where: { formId } });
                const incomingFieldIds = new Set(fields.map((f: FormField) => f.id).filter((id: string) => !id.startsWith('new-')));
                
                // Delete fields that are no longer present
                const fieldsToDelete = currentFields.filter(f => !incomingFieldIds.has(f.id));
                if (fieldsToDelete.length > 0) {
                    await tx.formField.deleteMany({ where: { id: { in: fieldsToDelete.map(f => f.id) } } });
                }

                // Upsert incoming fields
                for (const [index, fieldData] of fields.entries()) {
                    const isNew = fieldData.id.startsWith('new-');
                    const fieldPayload = {
                        label: fieldData.label,
                        type: fieldData.type as FormFieldType,
                        options: fieldData.options || [],
                        required: fieldData.required || false,
                        placeholder: fieldData.placeholder || null,
                        order: index,
                        formId: formId,
                    };

                    await tx.formField.upsert({
                        where: { id: isNew ? `_nonexistent_${fieldData.id}` : fieldData.id },
                        create: fieldPayload,
                        update: fieldPayload,
                    });
                }
            }
        });

        const updatedForm = await prisma.form.findUnique({
            where: { id: formId },
            include: { fields: { orderBy: { order: 'asc' } } }
        });

        return NextResponse.json(updatedForm);

    } catch (error) {
        console.error(`[UPDATE_FORM_ID: ${formId}]`, error);
        return NextResponse.json({ message: 'Error al actualizar el formulario' }, { status: 500 });
    }
}


// DELETE a form
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { id: formId } = params;
    const authResult = await checkPermissions(formId, session);
    if (!authResult.authorized) return authResult.error;

    try {
        await prisma.form.delete({ where: { id: formId } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`[DELETE_FORM_ID: ${formId}]`, error);
        return NextResponse.json({ message: 'Error al eliminar el formulario' }, { status: 500 });
    }
}
