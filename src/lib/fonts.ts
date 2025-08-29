// src/lib/fonts.ts
import { Inter, Space_Grotesk, Source_Code_Pro, Roboto, Lato, Montserrat } from 'next/font/google';
import type { NextFont } from 'next/dist/compiled/@next/font';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-space-grotesk' });
const sourceCodePro = Source_Code_Pro({ subsets: ['latin'], variable: '--font-source-code-pro' });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-roboto' });
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-lato' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });

export const fontMap: { [key: string]: NextFont } = {
  'Inter': inter,
  'Space Grotesk': spaceGrotesk,
  'Source Code Pro': sourceCodePro,
  'Roboto': roboto,
  'Lato': lato,
  'Montserrat': montserrat,
};

/**
 * Gets the CSS variable class names for the given font names.
 * @param headlineFontName The name of the font for headlines.
 * @param bodyFontName The name of the font for body text.
 * @returns A string containing the CSS variable classes for the fonts.
 */
export function getFontVariables(headlineFontName?: string | null, bodyFontName?: string | null): string {
    const headlineFont = fontMap[headlineFontName || 'Space Grotesk'] || spaceGrotesk;
    const bodyFont = fontMap[bodyFontName || 'Inter'] || inter;

    return `${headlineFont.variable} ${bodyFont.variable}`;
}
