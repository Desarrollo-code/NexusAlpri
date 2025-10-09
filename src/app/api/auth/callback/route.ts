// src/app/api/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { UserRole } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    // Usamos un cliente de Supabase simple solo para este intercambio.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error, data: { session } } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session) {
      const user = session.user;
      
      // Upsert (actualiza o crea) el usuario en nuestra propia base de datos.
      // Esto asegura que cada usuario de Google tenga una entrada en nuestra tabla `User`.
      const dbUser = await prisma.user.upsert({
        where: { email: user.email! },
        update: {
          name: user.user_metadata.full_name || user.email,
          avatar: user.user_metadata.avatar_url,
        },
        create: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata.full_name || user.email!,
          avatar: user.user_metadata.avatar_url,
          role: 'STUDENT' as UserRole, // Por defecto, los nuevos usuarios son estudiantes.
          registeredDate: new Date(),
          isActive: true,
          // No se establece una contraseña, ya que es un inicio de sesión social.
        }
      });
      
      // Creamos la sesión usando nuestro propio sistema JWT, que es el que usa el resto de la app.
      await createSession(dbUser.id);
      
      // Redirigimos al usuario al panel principal.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si algo falla, redirigimos a una página de error genérica.
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
