
import type {Metadata} from 'next';
import { Inter, Space_Grotesk, Source_Code_Pro } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-headline',
});

const sourceCodePro = Source_Code_Pro({
    subsets: ['latin'],
    variable: '--font-code',
});

export const metadata: Metadata = {
  title: 'NexusAlpri',
  description: 'La plataforma e-learning corporativa esencial para nuestra microempresa.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${sourceCodePro.variable} font-body antialiased`}>
        <AuthProvider>
          <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            {children}
            <Toaster />
          </NextThemesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
