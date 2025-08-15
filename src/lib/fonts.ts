
// src/lib/fonts.ts
import { Inter, Space_Grotesk, Source_Code_Pro, Roboto, Lato, Montserrat } from 'next/font/google';
import prisma from './prisma';
import { NextFont } from 'next/dist/compiled/@next/font';

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

export async function getFontVariables(): Promise<string> {
  try {
    const settings = await prisma.platformSettings.findFirst();
    const headlineFontName = settings?.fontHeadline || 'Space Grotesk';
    const bodyFontName = settings?.fontBody || 'Inter';

    const headlineFont = fontMap[headlineFontName] || spaceGrotesk;
    const bodyFont = fontMap[bodyFontName] || inter;

    // Retorna las clases variables para ser usadas en el body
    return `${headlineFont.variable} ${bodyFont.variable}`;

  } catch (error) {
    console.error("Error al obtener las fuentes desde la BD, usando valores por defecto.", error);
    // En caso de error, retorna las fuentes por defecto para que la app no falle.
    return `${spaceGrotesk.variable} ${inter.variable}`;
  }
}
