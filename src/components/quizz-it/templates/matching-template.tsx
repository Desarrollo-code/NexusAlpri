// src/components/quizz-it/templates/matching-template.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchingTemplateProps {
    question: any;
    onAnswer: (isCorrect: boolean, answerData: any) => void;
}

const SortableItem = ({ id, text, isAnswered, isCorrect }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} className="touch-none">
            <Card className={cn(
                "p-4 flex items-center justify-between gap-4 transition-all duration-300",
                isDragging ? "opacity-50 scale-105 shadow-2xl" : "opacity-100",
                isAnswered && isCorrect && "border-green-500 bg-green-500/10",
                isAnswered && !isCorrect && "border-destructive bg-destructive/10"
            )}>
                <div className="flex items-center gap-3 flex-grow">
                    <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-medium prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: text }} />
                </div>
            </Card>
        </div>
    );
};

export function MatchingTemplate({ question, onAnswer }: MatchingTemplateProps) {
    const [items, setItems] = useState<any[]>([]);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [activeId, setActiveId] = useState<any>(null);

    useEffect(() => {
        // We assume options are pairs: Option 1 corresponds to Target 1, etc.
        // In a real scenario, we might have question.pairs or similar.
        // For now, let's use the first 2 options as keys and the last 2 as values, or similar logic.
        // Let's assume question.options contains the "answers" in order.
        // We will shuffle them for the user to match.
        const shuffled = [...question.options].sort(() => Math.random() - 0.5);
        setItems(shuffled);
    }, [question]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveId(null);

        if (active.id !== over?.id) {
            setItems((prev) => {
                const oldIndex = prev.findIndex((item) => item.id === active.id);
                const newIndex = prev.findIndex((item) => item.id === over.id);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    };

    const checkAnswer = () => {
        // Correct order is original question.options
        const isMatched = items.every((item, index) => item.id === question.options[index].id);
        setIsAnswered(true);
        setIsCorrect(isMatched);
        onAnswer(isMatched, { method: 'matching', items });
    };

    const activeItem = items.find(i => i.id === activeId);

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold font-headline" dangerouslySetInnerHTML={{ __html: question.text }} />
                <p className="text-muted-foreground italic">Ordena los elementos para que coincidan con la lógica correcta.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 max-w-xl mx-auto w-full">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                            {items.map((item) => (
                                <SortableItem
                                    key={item.id}
                                    id={item.id}
                                    text={item.text}
                                    isAnswered={isAnswered}
                                    isCorrect={isCorrect}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    <DragOverlay>
                        {activeId ? (
                            <Card className="p-4 flex items-center gap-4 shadow-2xl border-primary bg-primary/5 scale-105">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <div className="text-sm font-medium prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: activeItem?.text }} />
                            </Card>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {!isAnswered && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center mt-4"
                >
                    <Button onClick={checkAnswer} size="lg" className="px-12 rounded-full font-bold shadow-xl hover:scale-105 transition-transform bg-primary hover:bg-primary/90">
                        Comprobar Respuesta
                    </Button>
                </motion.div>
            )}

            <AnimatePresence>
                {isAnswered && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "flex items-center justify-center gap-3 p-4 rounded-2xl border-2 font-bold",
                            isCorrect ? "bg-green-500/10 border-green-500 text-green-500" : "bg-destructive/10 border-destructive text-destructive"
                        )}
                    >
                        {isCorrect ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
                        {isCorrect ? "¡Perfecto! El orden es correcto." : "Vaya, parece que hay algo mal."}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
