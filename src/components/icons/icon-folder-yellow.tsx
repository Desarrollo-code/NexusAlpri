// src/components/icons/icon-folder-yellow.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconFolderYellow = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="800px"
    height="800px"
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
    enableBackground="new 0 0 48 48"
    {...props}
  >
    <path
      fill="currentColor"
      d="M40,12H22l-4-4H8c-2.2,0-4,1.8-4,4v8h40v-4C44,13.8,42.2,12,40,12z"
      opacity="0.7"
    />
    <path
      fill="currentColor"
      d="M40,12H8c-2.2,0-4,1.8-4,4v20c0,2.2,1.8,4,4,4h32c2.2,0,4-1.8,4-4V16C44,13.8,42.2,12,40,12z"
    />
  </svg>
);
export default IconFolderYellow;
