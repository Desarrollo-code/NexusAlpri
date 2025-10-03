// src/app/(app)/admin/certificates/page.tsx
'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTitle } from '@/contexts/title-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { CertificateTemplateManager } from '@/components/certificates/certificate-template-manager';

export default function CertificatesAdminPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { setPageTitle } = useTitle();
  const router = useRouter();

  React.useEffect(() => {
    setPageTitle('Plantillas de Certificados');
  }, [setPageTitle]);

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
