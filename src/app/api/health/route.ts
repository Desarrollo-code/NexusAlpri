import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // No conectar o desconectar manualmente. Prisma lo maneja.
    await prisma.user.count(); // A simple query to check connection
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString(), db: 'connected' });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ status: 'error', timestamp: new Date().toISOString(), db: 'disconnected', error: (error as Error).message }, { status: 500 });
  }
}
