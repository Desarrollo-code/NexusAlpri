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
        "fixed md:relative top-0 left-0 right-0 flex items-center justify-between px-4 lg:px-6 h-20 z-40",
        "bg-transparent backdrop-blur-sm border-b border-white/10"
    )}>
      <Link href="/" className="flex items-center justify-center gap-3" prefetch={false}>
         <div className="w-14 h-14 bg-card dark:bg-white/20 flex items-center justify-center shadow-inner flex-shrink-0 rounded-lg">
          <Image src="/uploads/images/logo-nexusalpri.png" alt="Logo" width={60} height={60} data-ai-hint="logo"/>
        </div>
        <span className="text-xl font-bold font-headline-alt tracking-wide whitespace-nowrap text-foreground">
           {settings?.platformName || 'NexusAlpri'}
        </span>
      </Link>
      
      <nav className="hidden md:flex items-center gap-2 p-2 rounded-full bg-foreground/5 backdrop-blur-sm border border-foreground/10">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
             <Button key={item.href} variant="ghost" asChild className={cn(
                 "rounded-full transition-colors",
                 "text-foreground/70 hover:bg-foreground/10 hover:text-foreground",
                 isActive && "text-foreground bg-foreground/10"
             )}>
                <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                </Link>
             </Button>
          )
        })}
      </nav>
      
      <Button asChild className="hidden md:flex btn-primary-gradient">
        <Link href="/sign-in">
            <LogIn className="mr-2 h-4 w-4"/>
            Acceder
        </Link>
      </Button>
    </header>
  );
}
