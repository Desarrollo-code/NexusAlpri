// src/lib/fonts.ts
import { Inter, Space_Grotesk, Source_Code_Pro, Roboto, Lato, Montserrat } from 'next/font/google';
import type { NextFont } from 'next/dist/compiled/@next/font';
import prisma from '@/lib/prisma';
import type { PlatformSettings } from '@/types';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-headline' });
const sourceCodePro = Source_Code_Pro({ subsets: ['latin'], variable: '--font-body' });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-body' });
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-body' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-headline' });


export const fontMap: { [key: string]: NextFont } = {
  'Inter': inter,
  'Space Grotesk': spaceGrotesk,
  'Source Code Pro': sourceCodePro,
  'Roboto': roboto,
  'Lato': lato,
  'Montserrat': montserrat,
};

/**
 * Gets the CSS variable class names for the default fonts.
 * This function NO LONGER queries the database to avoid blocking render.
 * The dynamic font application is handled client-side by the ThemeProvider.
 * @returns A string containing the CSS variable classes for the default fonts.
 */
export function getFontVariables(): string {
    // Return default fonts. The ThemeProvider will override them on the client if needed.
    const headlineFont = fontMap['Space Grotesk'];
    const bodyFont = fontMap['Inter'];
    return `${headlineFont.variable} ${bodyFont.variable}`;
}


// Nueva función para obtener solo la configuración de fuentes
export async function getFontSettings(): Promise<Pick<PlatformSettings, 'fontHeadline' | 'fontBody'>> {
    try {
        const settings = await prisma.platformSettings.findFirst({
            select: {
                fontHeadline: true,
                fontBody: true
            }
        });
        return {
            fontHeadline: settings?.fontHeadline || 'Space Grotesk',
            fontBody: settings?.fontBody || 'Inter'
        };
    } catch (error) {
        console.error("Failed to fetch font settings, using defaults:", error);
        return {
            fontHeadline: 'Space Grotesk',
            fontBody: 'Inter'
        };
    }
}
