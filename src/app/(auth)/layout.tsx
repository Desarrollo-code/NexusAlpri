// src/app/(auth)/layout.tsx
// Este layout ahora hereda del layout público para mantener la consistencia.
import PublicLayout from '@/app/(public)/layout';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicLayout>
        <div className="w-full max-w-md">
            {children}
        </div>
    </PublicLayout>
  );
}
