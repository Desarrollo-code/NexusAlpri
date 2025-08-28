// src/components/tour/tour-guide.tsx
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, X } from 'lucide-react';
import type { TourStep } from '@/lib/tour-steps';

interface TourGuideProps {
  steps: TourStep[];
  currentStepIndex: number;
  onNext: () => void;
  onStop: () => void;
}

const getElementRect = (selector: string): DOMRect | null => {
  try {
    const element = document.querySelector(selector);
    return element ? element.getBoundingClientRect() : null;
  } catch(e) {
    console.error("Error finding tour target:", e);
    return null;
  }
};

export function TourGuide({ steps, currentStepIndex, onNext, onStop }: TourGuideProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step = steps[currentStepIndex];
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (step) {
      const rect = getElementRect(step.target);
      setTargetRect(rect);

       if (!rect) {
          console.warn(`Tour target "${step.target}" not found. Skipping step.`);
          onNext(); // Skip to the next step if the target isn't found
      }
    }
  }, [step, onNext]);

  useEffect(() => {
    if (targetRect && popoverRef.current) {
        const popoverHeight = popoverRef.current.offsetHeight;
        const popoverWidth = popoverRef.current.offsetWidth;
        const spacing = 16;
        let top = targetRect.bottom + spacing;
        let left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;

        // Si se sale por abajo, ponerlo arriba
        if (top + popoverHeight > window.innerHeight) {
            top = targetRect.top - popoverHeight - spacing;
        }

        // Ajustar horizontalmente si se sale de la pantalla
        if (left < spacing) {
            left = spacing;
        }
        if (left + popoverWidth > window.innerWidth - spacing) {
            left = window.innerWidth - popoverWidth - spacing;
        }
        
        setPopoverPosition({ top, left });
    }
  }, [targetRect, popoverRef.current]);

  if (!step || !targetRect) {
    return null;
  }
  
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <AnimatePresence>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none"
        >
            {/* SVG Overlay para crear el "agujero" */}
             <svg className="absolute inset-0 w-full h-full">
                <defs>
                    <mask id="tour-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <rect
                            x={targetRect.left}
                            y={targetRect.top}
                            width={targetRect.width}
                            height={targetRect.height}
                            rx="8"
                            fill="black"
                            className="transition-all duration-300 ease-in-out"
                        />
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.7)"
                    mask="url(#tour-mask)"
                    className="pointer-events-auto"
                    onClick={onStop}
                />
            </svg>

            {/* Popover con la explicación */}
            <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute pointer-events-auto"
                style={{ top: popoverPosition.top, left: popoverPosition.left }}
            >
                <Card className="w-80 shadow-2xl">
                    <CardHeader>
                        <CardTitle>{step.content.title}</CardTitle>
                        <CardDescription>{step.content.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between">
                         <Button variant="ghost" onClick={onStop}>Omitir</Button>
                         <Button onClick={onNext}>
                            {isLastStep ? 'Finalizar' : 'Siguiente'}
                            {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
                         </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </motion.div>
    </AnimatePresence>
  );
}