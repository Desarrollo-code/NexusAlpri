// src/components/icons/icon-graduation-cap.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconGraduationCap = (props: SVGProps<SVGSVGElement>) => (
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
      <linearGradient id="grad-cap-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.084a1 1 0 0 0 0 1.838l8.57 3.908a2 2 0 0 0 1.66 0z" stroke="url(#grad-cap-gradient)" fill="url(#grad-cap-gradient)" fillOpacity="0.2" />
    <path d="M22 10v6" stroke="url(#grad-cap-gradient)" />
    <path d="M6 12v5c0 1.66 4 3 6 3s6-1.34 6-3v-5" stroke="url(#grad-cap-gradient)" />
  </svg>
);
