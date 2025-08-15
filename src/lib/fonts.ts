// src/lib/fonts.ts
import { Inter, Space_Grotesk, Source_Code_Pro, Roboto, Lato, Montserrat } from 'next/font/google';
import prisma from './prisma';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-space-grotesk' });
const sourceCodePro = Source_Code_Pro({ subsets: ['latin'], variable: '--font-source-code-pro' });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-roboto' });
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-lato' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });

export const fontMap: { [key: string]: { variable: string } } = {
  'Inter': inter,
  'Space Grotesk': spaceGrotesk,
  'Source Code Pro': sourceCodePro,
  'Roboto': roboto,
  'Lato': lato,
  'Montserrat': montserrat,
};

export async function getFontVariables() {
  try {
    const settings = await prisma.platformSettings.findFirst();
    const headlineFont = settings?.fontHeadline || 'Space Grotesk';
    const bodyFont = settings?.fontBody || 'Inter';

    const headlineFontData = fontMap[headlineFont] || spaceGrotesk;
    const bodyFontData = fontMap[bodyFont] || inter;

    return `${headlineFontData.variable} ${bodyFontData.variable}`;

  } catch (error) {
    console.error("Failed to fetch font settings, using defaults.", error);
    // Return default font variables in case of an error
    return `${spaceGrotesk.variable} ${inter.variable}`;
  }
}
