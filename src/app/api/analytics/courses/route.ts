// This file is no longer needed as its logic has been merged into /api/dashboard/admin-stats
// To be deleted or left empty. For this operation, we will leave it empty.
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ message: "This endpoint is deprecated. Please use /api/dashboard/admin-stats." }, { status: 410 });
}
