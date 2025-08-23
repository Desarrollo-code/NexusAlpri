// src/app/(app)/forms/[formId]/edit/page.tsx
'use client';
import { FormEditor } from '@/components/forms/form-editor';
import React from 'react';

// Este es un Server Component. Los parámetros se acceden directamente.
export default function EditFormPage({ params }: { params: Promise<{ formId: string }> }) {
  // Se utiliza React.use() para acceder a los parámetros de forma síncrona en un Client Component
  const { formId } = React.use(params);

  // El FormEditor es un Client Component que manejará toda la lógica.
  return <FormEditor formId={formId} />;
}
