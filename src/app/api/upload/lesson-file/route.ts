// src/app/api/upload/lesson-file/route.ts
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

  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: 'No se ha subido ningún archivo.' }, { status: 400 });
  }

  try {
    const safeFileName = file.name.replace(/[^a-zA-Z0-9-_\.]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const finalPath = `${uniqueSuffix}-${safeFileName}`;

    const { data: uploadData, error } = await supabaseAdmin.storage
      .from('lesson_files')
      .upload(finalPath, file);

    if (error) {
      throw new Error(`Error subiendo a Supabase: ${error.message}`);
    }

    const publicUrl = supabaseAdmin.storage.from('lesson_files').getPublicUrl(uploadData.path).data.publicUrl;

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido al preparar la subida.';
    console.error('Error en /api/upload/lesson-file:', e);
    return NextResponse.json({ success: false, message: `Error interno: ${errorMessage}` }, { status: 500 });
  }
}
