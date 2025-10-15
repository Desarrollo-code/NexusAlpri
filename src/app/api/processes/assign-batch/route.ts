// src/app/api/processes/assign-batch/route.ts
// Este archivo está obsoleto y será eliminado. La lógica se ha movido
// a /api/processes/assign/route.ts

import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json(
        { message: 'Este endpoint ha sido movido a /api/processes/assign' },
        { status: 410 } // 410 Gone
    );
}
