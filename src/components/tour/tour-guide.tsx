
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

  const updatePosition = useCallback(() => {
    if (!step) return;

    const { element, rect } = getElementAndRect(step.target);
    
    if (element && rect) {
        const isElementVisible = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );

        if (!isElementVisible) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            setTimeout(() => {
                const newRect = element.getBoundingClientRect();
                setTargetRect(newRect);
            }, 300);
        } else {
            setTargetRect(rect);
        }
    } else {
      onNext();
    }
  }, [step, onNext]);
  
  useEffect(() => {
    const timeoutId = setTimeout(updatePosition, 100);
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
    };
  }, [currentStepIndex, updatePosition]);

  useEffect(() => {
    if (targetRect && popoverRef.current) {
        const popoverHeight = popoverRef.current.offsetHeight;
        const popoverWidth = popoverRef.current.offsetWidth;
        const spacing = 16;
        
        let top, left;
        let finalPosition: TourStep['placement'] = step.placement || 'bottom';

        const placements = {
            bottom: { top: targetRect.bottom + spacing, left: targetRect.left + targetRect.width / 2 - popoverWidth / 2 },
            top: { top: targetRect.top - popoverHeight - spacing, left: targetRect.left + targetRect.width / 2 - popoverWidth / 2 },
            left: { top: targetRect.top + targetRect.height / 2 - popoverHeight / 2, left: targetRect.left - popoverWidth - spacing },
            right: { top: targetRect.top + targetRect.height / 2 - popoverHeight / 2, left: targetRect.right + spacing },
        };
        
        if (!step.placement) {
            if (placements.bottom.top + popoverHeight < window.innerHeight) finalPosition = 'bottom';
            else if (placements.top.top > 0) finalPosition = 'top';
            else if (placements.right.left + popoverWidth < window.innerWidth) finalPosition = 'right';
            else if (placements.left.left > 0) finalPosition = 'left';
        }
        
        top = placements[finalPosition].top;
        left = placements[finalPosition].left;
        
        if (left < spacing) left = spacing;
        if (left + popoverWidth > window.innerWidth - spacing) left = window.innerWidth - popoverWidth - spacing;
        if (top < spacing) top = spacing;
        if (top + popoverHeight > window.innerHeight - spacing) top = window.innerHeight - popoverHeight - spacing;
        
        setPopoverPosition({ top, left });
    }
  }, [targetRect, step.placement]);


  if (!step || !targetRect) {
    return null;
  }
  
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <AnimatePresence>
        <motion.div
            key={`tour-overlay-${currentStepIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            style={{
                 boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.7)`,
            }}
        />
        
        <motion.div
            key={`tour-highlight-${currentStepIndex}`}
             className="fixed pointer-events-none z-[9998]"
             style={{
                 top: targetRect.top - 8,
                 left: targetRect.left - 8,
                 width: targetRect.width + 16,
                 height: targetRect.height + 16,
                 boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.7)`,
                 borderRadius: '8px',
                 transition: 'all 0.3s ease-in-out',
             }}
        />

        <motion.div
            ref={popoverRef}
            key={`tour-popover-${currentStepIndex}`}
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
