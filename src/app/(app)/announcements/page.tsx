// src/app/(app)/announcements/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Esta página ahora es un redirect hacia la nueva página de mensajería unificada.
export default function AnnouncementsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/messages');
  }, [router]);

  // Muestra un loader mientras se redirige para evitar un parpadeo de página vacía.
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin h-8 w-8 text-primary" />
    </div>
  );
}
