// src/app/forms/[formId]/view/page.tsx
'use client';
import { FormViewer } from '@/components/forms/form-viewer';
import React from 'react';

export default function ViewFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = React.use(params);

  return <FormViewer formId={formId} />;
}
