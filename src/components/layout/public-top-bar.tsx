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

  return (
    <header className={cn(
        "relative top-0 left-0 right-0 flex items-center justify-between px-4 lg:px-6 h-20 z-40",
        "bg-transparent"
    )}>
      <Link href="/" className="flex items-center justify-center gap-3" prefetch={false}>
         <div className={cn("w-12 h-12 bg-card dark:bg-white/20 flex items-center justify-center shadow-inner flex-shrink-0 rounded-lg", !settings?.logoUrl && "p-2")}>
          <Image src={settings?.logoUrl || "/uploads/images/logo-nexusalpri.png"} alt="Logo" width={48} height={48} data-ai-hint="logo" style={{objectFit: 'contain'}}/>
        </div>
        <span className="text-xl font-bold font-headline-alt tracking-wide whitespace-nowrap text-foreground">
           {settings?.platformName || 'NexusAlpri'}
        </span>
      </Link>
      
      <nav className="hidden md:flex items-center gap-2 p-1 rounded-full bg-background/50 backdrop-blur-sm border border-border">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
             <Button key={item.href} variant={isActive ? "secondary" : "ghost"} asChild className={cn(
                 "rounded-full transition-colors",
             )}>
                <Link href={item.href}>
                    {item.label}
                </Link>
             </Button>
          )
        })}
      </nav>
      
      <Button asChild className="hidden md:flex" variant="default">
        <Link href="/sign-in">
            Acceder
        </Link>
      </Button>
    </header>
  );
}
