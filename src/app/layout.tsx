
import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
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
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-body antialiased`}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </NextThemesProvider>
      </body>
    </html>
  );
}
