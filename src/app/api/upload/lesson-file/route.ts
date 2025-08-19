
import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: 'No file uploaded.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const relativeUploadDir = '/uploads/lessons';
  const uploadDir = join(process.cwd(), 'public', relativeUploadDir);

  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      console.error('Error creating directory:', error);
      return NextResponse.json({ success: false, message: 'Internal server error creating directory.' }, { status: 500 });
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
    console.error('Error writing file:', e);
    return NextResponse.json({ success: false, message: 'Error saving file.' }, { status: 500 });
  }
}
