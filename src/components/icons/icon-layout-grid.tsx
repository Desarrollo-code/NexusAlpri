// src/components/icons/icon-layout-grid.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconLayoutGrid = (props: SVGProps<SVGSVGElement>) => (
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
      <linearGradient id="grid-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#2dd4bf', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <rect width="7" height="7" x="3" y="3" rx="1" fill="url(#grid-gradient)" stroke="none" />
    <rect width="7" height="7" x="14" y="3" rx="1" fill="url(#grid-gradient)" stroke="none" />
    <rect width="7" height="7" x="14" y="14" rx="1" fill="url(#grid-gradient)" stroke="none" />
    <rect width="7" height="7" x="3" y="14" rx="1" fill="url(#grid-gradient)" stroke="none" />
  </svg>
);
