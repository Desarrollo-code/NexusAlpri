// src/app/api/upload/resource-file/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: 'No se ha subido ningún archivo.' }, { status: 400 });
  }

  try {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/\s/g, '_')}`;
    
    const { data: uploadData, error } = await supabase.storage
      .from('resource_library')
      .upload(filename, file);

    if (error) {
      throw new Error(error.message);
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('resource_library')
      .getPublicUrl(uploadData.path);
      
    return NextResponse.json({ success: true, url: publicUrlData.publicUrl });

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido.';
    console.error('Error al procesar la subida de archivo de recurso:', e);
    return NextResponse.json({ success: false, message: `Error interno al guardar el archivo: ${errorMessage}` }, { status: 500 });
  }
}
