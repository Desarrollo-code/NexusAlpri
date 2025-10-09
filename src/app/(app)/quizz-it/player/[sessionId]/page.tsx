// src/app/(app)/quizz-it/player/[sessionId]/page.tsx
import { PlayerScreen } from "@/components/quizz-it/player-screen";

export default function PlayerPage({ params }: { params: { sessionId: string } }) {
  return <PlayerScreen sessionId={params.sessionId} />;
}
