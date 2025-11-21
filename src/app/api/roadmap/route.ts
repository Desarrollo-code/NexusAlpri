// src/app/api/roadmap/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all roadmap items
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        const items = await prisma.roadmapItem.findMany({
            orderBy: {
                date: 'asc',
            },
        });
        return NextResponse.json(items);
    } catch (error) {
        console.error("[ROADMAP_GET_ERROR]", error);
        return NextResponse.json({ message: 'Error al cargar la hoja de ruta' }, { status: 500 });
    }
}

// POST a new roadmap item (Admin only)
export async function POST(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { title, description, date, phase, icon, color } = body;

        if (!title || !description || !date || !phase) {
            return NextResponse.json({ message: 'Faltan campos requeridos.' }, { status: 400 });
        }

        const newItem = await prisma.roadmapItem.create({
            data: {
                title,
                description,
                date: new Date(date),
                phase,
                icon: icon || 'Lightbulb',
                color: color || '#3b82f6',
            },
        });

        return NextResponse.json(newItem, { status: 201 });

    } catch (error) {
        console.error('[ROADMAP_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al crear el hito' }, { status: 500 });
    }
}
