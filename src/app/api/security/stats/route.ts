// src/app/api/security/stats/route.ts
// Este endpoint ya no es necesario para la versión básica de la página de auditoría.
// Se puede eliminar en un futuro refactor.
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ message: "Este endpoint ha sido desactivado temporalmente." }, { status: 410 });
}
