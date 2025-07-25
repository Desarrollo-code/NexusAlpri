
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const data = await req.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ message: 'No se recibió ningún archivo' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const dir = join(process.cwd(), 'public', 'uploads', 'lessons');
  await mkdir(dir, { recursive: true });
  
  const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
  const path = join(dir, filename);

  try {
    await writeFile(path, buffer);
    const url = `/uploads/lessons/${filename}`;
    return NextResponse.json({ message: 'Archivo de lección subido exitosamente', url });
  } catch (error) {
    console.error('Error al guardar el archivo:', error);
    return NextResponse.json({ message: 'Error interno del servidor al subir el archivo' }, { status: 500 });
  }
}
