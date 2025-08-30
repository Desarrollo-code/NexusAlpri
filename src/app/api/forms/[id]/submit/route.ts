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
            return NextResponse.json({ message: 'Este formulario no está aceptando respuestas.' }, { status: 403 });
        }
        
        let finalScorePercentage: number | null = null;

        if (form.isQuiz) {
            let userPoints = 0;
            let maxPoints = 0;

            for (const field of form.fields) {
                const fieldOptions = field.options as any as FormFieldOption[];
                if (field.type === 'SINGLE_CHOICE' || field.type === 'MULTIPLE_CHOICE') {
                    const fieldAnswer = answers[field.id];
                    
                    // Calcular el máximo de puntos para esta pregunta
                    const correctOptions = fieldOptions.filter(o => o.isCorrect);
                    maxPoints += correctOptions.reduce((sum, opt) => sum + (opt.points || 0), 0);

                    if (!fieldAnswer) continue;
                    
                    if (field.type === 'SINGLE_CHOICE') {
                        const selectedOption = fieldOptions.find(o => o.id === fieldAnswer);
                        if (selectedOption?.isCorrect) {
                            userPoints += selectedOption.points || 0;
                        }
                    } else { // MULTIPLE_CHOICE
                        const selectedOptionIds = new Set(Array.isArray(fieldAnswer) ? fieldAnswer : []);
                        // Solo sumar puntos por las correctas, no restar por incorrectas seleccionadas
                        correctOptions.forEach(correctOpt => {
                            if (selectedOptionIds.has(correctOpt.id)) {
                                userPoints += correctOpt.points || 0;
                            }
                        });
                    }
                }
            }
            
            // Calcular el porcentaje final
            if (maxPoints > 0) {
                finalScorePercentage = (userPoints / maxPoints) * 100;
            } else {
                finalScorePercentage = 0; // Si no hay puntos asignados, la nota es 0
            }
        }
        
        const newResponse = await prisma.formResponse.create({
            data: {
                formId,
                userId: session.id,
                score: finalScorePercentage, // Guardar el porcentaje
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
