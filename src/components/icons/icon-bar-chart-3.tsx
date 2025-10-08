// src/components/icons/icon-bar-chart-3.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconBarChart3 = (props: SVGProps<SVGSVGElement>) => (
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
      <linearGradient id="bar-chart-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#60A5FA', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M3 3v18h18" stroke="hsl(var(--muted-foreground))" />
    <path d="M18 17V9" stroke="url(#bar-chart-gradient)" fill="url(#bar-chart-gradient)" strokeWidth="4" />
    <path d="M13 17V5" stroke="url(#bar-chart-gradient)" fill="url(#bar-chart-gradient)" strokeWidth="4" />
    <path d="M8 17v-3" stroke="url(#bar-chart-gradient)" fill="url(#bar-chart-gradient)" strokeWidth="4" />
  </svg>
);
