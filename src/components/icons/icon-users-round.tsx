// src/components/icons/icon-users-round.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconUsersRound = (props: SVGProps<SVGSVGElement>) => (
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
        <linearGradient id="users-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#22D3EE', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
        </linearGradient>
    </defs>
    <path d="M18 21a8 8 0 0 0-16 0" stroke="url(#users-gradient)" fill="url(#users-gradient)" fillOpacity="0.2"/>
    <circle cx="10" cy="8" r="5" stroke="url(#users-gradient)" fill="url(#users-gradient)" fillOpacity="0.2"/>
    <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-4-2" stroke="url(#users-gradient)" />
  </svg>
);
