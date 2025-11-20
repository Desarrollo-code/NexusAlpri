// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { MotivationalMessageTriggerType } from '@/types';
import { colord, extend } from "colord";
import lchPlugin from "colord/plugins/lch";

extend([lchPlugin]);


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convierte un color hexadecimal a un objeto RGB.
 * @param hex El color en formato hexadecimal (ej. #RRGGBB).
 * @returns Un objeto {r, g, b} o null si el formato es inválido.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calcula el brillo relativo de un color según la fórmula de W3C.
 * @param r Componente rojo (0-255).
 * @param g Componente verde (0-255).
 * @param b Componente azul (0-255).
 * @returns El valor de luminancia (0-255).
 */
function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b);
}

/**
 * Elige blanco o negro como color de texto basado en el color de fondo para asegurar buen contraste.
 * @param backgroundColor El color de fondo en formato hexadecimal.
 * @returns 'white' o 'black'.
 */
export function getContrastingTextColor(backgroundColor?: string | null): 'white' | 'black' {
  if (!backgroundColor) return 'black'; // Fallback
  
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return 'black'; // Fallback

  // El umbral de 128 es un punto medio común en el espacio de color de 0-255.
  // Colores con luminancia > 128 se consideran "claros", y < 128 "oscuros".
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 128 ? 'black' : 'white';
}

/**
 * Convierte un color hexadecimal a una cadena HSL para variables CSS.
 * @param hex El color en formato hexadecimal.
 * @returns Una cadena "H S% L%" o null.
 */
export function hexToHslString(hex?: string | null): string | null {
    if (!hex) return null;
    const rgb = hexToRgb(hex);
    if (!rgb) return null;

    let { r, g, b } = rgb;
    r /= 255; g /= 255; b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
}


/**
 * Get user initials from name or role.
 * @param name User's full name or role string
 * @returns User's initials
 */
export const getInitials = (name?: string | null): string => {
  if (!name) return '??';
  const names = name.trim().split(/\s+/); // Use regex to handle multiple spaces
  if (names.length > 1 && names[0] && names[names.length - 1]) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  if (names.length === 1 && names[0]) {
    return names[0].substring(0, 2).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Gets a descriptive label for a motivational message trigger.
 * @param triggerType The type of the trigger.
 * @param triggerEntity The associated entity (course or custom object for level).
 * @returns A user-friendly string describing the trigger.
 */
export const getMotivationalTriggerLabel = (
  triggerType: MotivationalMessageTriggerType,
  triggerEntity?: { title: string } | null
): string => {
  const labels: Record<MotivationalMessageTriggerType, string> = {
    COURSE_ENROLLMENT: "Al inscribirse a:",
    COURSE_MID_PROGRESS: "Al 50% del curso:",
    COURSE_NEAR_COMPLETION: "Al 90% del curso:",
    COURSE_COMPLETION: "Al completar el curso:",
    LEVEL_UP: "Al alcanzar el:",
  };

  const baseLabel = labels[triggerType] || "Disparador desconocido:";
  
  if (triggerEntity?.title) {
    return `${baseLabel} ${triggerEntity.title}`;
  }

  return baseLabel.replace(':', '');
};

const stringToHash = (str: string): number => {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

export const getProcessColors = (id: string) => {
    const hash = stringToHash(id);

    // Obtener el color primario del tema actual desde las variables CSS
    const rootStyle = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
    const primaryColorHsl = rootStyle?.getPropertyValue('--primary').trim() || '223 90% 55%';
    const [h, s, l] = primaryColorHsl.split(' ').map(parseFloat);
    const primaryColor = colord(`hsl(${h}, ${s}%, ${l}%)`);

    // Rotar el tono (hue) para obtener un color análogo
    const hueRotation = (hash % 12) * 15; // Múltiplos de 15 para colores distintos pero relacionados
    const generatedColor = primaryColor.rotate(hueRotation);

    // Convertir a LCH para un ajuste de luminosidad y croma más predecible
    const lchColor = generatedColor.toLch();

    // Asegurar que el color claro para el fondo sea legible
    const lightBgL = Math.max(90, lchColor.l + (95 - lchColor.l) * 0.5);
    const lightBgC = Math.max(20, lchColor.c * 0.4);
    const lightColor = colord({ l: lightBgL, c: lightBgC, h: lchColor.h }).toHex();
    
    // El color de texto se decide en base al fondo claro
    const textColor = getContrastingTextColor(lightColor);

    return {
        bgColor: `bg-[${lightColor}]`,
        textColor: textColor === 'white' ? 'text-white' : 'text-black',
        borderColor: `border-[${generatedColor.toHex()}]`,
        raw: {
            light: lightColor,
            medium: generatedColor.toHex(),
            dark: textColor === 'white' ? '#FFFFFF' : '#000000',
        }
    };
};

export const parseUserAgent = (userAgent: string | null | undefined): { browser: string; os: string } => {
    if (!userAgent) return { browser: 'Desconocido', os: 'Desconocido' };
    
    let browser = 'Desconocido';
    let os = 'Desconocido';

    // OS detection
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    // Browser detection
    if (userAgent.includes('Edg/')) browser = 'Edge';
    else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) browser = 'Chrome';
    else if (userAgent.includes('Firefox/')) browser = 'Firefox';
    else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) browser = 'Safari';

    return { browser, os };
};


export const getEventColorClass = (color?: string): string => {
  const colorMap: Record<string, string> = {
    blue: 'bg-event-blue',
    green: 'bg-event-green',
    red: 'bg-event-red',
    orange: 'bg-event-orange',
  };
  return colorMap[color as string] || 'bg-primary';
};

/**
 * Formats a date into a "time since" string.
 * @param date The date to format.
 * @returns A string like "Ahora", "Hace 5 seg.", "Hace 10 min.", etc.
 */
export const timeSince = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `Hace ${Math.floor(interval)}a`;
  interval = seconds / 2592000;
  if (interval > 1) return `Hace ${Math.floor(interval)}m`;
  interval = seconds / 86400;
  if (interval > 1) return `Hace ${Math.floor(interval)}d`;
  interval = seconds / 3600;
  if (interval > 1) return `Hace ${Math.floor(interval)}h`;
  interval = seconds / 60;
  if (interval > 1) return `Hace ${Math.floor(interval)} min`;
  return `Hace ${Math.floor(seconds)} seg`;
};

export const formatFileSize = (bytes: number | null | undefined): string => {
    if (bytes === null || bytes === undefined || bytes === 0) {
        return '-';
    }
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}
