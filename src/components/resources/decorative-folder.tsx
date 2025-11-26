// src/components/resources/decorative-folder.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { getProcessColors } from '@/lib/utils';

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
    // Utiliza la función centralizada para obtener los colores del tema.
    const { raw } = getProcessColors(String(id));

    // El color para el patrón será el tono medio, más sutil.
    const patternColor = raw.medium;
    
    const numericId = typeof id === 'string' ? stringToHash(id) : id;
    const patternGenerator = patterns[numericId % patterns.length];
    
    // Genera el estilo del patrón y lo combina con el color de fondo claro.
    const patternStyle = patternGenerator(patternColor);
    
    return {
        backgroundColor: raw.light,
        ...patternStyle
    };
};

export const DecorativeFolder: React.FC<DecorativeFolderProps> = ({ patternId, className }) => {
  const [style, setStyle] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    // La generación de estilos ahora puede ocurrir en el cliente de forma segura.
    setStyle(getUniqueFolderStyle(patternId));
  }, [patternId]);

  return (
    <div className={cn(className)} style={style} />
  );
};
