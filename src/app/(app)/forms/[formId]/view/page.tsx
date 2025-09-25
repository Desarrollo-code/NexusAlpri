// src/app/forms/[formId]/view/page.tsx
import { FormViewer } from '@/components/forms/form-viewer';
import React from 'react';

// Convertir a Server Component para manejar correctamente los parámetros.
export default async function ViewFormPage({ params }: { params: Promise<{ formId: string }> }) {
  // Esperar a que la promesa de los parámetros se resuelva.
  const { formId } = await params;

  // Pasar el formId resuelto como una prop normal al componente de cliente.
  return <FormViewer formId={formId} />;
}
