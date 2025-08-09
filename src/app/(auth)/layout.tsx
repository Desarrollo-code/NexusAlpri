// src/app/(auth)/layout.tsx
import { Footer } from '@/components/layout/footer';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 bg-muted/40">
        <main className="flex-1 flex w-full items-center justify-center">
            {children}
        </main>
        <Footer />
    </div>
  );
}
