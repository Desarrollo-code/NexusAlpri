// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma'; 

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }
    
    // Re-fetch user to get the latest data including `xp`
    // This is useful if XP or other details were updated in another request.
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    if (!fullUser) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    const { password, twoFactorSecret, ...safeUser } = fullUser;
    return NextResponse.json({ user: safeUser });

  } catch (error) {
    console.error("Failed to re-fetch user data in /me route:", error);
    return NextResponse.json({ message: "Error al obtener datos del usuario" }, { status: 500 });
  }
}
