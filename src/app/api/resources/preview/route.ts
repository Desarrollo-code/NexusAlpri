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
            return new NextResponse(`Error al obtener el archivo: ${response.statusText}`, { status: response.status });
        }
        
        const fileType = response.headers.get('content-type');
        const blob = await response.blob();
        
        // Creamos una nueva respuesta para transmitir el archivo al cliente
        // Esto maneja correctamente los PDFs y otros tipos de archivo que el navegador puede mostrar
        return new NextResponse(blob, {
            status: 200,
            headers: {
                'Content-Type': fileType || 'application/octet-stream',
            },
        });

    } catch (error) {
        console.error("Error en la previsualización del archivo:", error);
        return NextResponse.json({ message: `Error al procesar el archivo: ${(error as Error).message}` }, { status: 500 });
    }
}
