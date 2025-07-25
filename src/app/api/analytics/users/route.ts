
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ message: "This endpoint is deprecated. Please use /api/dashboard/admin-stats." }, { status: 410 });
}
