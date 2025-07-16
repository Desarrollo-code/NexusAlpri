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
    <path d="M18 21a8 8 0 0 0-16 0" />
    <circle cx={10} cy={8} r={5} />
    <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-4-2" />
  </svg>
);
