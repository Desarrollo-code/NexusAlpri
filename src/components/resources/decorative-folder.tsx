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

// Paleta de patrones geométricos implementados con CSS
const patterns = [
  // 1. Grid (Rejilla Fina)
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
  // 5. Romboides / Diamantes (Área Rellena)
  (color: string) => ({
    backgroundImage: `linear-gradient(45deg, ${color} 25%, transparent 25%), linear-gradient(-45deg, ${color} 25%, transparent 25%)`,
    backgroundSize: '20px 30px',
  }),
  // 6. Hexágonos / Panal (Área Rellena)
  (color: string) => ({
    backgroundImage: `linear-gradient(60deg, ${color} 1px, transparent 1px), linear-gradient(-60deg, ${color} 1px, transparent 1px), linear-gradient(180deg, ${color} 1px, transparent 1px)`,
    backgroundSize: '20px 35px',
  }),
  // 7. Triángulos Apilados / Chevron (Área Rellena)
  (color: string) => ({
    backgroundImage: `linear-gradient(45deg, ${color} 50%, transparent 50%), linear-gradient(135deg, transparent 50%, ${color} 50%)`,
    backgroundSize: '30px 30px',
  }),
  // 8. Escamas / Arcos (Área Rellena)
  (color: string) => ({
     backgroundImage: `radial-gradient(circle at 0 0, transparent 14px, ${color} 15px), radial-gradient(circle at 100% 100%, transparent 14px, ${color} 15px)`,
     backgroundSize: '30px 30px',
  }),
  // 9. Rayas Diagonales Gruesas (Bandas)
  (color: string) => ({
    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, ${color} 8px, ${color} 18px)`,
  }),
  // 10. Tablero de Ajedrez (Área Rellena)
  (color: string) => ({
    backgroundImage: `linear-gradient(45deg, ${color} 25%, transparent 25%), linear-gradient(-45deg, ${color} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${color} 75%), linear-gradient(-45deg, transparent 75%, ${color} 75%)`,
    backgroundSize: '30px 30px',
    backgroundPosition: '0 0, 0 15px, 15px -15px, -15px 0px',
  }),
  // 11. Líneas Cruzadas (Patrón X, con más relleno)
  (color: string) => ({
     backgroundImage: `repeating-linear-gradient(45deg, ${color} 0, ${color} 2px, transparent 2px, transparent 10px), repeating-linear-gradient(-45deg, ${color} 0, ${color} 2px, transparent 2px, transparent 10px)`,
  }),
  // 12. Ondas Suaves (Área Rellena)
  (color: string) => ({
     backgroundImage: `radial-gradient(circle at 100% 100%, transparent 14px, ${color} 15px), radial-gradient(circle at 0 0, transparent 14px, ${color} 15px), radial-gradient(circle at 100% 0, transparent 14px, ${color} 15px), radial-gradient(circle at 0 100%, transparent 14px, ${color} 15px)`,
     backgroundSize: '30px 30px',
  }),
  // 13. Círculos Concéntricos
  (color: string) => ({
    backgroundImage: `radial-gradient(circle, ${color} 2px, transparent 3px), radial-gradient(circle, ${color} 2px, transparent 3px)`,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 10px 10px',
  }),
  // 14. Ladrillos (Bricks)
  (color: string) => ({
    backgroundImage: `linear-gradient(335deg, ${color} 23px, transparent 23px), linear-gradient(155deg, ${color} 23px, transparent 23px), linear-gradient(335deg, ${color} 23px, transparent 23px), linear-gradient(155deg, ${color} 23px, transparent 23px)`,
    backgroundSize: '58px 58px',
    backgroundPosition: '0px 2px, 4px 35px, 29px 31px, 34px 6px',
  }),
  // 15. Escalones (Steps)
  (color: string) => ({
    backgroundImage: `linear-gradient(to right, ${color} 2px, transparent 2px), linear-gradient(to bottom, ${color} 2px, transparent 2px)`,
    backgroundSize: '20px 20px',
  }),
  // 16. Ondas Verticales
  (color: string) => ({
    backgroundImage: `radial-gradient(circle at 50% 0, ${color} 5px, transparent 6px), radial-gradient(circle at 50% 100%, ${color} 5px, transparent 6px)`,
    backgroundSize: '20px 15px',
  }),
  // 17. Plaid / Tartan
  (color: string) => ({
    backgroundImage: `linear-gradient(${color} 2px, transparent 2px), linear-gradient(90deg, ${color} 2px, transparent 2px), linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
    backgroundSize: '40px 40px, 40px 40px, 10px 10px, 10px 10px',
    backgroundPosition: '-2px -2px, -2px -2px, -1px -1px, -1px -1px',
  }),
  // 18. Cubos 3D
  (color: string, darkColor: string) => ({
    backgroundImage: `linear-gradient(45deg, ${darkColor} 50%, ${color} 50%)`,
    backgroundSize: '20px 20px',
  }),
  // 19. Pirámides
  (color: string, darkColor: string) => ({
    backgroundImage: `linear-gradient(45deg, ${darkColor} 50%, transparent 50%), linear-gradient(135deg, transparent 50%, ${darkColor} 50%)`,
    backgroundSize: '20px 20px',
  }),
  // 20. Tejido (Woven)
  (color: string, darkColor: string) => ({
    backgroundImage: `linear-gradient(0deg, ${color} 50%, transparent 50%), linear-gradient(90deg, ${darkColor} 50%, transparent 50%)`,
    backgroundSize: '20px 20px',
  }),
  // 21. Círculos Solapados
  (color: string) => ({
    backgroundImage: `radial-gradient(circle, ${color} 10px, transparent 11px)`,
    backgroundSize: '25px 25px',
  }),
  // 22. Acolchado
  (color: string, darkColor: string) => ({
    backgroundImage: `linear-gradient(45deg, ${darkColor} 25%, transparent 25%, transparent 75%, ${darkColor} 75%, ${darkColor}), linear-gradient(45deg, ${darkColor} 25%, transparent 25%, transparent 75%, ${darkColor} 75%, ${darkColor})`,
    backgroundSize: '30px 30px',
    backgroundPosition: '0 0, 15px 15px',
  }),
  // 23. Chevrons 3D
  (color: string, darkColor: string) => ({
    backgroundImage: `linear-gradient(45deg, ${color} 50%, transparent 50%), linear-gradient(135deg, ${darkColor} 50%, transparent 50%)`,
    backgroundSize: '30px 15px',
  }),
   // 24. Engranajes
  (color: string) => ({
    backgroundImage: `radial-gradient(circle at 0% 50%, ${color} 4px, transparent 5px), radial-gradient(circle at 100% 50%, ${color} 4px, transparent 5px)`,
    backgroundSize: '20px 20px',
  }),
  // 25. Ondas Cuadradas
  (color: string) => ({
    backgroundImage: `linear-gradient(45deg, ${color} 25%, transparent 25%), linear-gradient(135deg, ${color} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${color} 75%), linear-gradient(135deg, transparent 75%, ${color} 75%)`,
    backgroundSize: '20px 20px',
  }),
   // 26. Cubos Isométricos
  (color: string, darkColor: string) => ({
    backgroundImage: `
      linear-gradient(30deg, ${color} 12%, transparent 12.5%, transparent 87%, ${color} 87.5%, ${color}),
      linear-gradient(150deg, ${color} 12%, transparent 12.5%, transparent 87%, ${color} 87.5%, ${color}),
      linear-gradient(30deg, ${color} 12%, transparent 12.5%, transparent 87%, ${color} 87.5%, ${color}),
      linear-gradient(150deg, ${color} 12%, transparent 12.5%, transparent 87%, ${color} 87.5%, ${color}),
      linear-gradient(60deg, ${darkColor} 25%, transparent 25.5%, transparent 75%, ${darkColor} 75%, ${darkColor}),
      linear-gradient(60deg, ${darkColor} 25%, transparent 25.5%, transparent 75%, ${darkColor} 75%, ${darkColor})
    `,
    backgroundSize: '40px 70px',
    backgroundPosition: '0 0, 0 0, 20px 35px, 20px 35px, 0 0, 20px 35px',
  }),
   // 27. Ilusión Óptica
  (color: string) => ({
    backgroundImage: 'radial-gradient(circle at center, black 1px, transparent 1px), radial-gradient(circle at center, black 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 10px 10px',
    backgroundColor: color,
  }),
];

/**
 * Asigna un estilo único (color de fondo + patrón) a cada carpeta
 * basado en su ID y en el color primario del tema actual.
 */
const getUniqueFolderStyle = (id: number | string): React.CSSProperties => {
    const { raw } = getProcessColors(String(id));

    const patternColor = raw.medium;
    
    const numericId = typeof id === 'string' ? stringToHash(id) : id;
    const patternGenerator = patterns[numericId % patterns.length];
    
    const patternStyle = patternGenerator(patternColor, raw.dark); // Pasar un tono más oscuro para los patrones 3D
    
    return {
        backgroundColor: raw.light,
        ...patternStyle
    };
};

export const DecorativeFolder: React.FC<DecorativeFolderProps> = ({ patternId, className }) => {
  const [style, setStyle] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    setStyle(getUniqueFolderStyle(patternId));
  }, [patternId]);

  return (
    <div className={cn(className)} style={style} />
  );
};
