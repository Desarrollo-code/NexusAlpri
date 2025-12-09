// src/components/icons/icon-folder-yellow.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconFolderYellow = (props: SVGProps<SVGSVGElement>) => {
  // IDs únicos para evitar colisiones si el SVG se usa varias veces
  const uniqueId = React.useId();
  const gradient1 = `gradient1_${uniqueId}`;
  const gradient2 = `gradient2_${uniqueId}`;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 48 48" {...props}>
      <defs>
        <linearGradient id={gradient1} x1="24" x2="24" y1="6.708" y2="14.977" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#eba600"></stop>
          <stop offset="1" stopColor="#c28200"></stop>
        </linearGradient>
        <linearGradient id={gradient2} x1="24" x2="24" y1="10.854" y2="40.983" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffd869"></stop>
          <stop offset="1" stopColor="#fec52b"></stop>
        </linearGradient>
      </defs>
      <path fill={`url(#${gradient1})`} d="M24.414,10.414l-2.536-2.536C21.316,7.316,20.553,7,19.757,7H5C3.895,7,3,7.895,3,9l0,30 c0,1.105,0.895,2,2,2l38,0c1.105,0,2-0.895,2-2V13c0-1.105-0.895-2-2-2l-17.172,0C25.298,11,24.789,10.789,24.414,10.414z"></path>
      <path fill={`url(#${gradient2})`} d="M21.586,14.414l3.268-3.268C24.947,11.053,25.074,11,25.207,11H43c1.105,0,2,0.895,2,2v26 c0,1.105-0.895,2-2,2H5c-1.105,0-2-0.895-2-2V15.5C3,15.224,3.224,15,3.5,15h16.672C20.702,15,21.211,14.789,21.586,14.414z"></path>
    </svg>
  );
};
