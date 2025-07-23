

import * as React from 'react';
import { SVGProps } from 'react';

export const RocketIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.05-3.11.66-1.47 1.35-3.02 2.23-4.65a25.26 25.26 0 0 0 5.79-5.79c1.63-.88 3.18-1.57 4.65-2.23-.81-.65-2.27-.66-3.11-.05-1.26 1.5-5 2-5 2s-3.74.5-5 2c-.71.84-.7 2.3-.05 3.11C7.52 14.28 6.18 15.65 4.5 16.5Z" />
    <path d="m12 15.01-3.5 3.5a2.24 2.24 0 0 1-3.18 0l-1.82-1.82a2.24 2.24 0 0 1 0-3.18l3.5-3.5" />
    <path d="m15 12.01-3.5 3.5" />
    <path d="M22 2 17.5 6.5" />
  </svg>
);
