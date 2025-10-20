// src/components/icons/icon-brand-windows.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconBrandWindows = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="icon icon-tabler icon-tabler-brand-windows"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    strokeWidth="2"
    stroke="currentColor"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M17.8 20l-12 -1.5c-1 -.1 -1.8 -1.3 -1.8 -2.5v-10c0 -1.2 .8 -2.4 1.8 -2.5l12 -1.5c1.2 -.1 2.2 .8 2.2 2v13c0 1.2 -1.2 2.3 -2.2 2.2z" />
    <path d="M4 12h16" />
    <path d="M12 4v16" />
  </svg>
);
