// src/app/api/upload/lesson-file/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';
import { getCurrentUser } from '@/lib/auth';

// Aumentar el tiempo de ejecución si es necesario para la generación de la URL
export const maxDuration = 60; 

// Configuración para deshabilitar el límite de tamaño del cuerpo de la solicitud
// ¡ADVERTENCIA! Esto solo afecta al servidor de desarrollo de Next.js.
// La lógica ahora depende de la subida directa del cliente para evitar los límites de Vercel.
export const config = {
  api: {
    bodyParser: false,
  },
};

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
    const finalPath = `${uniqueSuffix}-${safeFileName}`;

    // Generar una URL firmada para la subida
    const { data, error } = await supabaseAdmin.storage
      .from('lesson_files')
      .createSignedUploadUrl(finalPath);

    if (error) {
      throw new Error(`Error generando URL firmada: ${error.message}`);
    }

    // Devolvemos la URL firmada (PUT) y la URL pública final (GET)
    return NextResponse.json({
      success: true,
      uploadUrl: data.signedUrl,
      publicUrl: supabaseAdmin.storage.from('lesson_files').getPublicUrl(finalPath).data.publicUrl,
      path: finalPath,
    });

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido al preparar la subida.';
    console.error('Error en /api/upload/lesson-file:', e);
    return NextResponse.json({ success: false, message: `Error interno: ${errorMessage}` }, { status: 500 });
  }
}
