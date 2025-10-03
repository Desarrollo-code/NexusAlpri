// src/app/api/upload/resource-file/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ success: false, message: 'No autorizado.' }, { status: 403 });
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
    const finalPath = `${uniqueSuffix}-${safeFileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from('resource_library')
      .createSignedUploadUrl(finalPath);

    if (error) {
      throw new Error(`Error generando URL firmada: ${error.message}`);
    }

    const publicUrl = supabaseAdmin.storage.from('resource_library').getPublicUrl(finalPath).data.publicUrl;

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      url: publicUrl, // Aseguramos que la clave sea 'url'
    });

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido al preparar la subida.';
    console.error('Error en /api/upload/resource-file:', e);
    return NextResponse.json({ success: false, message: `Error interno: ${errorMessage}` }, { status: 500 });
  }
}
