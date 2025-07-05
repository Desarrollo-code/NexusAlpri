
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const data = await req.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ message: 'No se recibió ningún archivo' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ message: 'El archivo debe ser una imagen' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    return NextResponse.json({ message: 'El archivo no debe exceder los 10MB' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const dir = join(process.cwd(), 'public', 'uploads', 'images');
  // Ensure directory exists
  await mkdir(dir, { recursive: true });
  
  const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
  const path = join(dir, filename);

  try {
    await writeFile(path, buffer);
    const url = `/uploads/images/${filename}`;
    return NextResponse.json({ message: 'Imagen del curso subida exitosamente', url });
  } catch (error) {
    console.error('Error al guardar el archivo:', error);
    return NextResponse.json({ message: 'Error interno del servidor al subir el archivo' }, { status: 500 });
  }
}
