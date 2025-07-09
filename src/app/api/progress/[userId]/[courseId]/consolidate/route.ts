
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { consolidateCourseProgress } from '@/lib/progress';

export async function POST(req: NextRequest, { params }: { params: { userId: string, courseId: string } }) {
    const session = await getSession(req);
    const { userId, courseId } = params;

    if (!session || session.id !== userId) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const finalProgress = await consolidateCourseProgress({ userId, courseId });
        return NextResponse.json(finalProgress);
    } catch (error) {
        console.error('[CONSOLIDATE_PROGRESS_ERROR]', error);
        return NextResponse.json({ message: 'Error al consolidar el progreso del curso' }, { status: 500 });
    }
}
