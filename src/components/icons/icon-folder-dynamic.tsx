// src/components/icons/icon-folder-dynamic.tsx
import * as React from 'react';
import { SVGProps } from 'react';
import { colord } from 'colord';

interface IconFolderDynamicProps extends SVGProps<SVGSVGElement> {
  color: string;
}

export const IconFolderDynamic = ({ color, ...props }: IconFolderDynamicProps) => {
  const baseColor = colord(color);
  const darkColor = baseColor.darken(0.15).toRgbString();
  const lightColor = baseColor.lighten(0.1).toRgbString();

  return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 80"
        {...props}
    >
      {/* Pestaña trasera */}
      <path 
        d="M2 12 C2 8, 4 6, 8 6 L 38 6 C 42 6, 43 8, 45 12 L 92 12 C 96 12, 98 14, 98 18 L 98 22 L 2 22 Z"
        fill={lightColor}
      />
      {/* Cuerpo principal */}
      <path 
        d="M2 20 L2 72 C2 76, 4 78, 8 78 L 92 78 C 96 78, 98 76, 98 72 L 98 18 C 98 14, 96 12, 92 12 L 45 12 C 43 8, 42 6, 38 6 L 8 6 C 4 6, 2 8, 2 12 Z"
        fill={color}
      />
       {/* Sombra/Brillo inferior */}
      <path 
        d="M2 72 C2 76, 4 78, 8 78 L 92 78 C 96 78, 98 76, 98 72 L 98 65 L 2 65 Z"
        fill={darkColor}
        style={{ filter: "blur(2px)", opacity: 0.7 }}
      />
    </svg>
  );
};
