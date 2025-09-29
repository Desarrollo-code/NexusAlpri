
// src/app/api/resources/preview/route.ts
import { NextResponse, NextRequest } from 'next/server';
import mammoth from 'mammoth';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
        return NextResponse.json({ message: 'URL del archivo es requerida' }, { status: 400 });
    }

    try {
        const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : new URL(fileUrl, req.nextUrl.origin).href;
        
        const response = await fetch(absoluteUrl);
        if (!response.ok) {
            console.error(`Fetch failed for ${absoluteUrl} with status ${response.status}`);
            throw new Error(`No se pudo obtener el archivo. Estado: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();

        if (fileUrl.endsWith('.docx')) {
            const { value } = await mammoth.convertToHtml({ arrayBuffer });
            return NextResponse.json({ html: value });
        }
        
        return NextResponse.json({ message: 'Tipo de archivo no soportado para previsualización' }, { status: 415 });

    } catch (error) {
        console.error("Error en la previsualización del archivo:", error);
        return NextResponse.json({ message: `Error al procesar el archivo: ${(error as Error).message}` }, { status: 500 });
    }
}
