// src/components/icons/icon-book-marked.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconBookMarked = (props: SVGProps<SVGSVGElement>) => (
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
      <linearGradient id="book-marked-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20a2 2 0 0 1 2 2v16a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1" stroke="url(#book-marked-gradient)" />
    <path d="m16 2-4 5-4-5" stroke="url(#book-marked-gradient)" />
  </svg>
);
