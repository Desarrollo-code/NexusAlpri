// src/app/api/resources/preview/route.ts

// This file is now obsolete as the PDF viewer loads the URL directly.
// It can be deleted in a future refactor.
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json(
        { message: 'This endpoint is no longer in use.' },
        { status: 410 } // 410 Gone
    );
}
