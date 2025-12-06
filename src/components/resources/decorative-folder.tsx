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
  // 1. Cuadrícula (Grid)
  (color: string) => ({
    backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
    backgroundSize: '20px 20px',
  }),
  // 2. Líneas Diagonales
  (color: string) => ({
    backgroundImage: `repeating-linear-gradient(45deg, ${color}, ${color} 1px, transparent 1px, transparent 10px)`,
  }),
  // 3. Puntos (Dots)
  (color: string) => ({
    backgroundImage: `radial-gradient(${color} 1.2px, transparent 1.2px)`,
    backgroundSize: '15px 15px',
  }),
  // 4. Zig-Zag
  (color: string) => ({
    backgroundImage: `linear-gradient(135deg, ${color} 25%, transparent 25%), linear-gradient(225deg, ${color} 25%, transparent 25%)`,
    backgroundSize: '20px 20px',
  }),
  // 5. Romboides / Diamantes
  (color: string) => ({
    backgroundImage: `linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%), linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%)`,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 10px 10px'
  }),
  // 6. Hexágonos / Panal
  (color: string) => ({
    backgroundImage: `linear-gradient(30deg, ${color} 12%, transparent 12.5%, transparent 87.5%, ${color} 88%, transparent 88%), linear-gradient(90deg, transparent 33.333%, ${color} 33.333%, ${color} 66.666%, transparent 66.666%), linear-gradient(150deg, ${color} 12%, transparent 12.5%, transparent 87.5%, ${color} 88%, transparent 88%)`,
    backgroundSize: '30px 52px',
  }),
  // 7. Triángulos Apilados / Chevron
  (color: string) => ({
    backgroundImage: `linear-gradient(45deg, ${color} 50%, transparent 50%), linear-gradient(-45deg, ${color} 50%, transparent 50%)`,
    backgroundSize: '20px 20px',
  }),
  // 8. Escamas / Arcos
  (color: string) => ({
    backgroundImage: `radial-gradient(circle at 100% 50%, transparent 20%, ${color} 21%, ${color} 34%, transparent 35%, transparent), radial-gradient(circle at 0% 50%, transparent 20%, ${color} 21%, ${color} 34%, transparent 35%, transparent)`,
    backgroundSize: '40px 20px',
  }),
  // 9. Rayas Diagonales Gruesas
  (color: string) => ({
    backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 8px, ${color} 8px, ${color} 18px)`,
  }),
  // 10. Tablero de Ajedrez
  (color: string) => ({
    backgroundImage: `linear-gradient(45deg, ${color} 25%, transparent 25%), linear-gradient(-45deg, ${color} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${color} 75%), linear-gradient(-45deg, transparent 75%, ${color} 75%)`,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 0, 10px 10px, 10px 10px',
  }),
  // 11. Líneas Cruzadas / Patrón X
  (color: string) => ({
     backgroundImage: `repeating-linear-gradient(45deg, ${color}, ${color} 1px, transparent 1px, transparent 10px), repeating-linear-gradient(-45deg, ${color}, ${color} 1px, transparent 1px, transparent 10px)`,
  }),
  // 12. Ondas Suaves
  (color: string) => ({
     backgroundImage: `radial-gradient(circle at 100% 100%, transparent 14px, ${color} 15px), radial-gradient(circle at 0 0, transparent 14px, ${color} 15px), radial-gradient(circle at 100% 0, transparent 14px, ${color} 15px), radial-gradient(circle at 0 100%, transparent 14px, ${color} 15px)`,
     backgroundSize: '30px 30px',
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
