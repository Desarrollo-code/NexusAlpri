// src/app/api/forms/[id]/submit/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { FormFieldOption } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
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
            include: { 
                fields: {
                    select: { id: true, type: true, options: true }
                }
            }
        });

        if (!form || form.status !== 'PUBLISHED') {
            return NextResponse.json({ message: 'Este formulario no está aceptando respuestas actualmente.' }, { status: 403 });
        }
        
        let finalScorePercentage: number | null = null;

        if (form.isQuiz) {
            let userPoints = 0;
            let maxPoints = 0;

            for (const field of form.fields) {
                if (field.type !== 'SINGLE_CHOICE') continue;

                const fieldOptions = field.options as unknown as FormFieldOption[];
                if (!fieldOptions || fieldOptions.length === 0) continue;
                
                const questionMaxPoints = fieldOptions
                    .filter(opt => opt.isCorrect)
                    .reduce((sum, opt) => sum + (opt.points || 0), 0);
                
                if (questionMaxPoints === 0) continue;

                maxPoints += questionMaxPoints;

                const userAnswerId = answers[field.id];
                if (!userAnswerId) continue; 
                
                const selectedOption = fieldOptions.find(o => o.id === userAnswerId);
                if (selectedOption?.isCorrect) {
                    userPoints += selectedOption.points || 0;
                }
            }
            
            finalScorePercentage = maxPoints > 0 ? (userPoints / maxPoints) * 100 : 0;
        }
        
        const newResponse = await prisma.formResponse.create({
            data: {
                formId,
                userId: session.id,
                score: finalScorePercentage,
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

        return NextResponse.json({ message: 'Respuesta enviada con éxito', responseId: newResponse.id, score: finalScorePercentage }, { status: 201 });

    } catch (error) {
        console.error(`[SUBMIT_FORM_ID: ${formId}]`, error);
        return NextResponse.json({ message: 'Error al enviar la respuesta' }, { status: 500 });
    }
}
