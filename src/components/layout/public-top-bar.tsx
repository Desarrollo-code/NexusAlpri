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
  const { settings, isLoading, user } = useAuth();

  const navItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/about', label: 'Nosotros', icon: Info },
  ];
  
  if (isLoading || user) {
      return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background border-b">
      <div className="container mx-auto flex items-center justify-between px-4 lg:px-6 h-24">
        <div className="flex items-center justify-start flex-1">
          <Link href="/" className="flex items-center justify-center gap-3" prefetch={false}>
            <div className={cn("w-12 h-12 flex items-center justify-center flex-shrink-0 rounded-lg relative overflow-hidden bg-muted")}>
              {settings?.logoUrl ? (
                  <div className="relative w-full h-full">
                      <Image src={settings.logoUrl} alt="Logo" fill data-ai-hint="logo" quality={100} className="object-contain p-1" />
                  </div>
              ) : (
                  <div className="w-full h-full rounded-md bg-muted" />
              )}
            </div>
            <span className="text-xl font-bold font-headline tracking-wide whitespace-nowrap text-foreground">
              {settings?.platformName || 'NexusAlpri'}
            </span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center justify-center flex-1">
          <div className="flex items-center gap-1 bg-muted/50 backdrop-blur-sm p-1 rounded-full shadow-sm border">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Button key={item.href} variant="ghost" asChild className={cn(
                    "transition-colors rounded-full h-9",
                    isActive 
                      ? "bg-background text-foreground font-semibold shadow" 
                      : "hover:bg-background/50"
                )}>
                    <Link href={item.href}>
                        {item.label}
                    </Link>
                </Button>
              )
            })}
          </div>
        </nav>
        
        <div className="flex items-center justify-end flex-1">
            <Button asChild className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
            <Link href="/sign-in">
                Acceder
            </Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
