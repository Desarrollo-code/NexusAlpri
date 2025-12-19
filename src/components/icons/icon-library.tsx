// src/components/icons/icon-library.tsx
import * as React from 'react';
import { SVGProps } from 'react';

export const IconLibrary = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width="1em"
    height="1em"
    {...props}
  >
    <rect x={20} y={20} width={18} height={60} fill="#48C9B0" />
    <rect x={20} y={30} width={18} height={5} fill="#1ABC9C" />
    <rect x={25} y={45} width={8} height={20} fill="#1ABC9C" />
    <rect x={20} y={70} width={18} height={5} fill="#1ABC9C" />
    <rect x={42} y={30} width={16} height={50} fill="#F4B41A" />
    <rect x={42} y={38} width={16} height={4} fill="#E67E22" />
    <rect x={47} y={48} width={6} height={15} fill="#E67E22" />
    <rect x={42} y={68} width={16} height={4} fill="#E67E22" />
    <rect x={62} y={20} width={18} height={60} fill="#8E44AD" />
    <rect x={62} y={30} width={18} height={5} fill="#2E1A9C" />
    <rect x={67} y={45} width={8} height={20} fill="#2E1A9C" />
    <rect x={62} y={70} width={18} height={5} fill="#2E1A9C" />
  </svg>
);
