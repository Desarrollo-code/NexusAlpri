// src/components/icons/icon-folder-dynamic.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconFolderDynamic = ({ color, ...props }: SVGProps<SVGSVGElement> & { color?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    x="0px"
    y="0px"
    width="100"
    height="100"
    viewBox="0 0 48 48"
    {...props}
  >
    <path
      fill={color || "#fac017"}
      d="M44.5,41h-41C2.119,41,1,39.881,1,38.5v-31C1,6.119,2.119,5,3.5,5h11.597 c1.519,0,2.955,0.69,3.904,1.877L21.5,10h23c1.381,0,2.5,1.119,2.5,2.5v26C47,39.881,45.881,41,44.5,41z"
    ></path>
    <path
      fill={color ? 'rgba(255,255,255,0.2)' : '#e2e4e3'}
      d="M2,25h20V11H4c-1.105,0-2,0.895-2,2V25z"
    ></path>
    <path
      fill={color ? 'rgba(255,255,255,0.3)' : '#fbfef3'}
      d="M2,26h20V12H4c-1.105,0-2,0.895-2,2V26z"
    ></path>
    <path
      fill={color ? 'rgba(0,0,0,0.1)' : '#d79c1e'}
      d="M1,37.875V38.5C1,39.881,2.119,41,3.5,41h41c1.381,0,2.5-1.119,2.5-2.5v-0.625H1z"
    ></path>
    <path
      fill={color ? 'rgba(255,255,255,0.5)' : '#fed86b'}
      d="M44.5,11h-23l-1.237,0.824C19.114,12.591,17.763,13,16.381,13H3.5C2.119,13,1,14.119,1,15.5 v22C1,38.881,2.119,40,3.5,40h41c1.381,0,2.5-1.119,2.5-2.5v-24C47,12.119,45.881,11,44.5,11z"
    ></path>
    <path
      fill={color ? 'rgba(255,255,255,0.8)' : '#ffe8a2'}
      d="M44.5,40h-41C2.119,40,1,38.881,1,37.5v-21C1,15.119,2.119,14,3.5,14h13.256 c1.382,0,2.733-0.409,3.883-1.176L21.875,12H44.5c1.381,0,2.5,1.119,2.5,2.5v23C47,38.881,45.881,40,44.5,40z"
    ></path>
  </svg>
);
