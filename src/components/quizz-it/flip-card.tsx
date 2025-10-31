// src/components/quizz-it/flip-card.tsx
'use client';
import { motion, AnimatePresence } from 'framer-motion';

export const FlipCard = ({ children, isFlipped }: { children: React.ReactNode[], isFlipped: boolean }) => {
  const [front, back] = children;

  return (
    <div className="relative w-full h-full" style={{ perspective: 1000 }}>
      <AnimatePresence initial={false}>
        <motion.div
          key={isFlipped ? 'back' : 'front'}
          initial={{ rotateY: 180 }}
          animate={{ rotateY: 0 }}
          exit={{ rotateY: -180 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
          }}
        >
          {isFlipped ? back : front}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
