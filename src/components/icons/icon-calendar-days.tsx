// src/components/icons/icon-calendar-days.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconCalendarDays = (props: SVGProps<SVGSVGElement>) => (
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
      <linearGradient id="calendar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#EF4444', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#F97316', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" stroke="url(#calendar-gradient)" fill="url(#calendar-gradient)" fillOpacity={0.1} />
    <line x1="16" y1="2" x2="16" y2="6" stroke="url(#calendar-gradient)" />
    <line x1="8" y1="2" x2="8" y2="6" stroke="url(#calendar-gradient)" />
    <line x1="3" y1="10" x2="21" y2="10" stroke="url(#calendar-gradient)" />
    <circle cx="8.01" cy="14" r="0.5" fill="url(#calendar-gradient)" stroke="none" />
    <circle cx="12.01" cy="14" r="0.5" fill="url(#calendar-gradient)" stroke="none" />
    <circle cx="16.01" cy="14" r="0.5" fill="url(#calendar-gradient)" stroke="none" />
  </svg>
);
