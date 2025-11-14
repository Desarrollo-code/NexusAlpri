// src/components/layout/public-top-bar.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Info, LogIn } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '../ui/skeleton';

export function PublicTopBar() {
  const pathname = usePathname();
  const { settings, isLoading, user } = useAuth();

  const navItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/about', label: 'Nosotros', icon: Info },
  ];
  
  if (user) {
      return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-600">
      <div className="container mx-auto flex items-center justify-between px-4 lg:px-6 h-20">
        <div className="flex items-center justify-start flex-1">
          <Link href="/" className="flex items-center justify-center gap-3" prefetch={false}>
            <div className="relative w-14 h-14 flex-shrink-0 drop-shadow-md">
              {isLoading ? <Skeleton className="h-full w-full bg-white/20"/> :
                settings?.logoUrl ? (
                  <Image src={settings.logoUrl} alt="Logo" fill data-ai-hint="logo" quality={100} className="object-contain" />
              ) : (
                  <div className="w-full h-full rounded-md bg-muted" />
              )}
            </div>
            <span className="text-2xl font-bold font-headline tracking-wide whitespace-nowrap text-white">
              {isLoading ? <Skeleton className="h-7 w-40 bg-white/20"/> : settings?.platformName || 'NexusAlpri'}
            </span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center justify-center flex-1">
          <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm p-1 rounded-full shadow-sm border border-white/20">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Button key={item.href} variant="ghost" asChild className={cn(
                    "transition-colors rounded-full h-9 text-white/80 hover:text-white",
                    isActive 
                      ? "bg-white/10 text-white font-semibold shadow" 
                      : "hover:bg-white/20"
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
            <Button asChild className="hidden md:flex bg-white/90 text-slate-900 hover:bg-white shadow-md">
            <Link href="/sign-in">
                Acceder
            </Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
