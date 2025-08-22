// src/app/(app)/forms/[formId]/edit/page.tsx
import { FormEditor } from '@/components/forms/form-editor';

// This is a simple Server Component that only extracts the formId
// and passes it to the client component.
export default async function EditFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;

  // The FormEditor component will handle all data fetching, state management, and logic.
  return <FormEditor formId={formId} />;
}
