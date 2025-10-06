// src/components/icons/icon-notebook.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconNotebook = (props: SVGProps<SVGSVGElement>) => (
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
      <linearGradient id="notebook-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#f472b6', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#fb923c', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M2 6h4" stroke="url(#notebook-gradient)" />
    <path d="M2 12h4" stroke="url(#notebook-gradient)" />
    <path d="M2 18h4" stroke="url(#notebook-gradient)" />
    <path d="M19.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4L14 2z" stroke="url(#notebook-gradient)" fill="url(#notebook-gradient)" fillOpacity="0.1" />
  </svg>
);
