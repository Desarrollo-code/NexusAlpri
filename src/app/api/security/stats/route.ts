// src/app/api/security/stats/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    return NextResponse.json({ message: 'Este endpoint ya no está en uso. Usa /api/security/logs que ahora incluye las estadísticas.' }, { status: 410 });
}
