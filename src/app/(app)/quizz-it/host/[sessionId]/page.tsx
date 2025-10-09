// src/app/(app)/quizz-it/host/[sessionId]/page.tsx
import { HostScreen } from '@/components/quizz-it/host-screen';

export default function HostPage({ params }: { params: { sessionId: string } }) {
  return <HostScreen sessionId={params.sessionId} />;
}
