
'use client';

import { useState, useEffect } from 'react';

/**
 * A custom hook that animates a number from 0 to a target value.
 * @param end The target number to count up to.
 * @param duration The duration of the animation in milliseconds.
 * @returns The current animated value as a formatted string.
 */
export const useAnimatedCounter = (end: number, duration = 1500): string => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const endValue = end || 0;
    // if start is equal to end, don't do anything
    if (start === endValue) {
      setCount(endValue);
      return;
    }

    // Avoid division by zero
    if (endValue === 0) {
      setCount(0);
      return;
    }

    const incrementTime = (duration / endValue);
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= endValue) {
        setCount(endValue);
        clearInterval(timer);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [end, duration]);

  return count.toLocaleString();
};
