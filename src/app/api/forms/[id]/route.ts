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
    return NextResponse.json({ message: 'Formulario no encontrado' }, { status: 404 });
  }

  if (session.role !== 'ADMINISTRATOR' && form.creatorId !== session.id) {
    return NextResponse.json({ message: 'No tienes permiso para modificar este formulario' }, { status: 403 });
  }

  return null; // Devuelve null si todo está bien
}

// GET a specific form by ID with its fields
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id: formId } = params;

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
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id: formId } = params;

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

      // Handle fields
      if (fields && Array.isArray(fields)) {
        const currentFields = await tx.formField.findMany({ where: { formId } });
        const incomingFieldIds = new Set(fields.map((f: FormField) => f.id).filter((id: string) => !id.startsWith('new-')));

        // Delete fields that are no longer present
        const fieldsToDelete = currentFields.filter(f => !incomingFieldIds.has(f.id));
        if (fieldsToDelete.length > 0) {
          await tx.formField.deleteMany({ where: { id: { in: fieldsToDelete.map(f => f.id) } } });
        }

        // Create or update incoming fields
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

          if (isNew) {
            await tx.formField.create({ data: fieldPayload });
          } else {
            await tx.formField.update({
              where: { id: fieldData.id },
              data: fieldPayload,
            });
          }
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
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id: formId } = params;

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
    return NextResponse.json({ message: 'Error al eliminar el formulario' }, { status: 500 });
  }
}
