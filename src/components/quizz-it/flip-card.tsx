// src/components/quizz-it/flip-card.tsx
'use client';
import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlipCardProps {
  isFlipped: boolean;
  children: [ReactNode, ReactNode]; // Expects two children: front and back
}

export const FlipCard = ({ isFlipped, children }: FlipCardProps) => {
  const [front, back] = children;
  
  return (
    <div className="w-full h-full perspective-1000">
      <AnimatePresence initial={false}>
        <motion.div
          key={isFlipped ? "back" : "front"}
          initial={{ rotateY: isFlipped ? -180 : 0 }}
          animate={{ rotateY: 0 }}
          exit={{ rotateY: 180 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="w-full h-full absolute"
          style={{ backfaceVisibility: "hidden" }}
        >
          {isFlipped ? back : front}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
