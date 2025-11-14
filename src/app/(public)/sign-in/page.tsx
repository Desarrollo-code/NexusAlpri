// src/app/(public)/sign-in/page.tsx
'use client';
import React, { Suspense } from 'react';
import AuthForm from '@/components/auth/auth-form';
import { ColorfulLoader } from '@/components/ui/colorful-loader';

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-full"><ColorfulLoader /></div>}>
      <AuthForm defaultView="signIn" />
    </Suspense>
  );
}
