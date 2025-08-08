// src/components/layout/public-top-bar.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Info, LogIn } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export function PublicTopBar() {
  const pathname = usePathname();
  const { settings, user } = useAuth();

  const navItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/about', label: 'Nosotros', icon: Info },
  ];
  
  // No mostrar esta barra si el usuario está autenticado.
  if (user) {
      return null;
  }

  // Ocultar esta barra en móvil, ya que BottomNav se encarga de ello.
  return (
    <header className={cn(
        "hidden md:flex items-center justify-between px-4 lg:px-6 h-20 sticky top-0 z-50",
        "bg-background/80 backdrop-blur-sm border-b"
    )}>
      <Link href="/" className="flex items-center justify-center gap-3" prefetch={false}>
         <div className="w-10 h-10 bg-card flex items-center justify-center shadow-inner flex-shrink-0 rounded-lg">
          <Image src="/uploads/images/logo-nexusalpri.png" alt="Logo" width={50} height={50} data-ai-hint="logo"/>
        </div>
        <span className="text-xl font-bold font-headline-alt tracking-wide whitespace-nowrap text-primary dark:text-white">
           {settings?.platformName || 'NexusAlpri'}
        </span>
      </Link>
      
      <nav className="hidden items-center gap-2 sm:gap-4 lg:flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
             <Button key={item.href} variant={isActive ? "secondary" : "ghost"} asChild>
                <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                </Link>
             </Button>
          )
        })}
      </nav>
      
      <Button asChild>
        <Link href="/sign-in">
            <LogIn className="mr-2 h-4 w-4"/>
            Acceder
        </Link>
      </Button>
    </header>
  );
}
