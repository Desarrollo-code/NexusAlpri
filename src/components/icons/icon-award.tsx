// src/components/icons/icon-award.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconAward = (props: SVGProps<SVGSVGElement>) => (
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
      <linearGradient id="award-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#FBBF24', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <circle cx="12" cy="8" r="6" stroke="url(#award-gradient)" fill="url(#award-gradient)" fillOpacity="0.2" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" stroke="url(#award-gradient)" fill="url(#award-gradient)" fillOpacity="0.2"/>
  </svg>
);
