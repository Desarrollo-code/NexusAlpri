// src/components/icons/icon-shield.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconShield = (props: SVGProps<SVGSVGElement>) => {
  const uniqueId = React.useId();
  const gradientId = `RG1_${uniqueId.replace(/:/g, "")}`;

  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" fx="50%" fy="50%" r="60%">
          <stop
            style={{
              stopColor: "rgb(172,255,177)",
              stopOpacity: 1,
            }}
            offset="0%"
          />
          <stop
            style={{
              stopColor: "rgb(4,95,0)",
              stopOpacity: 1,
            }}
            offset="100%"
          />
        </radialGradient>
      </defs>
      <path
        style={{
          fill: `url(#${gradientId})`,
          fillOpacity: 1,
          fillRule: "nonzero",
          stroke: "#444444",
          strokeWidth: 4,
        }}
        d="M 50,2 C 44,8 35,20 10,10 11,60 10,80 50,98 90,80 91,64 90,10 65,20 55,8 50,2 z"
      />
      <path
        style={{
          fill: "#35ff35",
          fillOpacity: 0.7,
          stroke: "#007300",
          strokeWidth: 2,
          strokeOpacity: 0.8,
        }}
        d="M 31,33 C 34,36 46,61 48,72 52,65 52,53 86,21 72,27 57,40 47,49 45,46 40,39 31,33"
      />
    </svg>
  );
};
