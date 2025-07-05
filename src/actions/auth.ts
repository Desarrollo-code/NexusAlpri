// @ts-nocheck
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const role = formData.get('role') as string || 'student';

  // In a real application, you would validate credentials here
  
  cookies().set({
    name: 'user_role',
    value: role,
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 // 1 day
  });
  
  redirect('/dashboard');
}

export async function logout() {
  cookies().set('user_role', '', { expires: new Date(0) });
  redirect('/');
}
