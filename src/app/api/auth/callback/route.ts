// src/app/api/auth/callback/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { createSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { UserRole } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );
    const { error, data: { session } } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session) {
      const user = session.user;
      
      // Upsert user in our local database
      const dbUser = await prisma.user.upsert({
        where: { email: user.email! },
        update: {
          name: user.user_metadata.full_name || user.email,
          avatar: user.user_metadata.avatar_url,
          // We don't update the role on subsequent logins to preserve admin/instructor roles
        },
        create: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata.full_name || user.email!,
          avatar: user.user_metadata.avatar_url,
          role: 'STUDENT' as UserRole, // Default role
          registeredDate: new Date(),
          isActive: true
        }
      });
      
      // Create a session using our custom JWT system
      await createSession(dbUser.id);
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
