// src/app/(app)/admin/certificates/page.tsx
'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTitle } from '@/contexts/title-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { CertificateTemplateManager } from '@/components/certificates/certificate-template-manager';
import { useTour } from '@/contexts/tour-context';
import { certificatesTour } from '@/lib/tour-steps';

export default function CertificatesAdminPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { setPageTitle } = useTitle();
  const router = useRouter();
  const { startTour } = useTour();

  React.useEffect(() => {
    setPageTitle('Plantillas de Certificados');
    startTour('certificates', certificatesTour);
  }, [setPageTitle, startTour]);

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMINISTRATOR') {
    router.push('/dashboard');
    return null;
  }
  
  return <CertificateTemplateManager />;
}

    