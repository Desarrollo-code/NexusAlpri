// src/app/(app)/forms/[formId]/edit/page.tsx
import { FormEditor } from '@/components/forms/form-editor';
import React from 'react';

// Esta página ahora es un Server Component, lo que es más robusto.
// Los parámetros se reciben directamente como props.
export default function EditFormPage({ params }: { params: { formId: string } }) {
  const { formId } = params;

  // Pasamos el formId como una prop normal al editor.
  return <FormEditor formId={formId} />;
}
