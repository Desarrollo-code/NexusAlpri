// src/components/tour/tour-guide.tsx
'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, X } from 'lucide-react';
import type { TourStep } from '@/lib/tour-steps';
import { cn } from '@/lib/utils';

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
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  
  const step = steps[currentStepIndex];

  const updatePositionAndScroll = useCallback(() => {
    if (!step) return;

    const { element, rect } = getElementAndRect(step.target);
    
    if (element && rect) {
      setTargetRect(rect);
      
      const isFullyVisible = (
        rect.top >= 80 && // Leave space for top bar
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );

      if (!isFullyVisible) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    } else {
      console.warn(`Tour target "${step.target}" not found. Skipping step.`);
      onNext();
    }
  }, [step, onNext]);
  
  useEffect(() => {
    const timeoutId = setTimeout(updatePositionAndScroll, 100);
    
    window.addEventListener('resize', updatePositionAndScroll);
    window.addEventListener('scroll', updatePositionAndScroll, true);

    return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', updatePositionAndScroll);
        window.removeEventListener('scroll', updatePositionAndScroll, true);
    };
  }, [currentStepIndex, updatePositionAndScroll, step]);

  useEffect(() => {
    if (targetRect && popoverRef.current) {
        const popoverHeight = popoverRef.current.offsetHeight;
        const popoverWidth = popoverRef.current.offsetWidth;
        const spacing = 16;
        
        let top, left;

        // Default position: below the target
        top = targetRect.bottom + spacing;
        left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;

        // If it overflows the bottom, place it on top
        if (top + popoverHeight > window.innerHeight - spacing) {
            top = targetRect.top - popoverHeight - spacing;
        }

        // Adjust horizontal position to stay within viewport
        if (left < spacing) left = spacing;
        if (left + popoverWidth > window.innerWidth - spacing) left = window.innerWidth - popoverWidth - spacing;
        
        setPopoverPosition({ top, left });
    }
  }, [targetRect]);


  if (!step || !targetRect) {
    return null;
  }
  
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <AnimatePresence>
        {/* The overlay with a hole cut out */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] pointer-events-auto"
            onClick={onStop}
            style={{
                 // This creates a large shadow that acts as an overlay, but leaves the highlight box transparent.
                 boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.7)`,
                 top: targetRect.top - 8,
                 left: targetRect.left - 8,
                 width: targetRect.width + 16,
                 height: targetRect.height + 16,
                 borderRadius: '8px',
                 transition: 'all 0.3s ease-in-out',
            }}
        />

        {/* The popover, positioned relative to the viewport */}
        <motion.div
            ref={popoverRef}
            key={currentStepIndex} // Re-animate on step change
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="fixed pointer-events-auto z-[9999]"
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
    </AnimatePresence>
  );
}
