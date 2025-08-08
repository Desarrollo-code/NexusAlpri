// src/components/resources/decorative-folder.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';

interface DecorativeFolderProps {
  patternId: number | string;
  className?: string;
}

// Paletas de colores tonales vibrantes.
// Cada objeto contiene un color de fondo y un color más oscuro para el patrón.
const colorPalettes = [
    { background: 'hsl(210, 50%, 45%)', pattern: 'hsl(210, 50%, 40%)' }, // Azul
    { background: 'hsl(160, 50%, 40%)', pattern: 'hsl(160, 50%, 35%)' }, // Verde
    { background: 'hsl(0, 55%, 50%)',   pattern: 'hsl(0, 55%, 45%)' },   // Rojo
    { background: 'hsl(30, 80%, 55%)',  pattern: 'hsl(30, 80%, 50%)' },  // Naranja
    { background: 'hsl(260, 45%, 50%)', pattern: 'hsl(260, 45%, 45%)' }, // Púrpura
    { background: 'hsl(180, 60%, 40%)', pattern: 'hsl(180, 60%, 35%)' }, // Turquesa
];


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
   // Ondas (Waves) - Un patrón adicional para más variedad
  (color: string) => ({
    backgroundImage: `
      radial-gradient(circle at 100% 50%, transparent 20%, ${color} 21%, ${color} 34%, transparent 35%, transparent),
      radial-gradient(circle at 0% 50%, transparent 20%, ${color} 21%, ${color} 34%, transparent 35%, transparent)
    `,
    backgroundSize: '30px 40px',
  }),
];

/**
 * Asigna un estilo único (color de fondo + patrón) a cada carpeta
 * basado en su ID.
 */
const getUniqueFolderStyle = (id: number | string): React.CSSProperties => {
    const numericId = typeof id === 'string'
        ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        : id;

    const { background, pattern: patternColor } = colorPalettes[numericId % colorPalettes.length];
    const patternGenerator = patterns[numericId % patterns.length];
    
    // Genera el estilo del patrón y lo combina con el color de fondo.
    const patternStyle = patternGenerator(patternColor);
    
    return {
        backgroundColor: background,
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
