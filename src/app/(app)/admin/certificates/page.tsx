// src/app/(app)/admin/certificates/page.tsx
'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTitle } from '@/contexts/title-context';
import { useRouter } from 'next/navigation';
import { CertificateTemplateManager } from '@/components/certificates/certificate-template-manager';
import { useTour } from '@/contexts/tour-context';
import { certificatesTour } from '@/lib/tour-steps';
import { ColorfulLoader } from '@/components/ui/colorful-loader';
import { Skeleton } from '@/components/ui/skeleton';

const CertificatesSkeleton = () => (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
                <Skeleton className="h-8 w-72" />
                <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            ))}
        </div>
    </div>
);


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
    return <CertificatesSkeleton />;
  }

  if (!user || user.role !== 'ADMINISTRATOR') {
    router.push('/dashboard');
    return null;
  }
  
  return <CertificateTemplateManager />;
}
