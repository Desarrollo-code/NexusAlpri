
// src/app/(public)/sign-in/[[...sign-in]]/page.tsx
'use client';

import AuthForm from '@/components/auth/auth-form-container';

export default function SignInPage() {
  return <AuthForm defaultView="signIn" />;
}
