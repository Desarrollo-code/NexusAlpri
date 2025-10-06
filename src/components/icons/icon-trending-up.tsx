// src/components/icons/icon-trending-up.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconTrendingUp = (props: SVGProps<SVGSVGElement>) => (
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
      <linearGradient id="trending-up-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#22C55E', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#60A5FA', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="url(#trending-up-gradient)" />
    <polyline points="16 7 22 7 22 13" stroke="url(#trending-up-gradient)" />
  </svg>
);
