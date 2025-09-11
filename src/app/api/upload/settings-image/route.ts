// src/app/api/upload/settings-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';
import { getCurrentUser } from '@/lib/auth';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  // Verificación de sesión para proteger la ruta
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ success: false, message: 'No autorizado.' }, { status: 401 });
  }
  
  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: 'El cliente de administrador de Supabase no está configurado en el servidor.' }, { status: 500 });
  }

  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: 'No se ha subido ningún archivo.' }, { status: 400 });
  }

  try {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/\s/g, '_')}`;

    const { data: uploadData, error } = await supabaseAdmin.storage
      .from('settings_images')
      .upload(filename, file);

    if (error) {
      throw new Error(error.message);
    }
    
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('settings_images')
      .getPublicUrl(uploadData.path);
      
    return NextResponse.json({ success: true, url: publicUrlData.publicUrl });

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido.';
    console.error('Error al procesar la subida de imagen de configuración:', e);
    return NextResponse.json({ success: false, message: `Error interno al guardar el archivo: ${errorMessage}` }, { status: 500 });
  }
}
