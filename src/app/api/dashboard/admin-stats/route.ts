// This file is now obsolete as its logic has been moved to /api/dashboard/data/route.ts
// It can be deleted. Keeping it empty to avoid build errors if something still references it.
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ message: "This endpoint is obsolete. Use /api/dashboard/data instead." }, { status: 410 });
}
