// src/app/(app)/settings/page.tsx
'use client';

import SettingsPageComponent from '@/components/settings-page';
import { useAuth } from '@/contexts/auth-context';
import { useTitle } from '@/contexts/title-context';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { setPageTitle } = useTitle();
  
  useEffect(() => {
    setPageTitle('Configuración');
  }, [setPageTitle]);

  if (!user || user.role !== 'ADMINISTRATOR') {
    if (typeof window !== 'undefined') {
        router.push('/dashboard');
    }
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>;
  }

  return <SettingsPageComponent />;
}
