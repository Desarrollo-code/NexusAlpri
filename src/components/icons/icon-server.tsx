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
    <rect x="2" y="8" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="16" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="12" x2="6.01" y2="12" />
    <line x1="6" y1="20" x2="6.01" y2="20" />
    <path d="M16 10l-4 4" strokeWidth="2" stroke="hsl(var(--destructive))" />
    <path d="M12 10l4 4" strokeWidth="2" stroke="hsl(var(--destructive))" />
  </svg>
);
