// src/lib/fonts.ts
import { Inter, Space_Grotesk, Source_Code_Pro, Roboto, Lato, Montserrat } from 'next/font/google';
import type { NextFont } from 'next/dist/compiled/@next/font';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-headline' });

export const fontMap: { [key: string]: NextFont } = {
  'Inter': inter,
  'Space Grotesk': spaceGrotesk,
};

/**
 * Gets the CSS variable class names for the given font names.
 * @returns A string containing the CSS variable classes for the fonts.
 */
export function getFontVariables(): string {
    const headlineFont = spaceGrotesk;
    const bodyFont = inter;

    return `${headlineFont.variable} ${bodyFont.variable}`;
}
