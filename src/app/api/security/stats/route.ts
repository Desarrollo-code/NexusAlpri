// src/app/api/security/stats/route.ts
// This file is now obsolete as calculations are performed on the client-side
// in /app/(app)/security-audit/page.tsx. It can be deleted in a future refactor.
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json(
        { message: 'This endpoint is obsolete. Stats are now calculated on the client.' }, 
        { status: 410 } // 410 Gone
    );
}
