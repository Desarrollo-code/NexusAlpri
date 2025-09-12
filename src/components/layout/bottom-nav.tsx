// src/components/layout/bottom-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Info, UserCircle, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/about', label: 'Nosotros', icon: Info },
  { href: '/sign-in', label: 'Acceder', icon: LogIn },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // No mostrar la barra de navegación pública si el usuario está autenticado
  if (user) {
    return null;
  }
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-sm border-t z-50 shadow-[0_-5px_15px_-5px_hsl(var(--foreground)_/_0.1)]">
      <div className="mx-auto flex h-full max-w-md items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-full h-full text-sm font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className={cn(
                  "text-xs transition-opacity",
                  isActive ? "opacity-100" : "opacity-100" // Siempre mostramos el texto
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
