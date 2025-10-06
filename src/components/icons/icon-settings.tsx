// src/components/icons/icon-settings.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconSettings = (props: SVGProps<SVGSVGElement>) => (
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
        <linearGradient id="settings-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#60A5FA', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#A78BFA', stopOpacity: 1 }} />
        </linearGradient>
    </defs>
    <path d="M12.22 2h-4.44a2 2 0 0 0-2 2v.79a2 2 0 0 1-1.69.9L2.5 6.4a2 2 0 0 0-1 1.73l-.43 3.56a2 2 0 0 0 .34 1.88l1.73 2.51a2 2 0 0 1 0 2.22l-1.73 2.51a2 2 0 0 0-.34 1.88l.43 3.56a2 2 0 0 0 1 1.73l1.59.7a2 2 0 0 1 1.69.9v.79a2 2 0 0 0 2 2h4.44a2 2 0 0 0 2-2v-.79a2 2 0 0 1 1.69-.9l1.59-.7a2 2 0 0 0 1-1.73l.43-3.56a2 2 0 0 0-.34-1.88l-1.73-2.51a2 2 0 0 1 0-2.22l1.73-2.51a2 2 0 0 0 .34-1.88l-.43-3.56a2 2 0 0 0-1-1.73l-1.59-.7a2 2 0 0 1-1.69-.9V4a2 2 0 0 0-2-2z" stroke="url(#settings-gradient)"/>
    <circle cx="12" cy="12" r="3" stroke="url(#settings-gradient)"/>
  </svg>
);
