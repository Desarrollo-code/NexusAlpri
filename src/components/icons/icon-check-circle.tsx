// src/components/icons/icon-check-check.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconCheckCheck = (props: SVGProps<SVGSVGElement>) => {
  const uniqueId = React.useId ? React.useId() : '';
  const gradientId = `Gradient_${uniqueId.replace(/:/g, '')}`;

  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient
          x1={20}
          y1={60}
          x2={60}
          y2={40}
          id={gradientId}
          gradientUnits="userSpaceOnUse"
        >
          <stop
            style={{
              stopColor: "#0F650E",
              stopOpacity: 1,
            }}
            offset={0}
          />
          <stop
            style={{
              stopColor: "#399238",
              stopOpacity: 1,
            }}
            offset={1}
          />
        </linearGradient>
      </defs>
      <circle
        cx={50}
        cy={50}
        r={48}
        style={{
          fill: "#0F650E",
        }}
      />
      <circle
        cx={50}
        cy={50}
        r={43}
        style={{
          fill: `url(#${gradientId})`,
          stroke: "#eeeeee",
          strokeWidth: 3,
        }}
      />
      <path
        style={{
          fill: "#ffffff",
        }}
        d="M 26,41 C 28,45 43,73 45,86 47,78 50,57 80,24 68,30 55,44 44,55 40,52 35,48 26,41"
      />
    </svg>
  );
};
