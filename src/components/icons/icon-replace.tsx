import * as React from 'react';
import { SVGProps } from 'react';

export const IconReplace = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M14 4h6v6" />
    <path d="m20 4-6 6" />
    <path d="M10 20H4v-6" />
    <path d="m4 20 6-6" />
  </svg>
);
