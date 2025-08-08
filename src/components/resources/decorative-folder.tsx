// src/components/resources/decorative-folder.tsx
'use client';
import React from 'react';

interface DecorativeFolderProps {
  patternId: number | string;
  className?: string;
}

const patterns = [
  // Pattern 1: Wavy Lines
  (color: string) => (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="pattern1" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(45)">
          <path d="M-10 10 Q 10 0 30 10 T 70 10" stroke={color} strokeWidth="1.5" fill="none" />
          <path d="M-10 30 Q 10 20 30 30 T 70 30" stroke={color} strokeWidth="1.5" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pattern1)" />
    </svg>
  ),
  // Pattern 2: Polka Dots
  (color: string) => (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="pattern2" patternUnits="userSpaceOnUse" width="20" height="20">
          <circle cx="5" cy="5" r="1.5" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pattern2)" />
    </svg>
  ),
  // Pattern 3: Grid Lines
  (color: string) => (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="pattern3" patternUnits="userSpaceOnUse" width="15" height="15">
          <path d="M 0 0 L 0 15 M 0 0 L 15 0" stroke={color} strokeWidth="0.8" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pattern3)" />
    </svg>
  ),
  // Pattern 4: Diagonal Lines
  (color: string) => (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="pattern4" patternUnits="userSpaceOnUse" width="10" height="10">
          <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke={color} strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pattern4)" />
    </svg>
  ),
];

export const getPattern = (id: number | string) => {
    const numericId = typeof id === 'string' ? 
        id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : id;
    const patternIndex = numericId % patterns.length;
    return patterns[patternIndex];
};

export const DecorativeFolder: React.FC<DecorativeFolderProps> = ({ patternId, className }) => {
  const patternGenerator = getPattern(patternId);

  return (
    <div className={className}>
      {patternGenerator('hsl(var(--primary) / 0.2)')}
    </div>
  );
};
