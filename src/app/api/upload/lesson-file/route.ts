
import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: 'No se ha subido ningún archivo.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const relativeUploadDir = '/uploads/lessons';
  const uploadDir = join(process.cwd(), 'public', relativeUploadDir);

  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      console.error('Error al crear directorio:', error);
      return NextResponse.json({ success: false, message: 'Error interno del servidor al crear el directorio.' }, { status: 500 });
    }
  }

  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
  const filename = `${uniqueSuffix}-${file.name.replace(/\s/g, '_')}`;
  const filePath = join(uploadDir, filename);
  
  try {
    await writeFile(filePath, buffer);
    const fileUrl = `${relativeUploadDir}/${filename}`;
    return NextResponse.json({ success: true, url: fileUrl });
  } catch (e) {
    console.error('Error escribiendo el archivo:', e);
    return NextResponse.json({ success: false, message: 'Error al guardar el archivo.' }, { status: 500 });
  }
}
