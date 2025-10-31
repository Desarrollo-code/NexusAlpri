// src/components/quizz-it/templates/flip-card-template.tsx
'use client';
import React, { useState } from 'react';
import type { AppQuestion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FlipCard } from '../flip-card';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FlipCardTemplateProps {
  question: AppQuestion;
  onAnswer: (isCorrect: boolean, answerData: any) => void;
}

export function FlipCardTemplate({ question, onAnswer }: FlipCardTemplateProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const correctOption = question.options.find(opt => opt.isCorrect);

  const handleFlip = () => {
    if (!isFlipped && !isAnswered) {
      setIsFlipped(true);
    }
  };
  
  const handleSelfAssessment = (knewIt: boolean) => {
    if (isAnswered) return;
    setIsAnswered(true);
    onAnswer(knewIt, { selfAssessed: true });
  }

  return (
    <div className="w-full flex flex-col items-center gap-6">
        <div className="w-full h-80 max-w-xl">
             <FlipCard isFlipped={isFlipped}>
                 {/* Front */}
                 <Card onClick={handleFlip} className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-card cursor-pointer">
                    <h2 className="text-2xl md:text-3xl font-bold font-headline">{question.text}</h2>
                    {!isAnswered && <p className="mt-4 text-muted-foreground">Haz clic para ver la respuesta</p>}
                 </Card>
                 {/* Back */}
                 <Card className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-primary text-primary-foreground">
                    <h3 className="text-3xl font-bold">{correctOption?.text}</h3>
                    {correctOption?.feedback && <p className="mt-2 text-sm text-primary-foreground/80">{correctOption.feedback}</p>}
                 </Card>
            </FlipCard>
        </div>

        {isFlipped && !isAnswered && (
             <div className="flex flex-col items-center gap-4">
                 <p className="font-semibold">¿Sabías la respuesta?</p>
                <div className="flex gap-4">
                     <Button onClick={() => handleSelfAssessment(true)} size="lg" className="bg-green-500 hover:bg-green-600">
                        <ThumbsUp className="mr-2"/> Sí, la sabía
                    </Button>
                    <Button onClick={() => handleSelfAssessment(false)} size="lg" variant="destructive">
                        <ThumbsDown className="mr-2"/> No, no la sabía
                    </Button>
                </div>
            </div>
        )}
    </div>
  );
}
