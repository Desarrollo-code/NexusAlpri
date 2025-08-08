// src/components/resources/decorative-folder.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';

interface DecorativeFolderProps {
  patternId: number | string;
  className?: string;
}

// Paleta de colores sólidos y profesionales para el tema oscuro
const backgroundColors = [
    'hsl(150, 15%, 25%)', // Verde musgo oscuro
    'hsl(30, 8%, 30%)',   // Gris cálido
    'hsl(220, 10%, 32%)', // Azul pizarra
    'hsl(210, 12%, 28%)', // Azul grisáceo
    'hsl(180, 10%, 26%)', // Turquesa oscuro
    'hsl(40, 10%, 30%)',  // Marrón suave
];

// Paleta de colores para los PATRONES. Contrastan sutilmente con el fondo.
const patternColors = [
    'hsl(150, 15%, 20%)', // Verde más oscuro
    'hsl(30, 8%, 25%)',   // Gris más oscuro
    'hsl(220, 10%, 27%)', // Azul más oscuro
    'hsl(210, 12%, 23%)', // Azul grisáceo más oscuro
    'hsl(180, 10%, 21%)', // Turquesa más oscuro
    'hsl(40, 10%, 25%)',  // Marrón más oscuro
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
   // Ondas (Waves)
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
    <div className={cn(className)} style={style} />
  );
};
