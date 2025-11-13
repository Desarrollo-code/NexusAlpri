// src/app/api/upload/settings-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'ADMINISTRATOR') {
    return NextResponse.json({ success: false, message: 'No autorizado.' }, { status: 403 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: 'El cliente de administrador de Supabase no está configurado en el servidor.' }, { status: 500 });
  }

  try {
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ success: false, message: 'Nombre de archivo y tipo de contenido son requeridos.' }, { status: 400 });
    }
    
    const safeFileName = filename.replace(/[^a-zA-Z0-9-_\.]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const finalFilename = `${uniqueSuffix}-${safeFileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from('settings_images')
      .createSignedUploadUrl(finalFilename);

    if (error) {
      throw new Error(`Error generando URL firmada: ${error.message}`);
    }
    
    const publicUrl = supabaseAdmin.storage.from('settings_images').getPublicUrl(finalFilename).data.publicUrl;
      
    return NextResponse.json({
      uploadUrl: data.signedUrl,
      url: publicUrl,
    });

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido.';
    console.error('Error al procesar la subida de imagen de configuración:', e);
    return NextResponse.json({ success: false, message: `Error interno al guardar el archivo: ${errorMessage}` }, { status: 500 });
  }
}
