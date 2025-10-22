// src/app/(public)/sign-in/page.tsx
'use client';
import React, { Suspense } from 'react';
import AuthForm from '@/components/auth/auth-form';
import { Loader2 } from 'lucide-react';

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AuthForm defaultView="signIn" />
    </Suspense>
  );
}
