// src/app/forms/[formId]/view/page.tsx
'use client';
import { FormViewer } from '@/components/forms/form-viewer';
import React from 'react';

export default function ViewFormPage({ params }: { params: { formId: string } }) {
  const { formId } = params;

  return <FormViewer formId={formId} />;
}
