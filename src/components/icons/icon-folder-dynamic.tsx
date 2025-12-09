// src/components/icons/icon-folder-dynamic.tsx
import * as React from 'react';
import { SVGProps } from 'react';
import { colord } from 'colord';

interface IconFolderDynamicProps extends SVGProps<SVGSVGElement> {
  color?: string;
}

export const IconFolderDynamic = ({ color = '#fac017', ...props }: IconFolderDynamicProps) => {
  // Generar una paleta de colores a partir del color base
  const base = colord(color);
  const dark1 = base.darken(0.1).toHex();
  const dark2 = base.darken(0.05).toHex();
  const light1 = base.lighten(0.1).toHex();
  const light2 = base.lighten(0.2).toHex();

  // IDs únicos para los gradientes para evitar conflictos si hay múltiples SVGs en la página
  const uniqueId = React.useId();

  return (
    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 48 48" {...props}>
      <defs>
        <linearGradient id={`grad1_${uniqueId}`} x1="-7.018" x2="39.387" y1="9.308" y2="33.533" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={base.toHex()} />
          <stop offset=".909" stopColor={dark2} />
        </linearGradient>
        <linearGradient id={`grad2_${uniqueId}`} x1="5.851" x2="18.601" y1="9.254" y2="27.39" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbfef3" />
          <stop offset=".909" stopColor="#e2e4e3" />
        </linearGradient>
        <linearGradient id={`grad3_${uniqueId}`} x1="2" x2="22" y1="19" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbfef3" />
          <stop offset=".909" stopColor="#e2e4e3" />
        </linearGradient>
        <linearGradient id={`grad4_${uniqueId}`} x1="16.865" x2="44.965" y1="39.287" y2="39.792" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={dark1} />
          <stop offset=".464" stopColor={dark2} />
        </linearGradient>
        <linearGradient id={`grad5_${uniqueId}`} x1="-4.879" x2="35.968" y1="12.764" y2="30.778" gradientUnits="userSpaceOnUse">
          <stop offset=".34" stopColor={light2} />
          <stop offset=".485" stopColor={light1} />
          <stop offset=".652" stopColor={light2} />
          <stop offset=".828" stopColor={light1} />
          <stop offset="1" stopColor={base.toHex()} />
        </linearGradient>
        <radialGradient id={`grad6_${uniqueId}`} cx="37.836" cy="49.317" r="53.875" gradientUnits="userSpaceOnUse">
          <stop offset=".199" stopColor={light1} />
          <stop offset=".601" stopColor={light2} />
          <stop offset=".68" stopColor={base.toHex()} />
          <stop offset=".886" stopColor={light1} />
          <stop offset="1" stopColor={light2} />
        </radialGradient>
      </defs>
      <path fill={`url(#grad1_${uniqueId})`} d="M44.5,41h-41C2.119,41,1,39.881,1,38.5v-31C1,6.119,2.119,5,3.5,5h11.597	c1.519,0,2.955,0.69,3.904,1.877L21.5,10h23c1.381,0,2.5,1.119,2.5,2.5v26C47,39.881,45.881,41,44.5,41z" />
      <path fill={`url(#grad2_${uniqueId})`} d="M2,25h20V11H4c-1.105,0-2,0.895-2,2V25z" />
      <path fill={`url(#grad3_${uniqueId})`} d="M2,26h20V12H4c-1.105,0-2,0.895-2,2V26z" />
      <path fill={`url(#grad4_${uniqueId})`} d="M1,37.875V38.5C1,39.881,2.119,41,3.5,41h41c1.381,0,2.5-1.119,2.5-2.5v-0.625H1z" />
      <path fill={`url(#grad5_${uniqueId})`} d="M44.5,11h-23l-1.237,0.824C19.114,12.591,17.763,13,16.381,13H3.5C2.119,13,1,14.119,1,15.5	v22C1,38.881,2.119,40,3.5,40h41c1.381,0,2.5-1.119,2.5-2.5v-24C47,12.119,45.881,11,44.5,11z" />
      <path fill={`url(#grad6_${uniqueId})`} d="M44.5,40h-41C2.119,40,1,38.881,1,37.5v-21C1,15.119,2.119,14,3.5,14h13.256	c1.382,0,2.733-0.409,3.883-1.176L21.875,12H44.5c1.381,0,2.5,1.119,2.5,2.5v23C47,38.881,45.881,40,44.5,40z" />
    </svg>
  );
};
