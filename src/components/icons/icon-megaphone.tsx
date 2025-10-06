// src/components/icons/icon-megaphone.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconMegaphone = (props: SVGProps<SVGSVGElement>) => (
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
      <linearGradient id="megaphone-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#EC4899', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#D946EF', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="m3 11 18-5v12L3 14v-3z" stroke="url(#megaphone-gradient)" fill="url(#megaphone-gradient)" fillOpacity="0.2"/>
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" stroke="url(#megaphone-gradient)" />
  </svg>
);
