// src/components/tour/tour-guide.tsx
'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, X } from 'lucide-react';
import type { TourStep } from '@/lib/tour-steps';
import { useAuth } from '@/contexts/auth-context';
import Image from 'next/image';

const getElementAndRect = (selector: string): { element: HTMLElement | null, rect: DOMRect | null } => {
  try {
    const element = document.querySelector(selector) as HTMLElement;
    return { element, rect: element ? element.getBoundingClientRect() : null };
  } catch (e) {
    console.error("Error finding tour target:", e);
    return { element: null, rect: null };
  }
};

export function TourGuide({ steps, currentStepIndex, onNext, onStop }: {
  steps: TourStep[];
  currentStepIndex: number;
  onNext: () => void;
  onStop: () => void;
}) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const { settings } = useAuth();

  const step = steps[currentStepIndex];

  const updatePosition = useCallback(() => {
    if (!step) return;
    try {
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
          // Wait for scroll to finish before updating rect
          setTimeout(() => {
            if (element) {
              const newRect = element.getBoundingClientRect();
              setTargetRect(newRect);
            }
          }, 300);
        } else {
          setTargetRect(rect);
        }
      } else {
        // If element explicitly doesn't exist, we might want to wait a bit/retry or skip
        // For now, let's just log and maybe skip to next to avoid stuck state
        console.warn(`Tour step target "${step.target}" not found or invisible.`);
        // Optionally auto-advance if it really can't be found after some time?
        // onNext(); 
      }
    } catch (e) {
      console.error("Error updating tour position", e);
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

      let top = 0, left = 0; // Initialize with safe defaults

      const placements = {
        bottom: {
          top: targetRect.bottom + spacing,
          left: targetRect.left + targetRect.width / 2 - popoverWidth / 2
        },
        top: {
          top: targetRect.top - popoverHeight - spacing,
          left: targetRect.left + targetRect.width / 2 - popoverWidth / 2
        },
        left: {
          top: targetRect.top + targetRect.height / 2 - popoverHeight / 2,
          left: targetRect.left - popoverWidth - spacing
        },
        right: {
          top: targetRect.top + targetRect.height / 2 - popoverHeight / 2,
          left: targetRect.right + spacing
        },
      };

      // Ensure step and placement exist before accessing
      let finalPosition: TourStep['placement'] = step?.placement || 'bottom';

      // Fallback calculation logic
      if (!step?.placement) {
        const canPlaceBottom = (placements.bottom?.top || 0) + popoverHeight < window.innerHeight;
        const canPlaceTop = (placements.top?.top || 0) > 0;
        const canPlaceRight = (placements.right?.left || 0) + popoverWidth < window.innerWidth;
        const canPlaceLeft = (placements.left?.left || 0) > 0;

        if (canPlaceBottom) finalPosition = 'bottom';
        else if (canPlaceTop) finalPosition = 'top';
        else if (canPlaceRight) finalPosition = 'right';
        else if (canPlaceLeft) finalPosition = 'left';
      }

      // Final safety check for placement validity
      if (placements[finalPosition]) {
        top = placements[finalPosition].top;
        left = placements[finalPosition].left;
      }

      if (left < spacing) left = spacing;
      if (left + popoverWidth > window.innerWidth - spacing) left = window.innerWidth - popoverWidth - spacing;
      if (top < spacing) top = spacing;
      if (top + popoverHeight > window.innerHeight - spacing) top = window.innerHeight - popoverHeight - spacing;

      setPopoverPosition({ top, left });
    }
  }, [targetRect, step?.placement]);


  if (!step || !targetRect) {
    return null;
  }

  const isLastStep = currentStepIndex === steps.length - 1;

  // Safe access for clipPath values
  const safeLeft = targetRect.left || 0;
  const safeTop = targetRect.top || 0;
  const safeRight = targetRect.right || 0;
  const safeBottom = targetRect.bottom || 0;

  const clipPathValue = `path(evenodd, 'M0 0 H ${window.innerWidth} V ${window.innerHeight} H 0 Z M ${safeLeft - 8} ${safeTop - 8} H ${safeRight + 8} V ${safeBottom + 8} H ${safeLeft - 8} Z')`;

  return (
    <AnimatePresence>
      <motion.div
        key={`tour-overlay-${currentStepIndex}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] bg-black/70"
        style={{
          clipPath: clipPathValue,
          transition: 'clip-path 0.3s ease-in-out',
        }}
      />

      <div
        ref={popoverRef}
        className="fixed pointer-events-auto z-[9999]"
        style={{ top: popoverPosition.top, left: popoverPosition.left }}
      >
        <motion.div
          className="flex items-start gap-0"
          key={`tour-popover-${currentStepIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {settings?.tourMascotUrl && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 400, damping: 15 }}
              className="relative -mr-5 mt-4 z-10"
            >
              <div className="w-20 h-20 rounded-full bg-card border-4 border-primary shadow-lg overflow-hidden">
                <Image src={settings.tourMascotUrl} alt="Mascota del Tour" width={80} height={80} className="object-cover" />
              </div>
            </motion.div>
          )}
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
      </div>
    </AnimatePresence>
  );
}
