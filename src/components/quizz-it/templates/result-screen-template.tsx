// src/components/quizz-it/templates/result-screen-template.tsx
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Repeat } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Confetti } from '@/components/ui/confetti';

interface ResultScreenTemplateProps {
  score: number;
  totalQuestions: number;
  formTitle: string;
  onRestart: () => void;
}

export function ResultScreenTemplate({ score, totalQuestions, formTitle, onRestart }: ResultScreenTemplateProps) {
  const router = useRouter();
  const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
  const isWinner = percentage >= 70;

  return (
    <Card className="w-full max-w-2xl mx-auto text-center p-8 overflow-hidden">
      {isWinner && <Confetti />}
      <CardHeader>
        <Award className="mx-auto h-16 w-16 text-amber-400" />
        <CardTitle className="text-4xl font-extrabold font-headline mt-4">
            {isWinner ? "¡Felicidades!" : "¡Buen Intento!"}
        </CardTitle>
        <CardDescription className="text-lg">
            Has completado el quiz "{formTitle}".
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-base text-muted-foreground">Tu puntuación final es:</p>
        <div className="flex items-baseline justify-center gap-2">
            <span className="text-7xl font-bold text-primary">{score}</span>
            <span className="text-3xl font-semibold text-muted-foreground">/ {totalQuestions}</span>
        </div>
         <p className="text-2xl font-semibold text-primary">({percentage.toFixed(0)}%)</p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={onRestart} variant="outline">
            <Repeat className="mr-2 h-4 w-4"/>
            Volver a Jugar
        </Button>
         <Button onClick={() => router.push('/dashboard')}>
            Volver al Panel Principal
        </Button>
      </CardFooter>
    </Card>
  );
}
