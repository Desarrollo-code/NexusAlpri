import * as React from 'react';
import { SVGProps } from 'react';

export const IconLoader = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M12 2v4" />
    <path d="m16.2 7.8 2.8-2.8" />
    <path d="M18 12h4" />
    <path d="m16.2 16.2 2.8 2.8" />
    <path d="M12 18v4" />
    <path d="m7.8 16.2-2.8 2.8" />
    <path d="M6 12H2" />
    <path d="m7.8 7.8-2.8-2.8" />
  </svg>
);
