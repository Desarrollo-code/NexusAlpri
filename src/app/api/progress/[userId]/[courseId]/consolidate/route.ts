// This file is no longer needed as progress is calculated incrementally.
// It is being removed to avoid confusion.
import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({ message: 'This endpoint is deprecated and no longer in use.' }, { status: 410 });
}
