// src/components/icons/icon-users-round.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconUsersRound = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    width={64}
    height={64}
    {...props}
  >
    <circle
      cx={32}
      cy={32}
      r={30}
      fill="#E5C37E"
      stroke="#000000"
      strokeWidth={2}
    />
    <path
      d="M5.5 45 C 10 55, 54 55, 58.5 45"
      fill="none"
      stroke="#000000"
      strokeWidth={1}
      opacity={0.3}
    />
    <circle
      cx={20}
      cy={28}
      r={7}
      fill="#5D8CC9"
      stroke="#000000"
      strokeWidth={2}
    />
    <path
      d="M10 48 Q 10 38, 20 38 Q 30 38, 30 48"
      fill="#5D8CC9"
      stroke="#000000"
      strokeWidth={2}
    />
    <circle
      cx={44}
      cy={28}
      r={7}
      fill="#5D8CC9"
      stroke="#000000"
      strokeWidth={2}
    />
    <path
      d="M34 48 Q 34 38, 44 38 Q 54 38, 54 48"
      fill="#5D8CC9"
      stroke="#000000"
      strokeWidth={2}
    />
    <circle
      cx={32}
      cy={25}
      r={8}
      fill="#5D8CC9"
      stroke="#000000"
      strokeWidth={2}
    />
    <path
      d="M20 50 Q 20 36, 32 36 Q 44 36, 44 50"
      fill="#5D8CC9"
      stroke="#000000"
      strokeWidth={2}
    />
  </svg>
);
