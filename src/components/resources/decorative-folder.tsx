// src/components/resources/decorative-folder.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { colord, extend } from 'colord';
import lchPlugin from 'colord/plugins/lch';

extend([lchPlugin]);

interface DecorativeFolderProps {
  patternId: number | string;
  className?: string;
}

const stringToHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; 
    }
    return Math.abs(hash);
};

// Definición de los patrones usando CSS background-image
const patterns = [
  // Cuadrícula (Grid)
  (color: string) => ({
    backgroundImage: `
      linear-gradient(${color} 1px, transparent 1px),
      linear-gradient(90deg, ${color} 1px, transparent 1px)
    `,
    backgroundSize: '20px 20px',
  }),
  // Líneas Diagonales
  (color: string) => ({
    backgroundImage: `repeating-linear-gradient(
      45deg,
      ${color},
      ${color} 1px,
      transparent 1px,
      transparent 10px
    )`,
  }),
  // Puntos (Dots)
  (color: string) => ({
    backgroundImage: `radial-gradient(${color} 1.2px, transparent 1.2px)`,
    backgroundSize: '15px 15px',
  }),
  // Zig-Zag
  (color: string) => ({
    backgroundImage: `
      linear-gradient(135deg, ${color} 25%, transparent 25%), 
      linear-gradient(225deg, ${color} 25%, transparent 25%)`,
    backgroundSize: '20px 20px',
  }),
];

/**
 * Asigna un estilo único (color de fondo + patrón) a cada carpeta
 * basado en su ID y en el color primario del tema actual.
 */
const getUniqueFolderStyle = (id: number | string): React.CSSProperties => {
    const numericId = typeof id === 'string'
        ? stringToHash(id)
        : id;

    // Obtener el color primario desde la variable CSS
    const primaryColorVar = typeof window !== 'undefined' 
        ? getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
        : '210 90% 55%'; // Fallback a azul

    // Usamos colord para manipular el color. LCH es mejor para variaciones perceptuales.
    const baseColor = colord(`hsl(${primaryColorVar})`);

    // Variar el matiz (hue) ligeramente para crear variedad entre carpetas.
    const hueVariation = (numericId % 30) - 15; // Variación entre -15 y 15
    const newHue = baseColor.hue() + hueVariation;

    // Crear un color de fondo más claro y menos saturado.
    const backgroundColor = baseColor
        .lch({ l: 85, c: 20, h: newHue })
        .toRgbString();

    // Crear un color para el patrón que sea ligeramente más oscuro y sutil.
    const patternColor = colord(backgroundColor).darken(0.1).alpha(0.5).toRgbString();

    const patternGenerator = patterns[numericId % patterns.length];
    
    // Genera el estilo del patrón y lo combina con el color de fondo.
    const patternStyle = patternGenerator(patternColor);
    
    return {
        backgroundColor,
        ...patternStyle
    };
};

export const DecorativeFolder: React.FC<DecorativeFolderProps> = ({ patternId, className }) => {
  // Obtenemos el objeto de estilo completo para la carpeta.
  const style = getUniqueFolderStyle(patternId);

  return (
    <div className={cn(className)} style={style} />
  );
};
