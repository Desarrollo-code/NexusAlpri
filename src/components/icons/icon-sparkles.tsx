// src/components/icons/icon-sparkles.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconSparkles = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <defs>
      <linearGradient id="sparkles-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#FACC15', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#F97316', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275z" stroke="url(#sparkles-gradient)" fill="url(#sparkles-gradient)" fillOpacity="0.3"/>
  </svg>
);
