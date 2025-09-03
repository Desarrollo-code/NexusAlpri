
import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: 'No se ha subido ningún archivo.' }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Define la ruta de guardado
    const relativeUploadDir = '/uploads/lessons';
    const uploadDir = join(process.cwd(), 'public', relativeUploadDir);

    // Asegurarse de que el directorio exista
    await mkdir(uploadDir, { recursive: true });

    // Genera un nombre de archivo único para evitar colisiones
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/\s/g, '_')}`;
    const filePath = join(uploadDir, filename);
    
    await writeFile(filePath, buffer);
    
    const fileUrl = `${relativeUploadDir}/${filename}`;
    return NextResponse.json({ success: true, url: fileUrl });

  } catch (e) {
    console.error('Error al procesar la subida de archivo de lección:', e);
    return NextResponse.json({ success: false, message: 'Error interno al guardar el archivo.' }, { status: 500 });
  }
}
