
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const data = await req.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ message: 'No se recibió ningún archivo' }, { status: 400 });
  }

  // Basic validation
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ message: 'El archivo debe ser una imagen' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) { // 5MB
    return NextResponse.json({ message: 'El archivo no debe exceder los 5MB' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const dir = join(process.cwd(), 'public', 'uploads', 'avatars');
  const filename = `${session.id}-${Date.now()}-${file.name.replace(/\s/g, '_')}`;
  const path = join(dir, filename);

  try {
    await writeFile(path, buffer);
    const url = `/uploads/avatars/${filename}`;
    return NextResponse.json({ message: 'Avatar subido exitosamente', url });
  } catch (error) {
    console.error('Error al guardar el archivo:', error);
    return NextResponse.json({ message: 'Error interno del servidor al subir el archivo' }, { status: 500 });
  }
}
