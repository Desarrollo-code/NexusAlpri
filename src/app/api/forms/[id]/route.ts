// src/app/api/forms/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { FormField, FormFieldType, FormFieldOption } from '@/types';

export const dynamic = 'force-dynamic';

async function checkPermissions(formId: string, session: any) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { creatorId: true }
  });

  if (!form) {
    return NextResponse.json({ message: 'Formulario no encontrado' }, { status: 404 });
  }

  if (session.role !== 'ADMINISTRATOR' && form.creatorId !== session.id) {
    return NextResponse.json({ message: 'No tienes permiso para modificar este formulario' }, { status: 403 });
  }

  return null; // Devuelve null si todo está bien
}

// GET a specific form by ID with its fields
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: formId } = await params;

  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

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

    return NextResponse.json(form);
  } catch (error) {
    console.error(`[GET_FORM_ID: ${formId}] Error al obtener el formulario:`, error);
    return NextResponse.json({ message: 'Error al obtener el formulario' }, { status: 500 });
  }
}

// PUT (update) a form, including its fields
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: formId } = await params;

  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const authError = await checkPermissions(formId, session);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { title, description, status, isQuiz, fields } = body;

    const dataToUpdate: any = { title, description, status, isQuiz };

    await prisma.$transaction(async (tx) => {
      // Update the main form data
      await tx.form.update({
        where: { id: formId },
        data: dataToUpdate,
      });

      if (fields && Array.isArray(fields)) {
        const incomingFieldIds = new Set(fields.map((f: FormField) => f.id));
        
        // Delete fields that are not in the incoming list
        await tx.formField.deleteMany({
          where: {
            formId: formId,
            id: {
              notIn: Array.from(incomingFieldIds) as string[],
            },
          },
        });

        // Upsert all incoming fields
        for (const [index, fieldData] of (fields as FormField[]).entries()) {
          const isNew = fieldData.id.startsWith('new-');
          
          const fieldPayload = {
            label: fieldData.label,
            type: fieldData.type as FormFieldType,
            options: (fieldData.options as unknown as FormFieldOption[]) || [],
            required: fieldData.required || false,
            placeholder: fieldData.placeholder || null,
            order: index,
            formId: formId,
          };
          
          await tx.formField.upsert({
            where: { id: isNew ? `__NEVER_FIND__${fieldData.id}` : fieldData.id },
            create: { ...fieldPayload, id: isNew ? undefined : fieldData.id },
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
    console.error(`[UPDATE_FORM_ID: ${formId}] Error al actualizar el formulario:`, error);
    return NextResponse.json({ message: 'Error al actualizar el formulario' }, { status: 500 });
  }
}

// DELETE a form
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: formId } = await params;

  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const authError = await checkPermissions(formId, session);
  if (authError) return authError;

  try {
    await prisma.form.delete({ where: { id: formId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`[DELETE_FORM_ID: ${formId}] Error al eliminar el formulario:`, error);
    if ((error as any).code === 'P2025') {
       return NextResponse.json({ message: 'El formulario a eliminar no fue encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error al eliminar el formulario' }, { status: 500 });
  }
}
