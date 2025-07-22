'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  // The middleware is responsible for redirection. This component
  // just shows a loading state while the redirection happens server-side.
  // We add a fallback client-side redirect in case the middleware fails or for edge cases.
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/dashboard');
    }, 500); // Redirect after a short delay

    return () => clearTimeout(timer);
  }, [router]);


  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
