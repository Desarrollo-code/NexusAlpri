// src/app/api/forms/[id]/results/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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
                fields: { orderBy: { order: 'asc' } },
                responses: {
                    include: {
                        answers: true,
                        user: { select: { id: true, name: true, avatar: true }}
                    },
                    orderBy: {
                        submittedAt: 'desc'
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
        
        let averageScore: number | undefined = undefined;
        if (form.isQuiz) {
            const scores = form.responses.map(r => r.score).filter(s => s !== null) as number[];
            if (scores.length > 0) {
                averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            }
        }


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
                    const allOptions = (field.options as any[]).map(opt => opt.text) || [];

                    // Initialize all options with 0 count
                    allOptions.forEach(opt => counts.set(opt, 0));

                    fieldAnswers.forEach(ans => {
                        const selectedOptionIds: string[] = [];
                        if (field.type === 'SINGLE_CHOICE') {
                             selectedOptionIds.push(ans.value);
                        } else { // MULTIPLE_CHOICE
                            try {
                                const parsed = JSON.parse(ans.value);
                                if (Array.isArray(parsed)) {
                                    selectedOptionIds.push(...parsed);
                                }
                            } catch (e) { /* ignore malformed data */ }
                        }
                        
                         selectedOptionIds.forEach(optId => {
                            const value = (field.options as any[]).find(opt => opt.id === optId)?.text;
                             if (value && counts.has(value)) {
                                counts.set(value, counts.get(value)! + 1);
                            }
                        });

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
            isQuiz: form.isQuiz,
            totalResponses: totalResponses,
            averageScore: averageScore,
            responses: form.isQuiz ? form.responses.map(r => ({ id: r.id, user: r.user, score: r.score })) : undefined,
            fields: fieldResults,
        });

    } catch (error) {
        console.error(`[RESULTS_FORM_ID: ${formId}]`, error);
        return NextResponse.json({ message: 'Error al obtener los resultados del formulario' }, { status: 500 });
    }
}