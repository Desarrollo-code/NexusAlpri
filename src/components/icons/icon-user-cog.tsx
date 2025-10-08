// src/components/icons/icon-user-cog.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconUserCog = (props: SVGProps<SVGSVGElement>) => (
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
    <circle cx="18" cy="15" r="3" />
    <circle cx="6" cy="9" r="4" />
    <path d="M12 19.5a6.5 6.5 0 0 0-7-5.2" />
    <path d="M21.2 21a3 3 0 0 0-1.2-5.2" />
  </svg>
);
