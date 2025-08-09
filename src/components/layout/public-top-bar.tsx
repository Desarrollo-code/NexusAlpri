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
        "bg-card/80 dark:bg-background/80 backdrop-blur-sm border-b"
    )}>
      <Link href="/" className="flex items-center justify-center gap-3" prefetch={false}>
         <div className="w-10 h-10 bg-card dark:bg-white/20 flex items-center justify-center shadow-inner flex-shrink-0 rounded-lg">
          <Image src="/uploads/images/logo-nexusalpri.png" alt="Logo" width={50} height={50} data-ai-hint="logo"/>
        </div>
        <span className="text-xl font-bold font-headline-alt tracking-wide whitespace-nowrap text-primary dark:text-foreground">
           {settings?.platformName || 'NexusAlpri'}
        </span>
      </Link>
      
      <nav className="hidden md:flex items-center gap-2 p-2 rounded-full bg-card/80 backdrop-blur-sm border">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
             <Button key={item.href} variant="ghost" asChild className={cn(
                 "rounded-full transition-colors",
                 "text-muted-foreground hover:bg-muted/50 hover:text-primary",
                 isActive && "text-primary"
             )}>
                <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                </Link>
             </Button>
          )
        })}
      </nav>
      
      <Button asChild className="hidden md:flex">
        <Link href="/sign-in">
            <LogIn className="mr-2 h-4 w-4"/>
            Acceder
        </Link>
      </Button>
    </header>
  );
}
