// src/hooks/use-animated-counter.ts
'use client';

import { useState, useEffect } from 'react';

/**
 * A custom hook that animates a number from a start to an end value.
 * @param end The target number to count up to.
 * @param start The number to start from (defaults to 0).
 * @param duration The duration of the animation in milliseconds.
 * @returns The current animated value as a formatted string.
 */
export const useAnimatedCounter = (end: number, start = 0, duration = 1500): string => {
  const [count, setCount] = useState(start);
  const endValue = end || 0;
  
  useEffect(() => {
    let startTime: number;
    let animationFrameId: number;

    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      
      const newCount = Math.min(endValue, start + (endValue - start) * (progress / duration));
      setCount(newCount);

      if (progress < duration) {
        animationFrameId = requestAnimationFrame(animateCount);
      }
    };
    
    animationFrameId = requestAnimationFrame(animateCount);

    return () => cancelAnimationFrame(animationFrameId);
  }, [endValue, start, duration]);

  // Use Math.round to avoid showing decimal places during animation
  return Math.round(count).toLocaleString();
};
