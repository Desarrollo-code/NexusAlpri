
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Add a class to body for auth-specific background
    document.body.classList.add('auth-body');
    
    if (!isLoading) {
      if (user) {
        document.body.classList.remove('auth-body');
        router.replace('/dashboard');
      } else {
        router.replace('/sign-in');
      }
    }

    // Cleanup function to remove the class when the component unmounts
    // or when navigating away from the auth pages.
    return () => {
        // We don't remove it here because the auth layout will be unmounted
        // and the main app layout doesn't have this class.
    };
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return null;
}
