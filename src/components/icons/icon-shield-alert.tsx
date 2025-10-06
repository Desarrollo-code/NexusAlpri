// src/components/icons/icon-shield-alert.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconShieldAlert = (props: SVGProps<SVGSVGElement>) => (
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
        <linearGradient id="shield-alert-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#A855F7', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
        </linearGradient>
         <linearGradient id="shield-alert-accent-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FBBF24', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#F97316', stopOpacity: 1 }} />
        </linearGradient>
    </defs>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="url(#shield-alert-gradient)"/>
    <path d="M12 8v4" stroke="url(#shield-alert-accent-gradient)"/>
    <path d="M12 16h.01" stroke="url(#shield-alert-accent-gradient)"/>
  </svg>
);
