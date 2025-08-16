// This API route is deprecated and no longer used.
// File uploads are now handled directly on the client-side via Firebase Storage.
// This file will be deleted.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { message: 'This endpoint is deprecated and not in use.' },
    { status: 410 }
  );
}
