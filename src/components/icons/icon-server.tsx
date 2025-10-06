import * as React from 'react';
import { SVGProps } from 'react';

export const IconServer = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <defs>
        <linearGradient id="server-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#A855F7', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
        </linearGradient>
    </defs>
    <rect x="2" y="8" width="20" height="8" rx="2" ry="2" stroke="url(#server-gradient)" />
    <rect x="2" y="16" width="20" height="8" rx="2" ry="2" stroke="url(#server-gradient)" />
    <line x1="6" y1="12" x2="6.01" y2="12" stroke="url(#server-gradient)" />
    <line x1="6" y1="20" x2="6.01" y2="20" stroke="url(#server-gradient)" />
    
    <path d="M16 10l-4 4" strokeWidth="2" stroke="hsl(var(--destructive))" />
    <path d="M12 10l4 4" strokeWidth="2" stroke="hsl(var(--destructive))" />

  </svg>
);
