// src/components/quizz-it/templates/fill-blanks-template.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FillBlanksTemplateProps {
    question: any;
    onAnswer: (isCorrect: boolean, answerData: any) => void;
}

export function FillBlanksTemplate({ question, onAnswer }: FillBlanksTemplateProps) {
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    // Parse the question text to find blanks: [[answer]]
    const parts = question.text.split(/(\[\[.*?\]\])/g);
    const blanks = parts.filter(p => p.startsWith('[[') && p.endsWith(']]')).map(b => b.slice(2, -2));

    const handleInputChange = (index: number, value: string) => {
        setUserAnswers(prev => ({ ...prev, [index]: value }));
    };

    const checkAnswer = () => {
        const results = blanks.map((correctVal, index) => {
            const userVal = (userAnswers[index] || '').trim().toLowerCase();
            return userVal === correctVal.trim().toLowerCase();
        });

        const allCorrect = results.every(r => r);
        setIsAnswered(true);
        setIsCorrect(allCorrect);
        onAnswer(allCorrect, { method: 'fill_blanks', userAnswers });
    };

    let blankCounter = 0;

    return (
        <div className="w-full flex flex-col gap-8 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold font-headline">Completa los espacios en blanco</h2>
                <p className="text-muted-foreground italic">Escribe la palabra correcta en cada espacio.</p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border shadow-xl leading-relaxed text-xl">
                {parts.map((part, i) => {
                    if (part.startsWith('[[') && part.endsWith(']]')) {
                        const currentIndex = blankCounter++;
                        return (
                            <span key={i} className="inline-block mx-1 align-middle">
                                <Input
                                    value={userAnswers[currentIndex] || ''}
                                    onChange={(e) => handleInputChange(currentIndex, e.target.value)}
                                    disabled={isAnswered}
                                    className={cn(
                                        "w-32 h-10 text-center font-bold text-lg rounded-lg border-2 transition-all",
                                        isAnswered ? (
                                            (userAnswers[currentIndex] || '').trim().toLowerCase() === part.slice(2, -2).trim().toLowerCase()
                                                ? "border-green-500 bg-green-500/10 text-green-500"
                                                : "border-destructive bg-destructive/10 text-destructive"
                                        ) : "border-primary/30 focus:border-primary bg-background"
                                    )}
                                    placeholder="..."
                                />
                            </span>
                        );
                    }
                    return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
                })}
            </div>

            {!isAnswered && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center mt-4"
                >
                    <Button onClick={checkAnswer} size="lg" className="px-12 rounded-full font-bold shadow-xl hover:scale-105 transition-transform bg-primary hover:bg-primary/90 text-white">
                        Comprobar
                    </Button>
                </motion.div>
            )}

            <AnimatePresence>
                {isAnswered && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 font-bold",
                            isCorrect ? "bg-green-500/10 border-green-500 text-green-500" : "bg-destructive/10 border-destructive text-destructive"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            {isCorrect ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
                            <span className="text-xl">{isCorrect ? "¡Excelente trabajo!" : "Casi lo logras."}</span>
                        </div>
                        {!isCorrect && (
                            <p className="text-sm opacity-80 font-normal">Revisa las respuestas en rojo y vuelve a intentarlo.</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
