// src/components/icons/icon-book-marked.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconBookMarked = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width="1em"
    height="1em"
    {...props}
  >
    <rect x={10} y={10} width={25} height={80} fill="#0078D4" />
    <rect x={10} y={20} width={25} height={8} fill="#2B9EDF" />
    <rect x={10} y={70} width={25} height={8} fill="#2B9EDF" />
    <rect x={35} y={35} width={25} height={55} fill="#6A2BC3" />
    <rect x={35} y={45} width={25} height={8} fill="#8E52E9" />
    <rect x={60} y={10} width={25} height={80} fill="#A4262C" />
    <rect x={60} y={20} width={25} height={8} fill="#D13438" />
    <circle
      cx={75}
      cy={75}
      r={22}
      fill="#107C41"
      stroke="black"
      strokeWidth={0.5}
    />
    <path
      d="M65 75 L72 82 L85 68"
      fill="none"
      stroke="white"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default IconBookMarked;
