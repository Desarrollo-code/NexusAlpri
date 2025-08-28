
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

const getElementAndRect = (selector: string): { element: HTMLElement | null, rect: DOMRect | null } => {
  try {
    const element = document.querySelector(selector) as HTMLElement;
    return { element, rect: element ? element.getBoundingClientRect() : null };
  } catch(e) {
    console.error("Error finding tour target:", e);
    return { element: null, rect: null };
  }
};

export function TourGuide({ steps, currentStepIndex, onNext, onStop }: TourGuideProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step = steps[currentStepIndex];
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (step) {
      const { element, rect } = getElementAndRect(step.target);
      
      if (element && rect) {
        // Scroll the element into view smoothly
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        
        // Give a moment for the scroll to complete before positioning
        const scrollTimeout = setTimeout(() => {
            // Re-calculate rect after scroll
            const finalRect = element.getBoundingClientRect();
            setTargetRect(finalRect);
        }, 300); // 300ms delay to allow for smooth scroll

        return () => clearTimeout(scrollTimeout);
      } else {
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

        if (top + popoverHeight > window.innerHeight) {
            top = targetRect.top - popoverHeight - spacing;
        }

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
            <div 
                className="absolute transition-all duration-300 ease-in-out"
                style={{
                    top: targetRect.top,
                    left: targetRect.left,
                    width: targetRect.width,
                    height: targetRect.height,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
                    borderRadius: '8px',
                    pointerEvents: 'auto',
                }}
                onClick={onStop}
            />

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
