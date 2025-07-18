
import type {Metadata} from 'next';
import { Poppins } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-body',
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
      <body className={`${poppins.variable} font-body antialiased`}>
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
