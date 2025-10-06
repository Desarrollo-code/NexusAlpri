// src/components/icons/icon-file-text.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconFileText = (props: SVGProps<SVGSVGElement>) => (
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
      <linearGradient id="file-text-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#A855F7', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" stroke="url(#file-text-gradient)" />
    <polyline points="14 2 14 8 20 8" stroke="url(#file-text-gradient)" />
    <line x1="16" y1="13" x2="8" y2="13" stroke="url(#file-text-gradient)" />
    <line x1="16" y1="17" x2="8" y2="17" stroke="url(#file-text-gradient)" />
    <line x1="10" y1="9" x2="8" y2="9" stroke="url(#file-text-gradient)" />
  </svg>
);
