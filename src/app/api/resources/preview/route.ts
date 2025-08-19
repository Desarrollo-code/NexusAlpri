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
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`No se pudo obtener el archivo desde ${fileUrl}`);
        }
        const arrayBuffer = await response.arrayBuffer();

        if (fileUrl.endsWith('.docx')) {
            const { value } = await mammoth.convertToHtml({ arrayBuffer });
            return NextResponse.json({ html: value });
        }
        
        // Aquí se podrían añadir más manejadores para .xlsx, etc.

        return NextResponse.json({ message: 'Tipo de archivo no soportado para previsualización' }, { status: 415 });

    } catch (error) {
        console.error("Error en la previsualización del archivo:", error);
        return NextResponse.json({ message: 'Error al procesar el archivo para previsualización' }, { status: 500 });
    }
}
