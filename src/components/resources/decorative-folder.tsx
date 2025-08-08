// src/components/resources/decorative-folder.tsx
'use client';
import React from 'react';

interface DecorativeFolderProps {
  patternId: number | string;
  className?: string;
}

// Paleta de colores para los FONDOS de las carpetas. Son colores muy suaves.
const backgroundColors = [
    'hsl(210 40% 98%)',   // bg-slate-50
    'hsl(30 54% 96%)',    // bg-orange-50
    'hsl(142 71% 94%)',  // bg-green-50
    'hsl(222 47% 96%)',  // bg-blue-50
    'hsl(346 76% 96%)',  // bg-pink-50
    'hsl(48 91% 95%)',   // bg-yellow-50
];

// Paleta de colores para los PATRONES (líneas, puntos). Contrastan suavemente con el fondo.
const patternColors = [
    'hsl(210 40% 85%)',   // slate-300
    'hsl(30 54% 80%)',    // orange-300
    'hsl(142 71% 75%)',  // green-300
    'hsl(222 47% 80%)',  // blue-300
    'hsl(346 76% 85%)',  // pink-300
    'hsl(48 91% 80%)',   // yellow-300
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
    backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
    backgroundSize: '15px 15px',
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

    const bgColor = backgroundColors[numericId % backgroundColors.length];
    const patternColor = patternColors[numericId % patternColors.length];
    const patternGenerator = patterns[numericId % patterns.length];
    
    // Genera el estilo del patrón y lo combina con el color de fondo.
    const patternStyle = patternGenerator(patternColor);
    
    return {
        backgroundColor: bgColor,
        ...patternStyle
    };
};

export const DecorativeFolder: React.FC<DecorativeFolderProps> = ({ patternId, className }) => {
  // Obtenemos el objeto de estilo completo para la carpeta.
  const style = getUniqueFolderStyle(patternId);

  return (
    <div className={className} style={style} />
  );
};
