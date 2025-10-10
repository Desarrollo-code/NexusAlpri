// src/app/api/upload/chat-attachment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';
import { getCurrentUser } from '@/lib/auth';

export const maxDuration = 60; // Increase timeout for larger files

export async function POST(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ success: false, message: 'No autorizado.' }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: 'Cliente de Supabase no configurado.' }, { status: 500 });
  }

  try {
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ success: false, message: 'Nombre de archivo y tipo de contenido son requeridos.' }, { status: 400 });
    }

    const safeFileName = filename.replace(/[^a-zA-Z0-9-_\.]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const finalPath = `${session.id}/${uniqueSuffix}-${safeFileName}`;

    // Generar una URL firmada para la subida
    const { data, error } = await supabaseAdmin.storage
      .from('chat_attachments')
      .createSignedUploadUrl(finalPath);

    if (error) {
      throw new Error(`Error generando URL firmada: ${error.message}`);
    }

    const publicUrl = supabaseAdmin.storage.from('chat_attachments').getPublicUrl(finalPath).data.publicUrl;

    // Devolvemos la URL firmada (PUT) y la URL pública final (GET)
    return NextResponse.json({
      uploadUrl: data.signedUrl,
      url: publicUrl,
    });

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido al preparar la subida.';
    console.error('Error en /api/upload/chat-attachment:', e);
    return NextResponse.json({ success: false, message: `Error interno: ${errorMessage}` }, { status: 500 });
  }
}
