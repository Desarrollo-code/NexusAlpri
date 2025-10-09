// src/app/api/quizz-it/create/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Función para generar un PIN numérico único de 6 dígitos
async function generateUniquePin(): Promise<string> {
  let pin;
  let isUnique = false;
  while (!isUnique) {
    pin = Math.floor(100000 + Math.random() * 900000).toString();
    const existingSession = await prisma.gameSession.findUnique({
      where: { pin },
    });
    if (!existingSession) {
      isUnique = true;
    }
  }
  return pin!;
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const { formId } = await req.json();

    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { fields: true },
    });

    if (!form || !form.isQuiz) {
      return NextResponse.json({ message: 'Solo se puede iniciar un juego desde un formulario tipo Quiz.' }, { status: 400 });
    }

    if (form.fields.length === 0) {
      return NextResponse.json({ message: 'El quiz debe tener al menos una pregunta.' }, { status: 400 });
    }

    const pin = await generateUniquePin();

    const gameSession = await prisma.gameSession.create({
      data: {
        pin,
        formId,
        hostId: session.id,
        status: 'LOBBY',
      },
    });

    return NextResponse.json(gameSession);
  } catch (error) {
    console.error('Error creating Quizz-IT session:', error);
    return NextResponse.json({ message: 'Error al crear la sesión del juego' }, { status: 500 });
  }
}
