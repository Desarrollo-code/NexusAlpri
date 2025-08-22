// src/app/api/forms/[id]/submit/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    // Allow unauthenticated users if form is public in the future, for now require login
    if (!session) {
        return NextResponse.json({ message: 'Debes iniciar sesión para responder' }, { status: 401 });
    }
    
    const { id: formId } = params;

    try {
        const body = await req.json();
        const { answers } = body;

        if (!answers || typeof answers !== 'object') {
            return NextResponse.json({ message: 'Se requieren respuestas válidas' }, { status: 400 });
        }
        
        const form = await prisma.form.findUnique({
            where: { id: formId },
            include: { fields: true }
        });

        if (!form || form.status !== 'PUBLISHED') {
            return NextResponse.json({ message: 'Este formulario no está aceptando respuestas.' }, { status: 403 });
        }

        // TODO: Add check to see if user has already responded if needed
        
        const newResponse = await prisma.formResponse.create({
            data: {
                formId,
                userId: session.id,
                answers: {
                    create: Object.entries(answers).map(([fieldId, value]) => {
                        const fieldValue = Array.isArray(value) ? JSON.stringify(value) : String(value);
                        return {
                            fieldId,
                            value: fieldValue,
                        };
                    })
                }
            }
        });

        return NextResponse.json({ message: 'Respuesta enviada con éxito', responseId: newResponse.id }, { status: 201 });

    } catch (error) {
        console.error(`[SUBMIT_FORM_ID: ${formId}]`, error);
        return NextResponse.json({ message: 'Error al enviar la respuesta' }, { status: 500 });
    }
}
