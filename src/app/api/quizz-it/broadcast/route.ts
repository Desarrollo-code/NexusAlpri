// src/app/api/quizz-it/broadcast/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-client';

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'El cliente de administrador de Supabase no está configurado.' }, { status: 500 });
  }

  try {
    const { sessionId, event, payload } = await req.json();

    if (!sessionId || !event) {
      return NextResponse.json({ message: 'sessionId y event son requeridos' }, { status: 400 });
    }

    const channelName = `game:${sessionId}`;
    
    // Usar el cliente Admin para insertar en la tabla de Realtime,
    // lo que disparará el evento a los clientes suscritos.
    const { error } = await supabaseAdmin
      .from('RealtimeMessage')
      .insert({
        channel: channelName,
        event: event,
        payload: payload,
      });

    if (error) {
      throw new Error(`Error de Supabase al hacer broadcast: ${error.message}`);
    }

    return NextResponse.json({ success: true, message: 'Evento enviado.' });

  } catch (error) {
    console.error('Error broadcasting event:', error);
    return NextResponse.json({ message: 'Error al enviar el evento', error: (error as Error).message }, { status: 500 });
  }
}
