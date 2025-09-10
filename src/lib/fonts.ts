// src/lib/fonts.ts
import { Inter, Space_Grotesk, Source_Code_Pro, Roboto, Lato, Montserrat } from 'next/font/google';
import type { NextFont } from 'next/dist/compiled/@next/font';
import prisma from './prisma';
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
 * Gets the CSS variable class names for the fonts defined in the platform settings.
 * If settings are unavailable, it returns default fonts.
 * @returns A string containing the CSS variable classes for the fonts.
 */
export async function getFontVariables(): Promise<string> {
    try {
        const settings = await prisma.platformSettings.findFirst({
            select: { fontHeadline: true, fontBody: true }
        });
        const headlineFont = fontMap[settings?.fontHeadline || 'Space Grotesk'];
        const bodyFont = fontMap[settings?.fontBody || 'Inter'];
        return `${headlineFont.variable} ${bodyFont.variable}`;
    } catch (error) {
        console.error("Could not fetch font settings from DB, using defaults.", error);
        // Return default fonts if DB is not available
        return `${spaceGrotesk.variable} ${inter.variable}`;
    }
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
