// src/lib/color.ts
import { colord, extend } from 'colord';
import lchPlugin from 'colord/plugins/lch';

// Registra el plugin LCH una sola vez a nivel de módulo.
// Esto asegura que estará disponible para cualquier función que importe `colord` desde este archivo.
extend([lchPlugin]);

// Exporta la instancia de colord ya extendida para que sea usada en toda la app.
export { colord };
