// src/app/api/forms/[id]/results/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    
    const { id: formId } = await params;

    try {
        const form = await prisma.form.findUnique({
            where: { id: formId },
            include: {
                fields: { orderBy: { order: 'asc' } },
                responses: {
                    include: {
                        answers: true
                    }
                }
            }
        });

        if (!form) {
            return NextResponse.json({ message: 'Formulario no encontrado' }, { status: 404 });
        }

        if (session.role !== 'ADMINISTRATOR' && form.creatorId !== session.id) {
            return NextResponse.json({ message: 'No tienes permiso para ver estos resultados' }, { status: 403 });
        }

        const totalResponses = form.responses.length;

        const fieldResults = form.fields.map(field => {
            const fieldAnswers = form.responses.flatMap(res => res.answers.filter(ans => ans.fieldId === field.id));
            let stats: any;

            switch (field.type) {
                case 'SHORT_TEXT':
                case 'LONG_TEXT':
                    stats = fieldAnswers.map(ans => ans.value);
                    break;
                case 'SINGLE_CHOICE':
                case 'MULTIPLE_CHOICE':
                    const counts = new Map<string, number>();
                    const allOptions = (field.options as string[]) || [];

                    // Initialize all options with 0 count
                    allOptions.forEach(opt => counts.set(opt, 0));

                    fieldAnswers.forEach(ans => {
                        if (field.type === 'SINGLE_CHOICE') {
                            counts.set(ans.value, (counts.get(ans.value) || 0) + 1);
                        } else { // MULTIPLE_CHOICE
                            try {
                                const selectedOptions: string[] = JSON.parse(ans.value);
                                selectedOptions.forEach(opt => {
                                     if (counts.has(opt)) {
                                        counts.set(opt, counts.get(opt)! + 1);
                                    }
                                });
                            } catch (e) { /* ignore malformed data */ }
                        }
                    });
                    stats = Array.from(counts.entries()).map(([option, count]) => ({ option, count }));
                    break;
                default:
                    stats = { message: 'Tipo de campo no soportado para análisis' };
            }
            
            return {
                id: field.id,
                label: field.label,
                type: field.type,
                stats: stats
            };
        });

        return NextResponse.json({
            formTitle: form.title,
            totalResponses: totalResponses,
            fields: fieldResults,
        });

    } catch (error) {
        console.error(`[RESULTS_FORM_ID: ${formId}]`, error);
        return NextResponse.json({ message: 'Error al obtener los resultados del formulario' }, { status: 500 });
    }
}
