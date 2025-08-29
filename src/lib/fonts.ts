
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

const getDefaultFontVariables = (): string => {
    return `${spaceGrotesk.variable} ${inter.variable}`;
}

export async function getFontVariables(): Promise<string> {
  try {
    // Intenta conectar explícitamente para fallar rápido si la DB no está disponible.
    // Esto evita que la aplicación se bloquee en producción si la BD tiene un problema temporal.
    await prisma.$connect();
    const settings = await prisma.platformSettings.findFirst();
    await prisma.$disconnect();

    const headlineFontName = settings?.fontHeadline || 'Space Grotesk';
    const bodyFontName = settings?.fontBody || 'Inter';

    const headlineFont = fontMap[headlineFontName] || spaceGrotesk;
    const bodyFont = fontMap[bodyFontName] || inter;

    // Retorna las clases variables para ser usadas en el body
    return `${headlineFont.variable} ${bodyFont.variable}`;

  } catch (error) {
    console.error("Error al conectar a la DB para obtener fuentes, usando valores por defecto.", error);
    // En caso de error de conexión, desconecta si es posible y retorna las fuentes por defecto.
    await prisma.$disconnect().catch(() => {});
    return getDefaultFontVariables();
  }
}
