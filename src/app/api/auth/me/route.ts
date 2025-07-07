
import { getSession } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const user = await getSession(request);

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
