// src/app/(app)/roadmap/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useTitle } from '@/contexts/title-context';
import { RoadmapView } from '@/components/roadmap-view';

export default function RoadmapPage() {
  const { setPageTitle } = useTitle();

  useEffect(() => {
    setPageTitle('Ruta del Proyecto');
  }, [setPageTitle]);

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-headline tracking-tight">La Evolución de NexusAlpri</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                Un vistazo a nuestro viaje, desde la primera línea de código hasta las últimas funcionalidades. Esta es la historia de cómo construimos juntos el futuro del aprendizaje.
            </p>
        </div>
        <RoadmapView />
    </div>
  );
}
