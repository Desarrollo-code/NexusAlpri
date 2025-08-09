// src/app/(auth)/sign-up/[[...sign-up]]/page.tsx
'use client';

import AuthForm from '@/components/auth/auth-form-container';

export default function SignUpPage() {
    return <AuthForm defaultView="signUp" />;
}
