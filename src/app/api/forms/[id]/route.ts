// src/app/api/forms/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { FormField, FormFieldType, FormFieldOption } from '@/types';
import { supabaseAdmin } from '@/lib/supabase-client';

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
    return { authorized: false, error: NextResponse.json({ message: 'No tienes permiso para acceder a este formulario' }, { status: 403 }) };
  }

  return { authorized: true, error: null };
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
          select: { id: true, label: true, type: true, required: true, placeholder: true, order: true, options: true, imageUrl: true }
        },
        sharedWith: {
            select: { id: true, name: true, avatar: true }
        }
      },
    });

    if (!form) {
      return NextResponse.json({ message: 'Formulario no encontrado' }, { status: 404 });
    }
    
    // Parse options string to JSON object for each field safely
    const formWithParsedOptions = {
        ...form,
        fields: form.fields.map(field => {
            let parsedOptions = [];
            try {
                if (field.options && typeof field.options === 'string') {
                    parsedOptions = JSON.parse(field.options);
                } else if (Array.isArray(field.options)) {
                    parsedOptions = field.options; // It's already an array
                }
            } catch (e) {
                console.error(`Could not parse options for field ${field.id}:`, e);
            }
            return {
                ...field,
                options: parsedOptions,
            };
        })
    };

    return NextResponse.json(formWithParsedOptions);
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

  const permission = await checkPermissions(formId, session);
  if (!permission.authorized) return permission.error;

  try {
    const body = await req.json();
    const { title, description, status, isQuiz, fields, sharedWithUserIds, headerImageUrl, themeColor, backgroundColor, fontStyle, template, timerStyle } = body;

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (status !== undefined) dataToUpdate.status = status;
    if (isQuiz !== undefined) dataToUpdate.isQuiz = isQuiz;
    if (headerImageUrl !== undefined) dataToUpdate.headerImageUrl = headerImageUrl;
    if (themeColor !== undefined) dataToUpdate.themeColor = themeColor;
    if (backgroundColor !== undefined) dataToUpdate.backgroundColor = backgroundColor;
    if (fontStyle !== undefined) dataToUpdate.fontStyle = fontStyle;
    if (template !== undefined) dataToUpdate.template = template;
    if (timerStyle !== undefined) dataToUpdate.timerStyle = timerStyle;

    if (sharedWithUserIds !== undefined) {
        dataToUpdate.sharedWith = {
            set: sharedWithUserIds.map((id: string) => ({ id }))
        }
    }


    await prisma.$transaction(async (tx) => {
      // Update the main form data if there's anything to update
      if (Object.keys(dataToUpdate).length > 0) {
        await tx.form.update({
            where: { id: formId },
            data: dataToUpdate,
        });
      }

      if (fields && Array.isArray(fields)) {
        const incomingFieldIds = new Set(fields.map((f: FormField) => f.id).filter(id => !id.startsWith('new-')));
        
        await tx.formField.deleteMany({
          where: {
            formId: formId,
            id: {
              notIn: Array.from(incomingFieldIds) as string[],
            },
          },
        });

        for (const [index, fieldData] of (fields as FormField[]).entries()) {
          const isNew = fieldData.id.startsWith('new-');
          
          const fieldPayload = {
            label: fieldData.label,
            type: fieldData.type as FormFieldType,
            options: (fieldData.options as unknown as FormFieldOption[]),
            required: fieldData.required || false,
            placeholder: fieldData.placeholder || null,
            order: index,
            formId: formId,
            imageUrl: fieldData.imageUrl,
            template: fieldData.template,
          };
          
          await tx.formField.upsert({
            where: { id: isNew ? `__NEVER_FIND__${fieldData.id}` : fieldData.id },
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
    console.error(`[UPDATE_FORM_ID: ${formId}] Error al actualizar el formulario:`, error);
    if ((error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Error de concurrencia: Uno de los elementos a actualizar no fue encontrado. Inténtalo de nuevo.' }, { status: 409 });
    }
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

  const permission = await checkPermissions(formId, session);
  if (!permission.authorized) return permission.error;

  try {
    await prisma.$transaction([
        prisma.notification.deleteMany({
            where: {
                link: {
                    contains: `/forms/${formId}`
                }
            }
        }),
        prisma.form.delete({ where: { id: formId } })
    ]);
    
    if (supabaseAdmin) {
        const channel = supabaseAdmin.channel('forms');
        await channel.send({
            type: 'broadcast',
            event: 'form_deleted',
            payload: { id: formId },
        });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`[DELETE_FORM_ID: ${formId}] Error al eliminar el formulario:`, error);
    if ((error as any).code === 'P2025') {
       return NextResponse.json({ message: 'El formulario a eliminar no fue encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Error al eliminar el formulario' }, { status: 500 });
  }
}
