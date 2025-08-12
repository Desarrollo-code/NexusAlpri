
'use client';

import * as React from 'react';
import { cn } from "@/lib/utils";

export const ColorfulLoader = () => {
  const colors = [
    '#F87171', // Red
    '#EC4899', // Pink
    '#A855F7', // Purple
    '#60A5FA', // Blue
    '#4ADE80', // Green
    '#FBBF24', // Yellow
  ];

  return (
    <div className="relative w-16 h-16 animate-spin-slow">
      {colors.map((color, i) => (
        <div
          key={i}
          className="absolute w-full h-full"
          style={{ transform: `rotate(${i * 60}deg)` }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            style={{
              transform: `translate(0, -100%)`, // Move petal "up" from center
              transformOrigin: '50% 150%',
            }}
          >
            <path
              d="M50 0 C 65 0, 75 20, 50 40 C 25 20, 35 0, 50 0 Z"
              fill={color}
            />
          </svg>
        </div>
      ))}
    </div>
  );
};
