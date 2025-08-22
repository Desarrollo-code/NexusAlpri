// src/app/(app)/forms/[formId]/edit/page.tsx
import { FormEditor } from '@/components/forms/form-editor';
import React from 'react';

// Este es un Server Component. Los parámetros se acceden directamente.
export default function EditFormPage({ params }: { params: { formId: string } }) {
  const { formId } = params;

  // El FormEditor es un Client Component que manejará toda la lógica.
  return <FormEditor formId={formId} />;
}
