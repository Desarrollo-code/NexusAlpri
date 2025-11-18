// src/app/api/upload/form-image/route.ts
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
    const finalFilename = `${uniqueSuffix}-${safeFileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from('form_images')
      .createSignedUploadUrl(finalFilename);

    if (error) {
        // CORRECCIÓN: Capturar el error específico de "recurso no encontrado" (bucket)
        if (error.message.includes("The related resource does not exist")) {
             return NextResponse.json({ success: false, message: "Error de configuración de Supabase: El bucket 'form_images' no existe." }, { status: 500 });
        }
        if (error.message.includes("Project not found")) {
            return NextResponse.json({ success: false, message: 'Error de configuración de Supabase: Proyecto no encontrado o clave inválida.' }, { status: 500 });
        }
        throw new Error(`Error generando URL firmada: ${error.message}`);
    }
    
    const publicUrl = supabaseAdmin.storage.from('form_images').getPublicUrl(finalFilename).data.publicUrl;
      
    return NextResponse.json({
      uploadUrl: data.signedUrl,
      url: publicUrl,
    });

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido.';
    console.error('Error al procesar la subida de imagen de formulario:', e);
    return NextResponse.json({ success: false, message: `Error interno: ${errorMessage}` }, { status: 500 });
  }
}
