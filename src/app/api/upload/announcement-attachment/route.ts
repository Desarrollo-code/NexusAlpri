// src/app/api/upload/announcement-attachment/route.ts
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
      .from('announcement_attachments')
      .createSignedUploadUrl(finalPath);

    if (error) {
      throw new Error(`Error generando URL firmada: ${error.message}`);
    }
    
    return NextResponse.json({
      success: true,
      uploadUrl: data.signedUrl,
      publicUrl: supabaseAdmin.storage.from('announcement_attachments').getPublicUrl(finalPath).data.publicUrl,
      path: finalPath,
    });

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido.';
    console.error('Error al preparar la subida de adjunto de anuncio:', e);
    return NextResponse.json({ success: false, message: `Error interno: ${errorMessage}` }, { status: 500 });
  }
}
