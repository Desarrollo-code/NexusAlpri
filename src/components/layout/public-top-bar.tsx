
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
  const { settings } = useAuth();

  const navItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/about', label: 'Nosotros', icon: Info },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 dark:from-blue-800 dark:via-blue-900 dark:to-blue-950 backdrop-blur-sm border-b border-blue-800/80 dark:border-blue-700/80">
      <div className="container mx-auto flex items-center justify-between px-4 lg:px-6 h-20">
        <div className="flex items-center justify-start flex-1">
          <Link href="/" className="flex items-center justify-center gap-3" prefetch={false}>
            <div className={cn("w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-lg relative overflow-hidden", !settings?.logoUrl && "p-2 bg-white/20")}>
              {settings?.logoUrl ? <div className="relative w-full h-full"><Image src={settings.logoUrl} alt="Logo" fill data-ai-hint="logo" className="object-contain p-1" /></div> : <div className="w-full h-full rounded-md bg-muted" />}
            </div>
            <span className="text-xl font-bold font-headline tracking-wide whitespace-nowrap text-white">
              {settings?.platformName || 'NexusAlpri'}
            </span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center justify-center flex-1">
          <div className="flex items-center gap-1 bg-white/10 rounded-full p-1 shadow-sm">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Button key={item.href} variant="ghost" asChild className={cn(
                    "transition-colors rounded-full h-9",
                    isActive 
                      ? "bg-white/90 text-blue-800 font-semibold shadow" 
                      : "text-white/80 hover:bg-white/20 hover:text-white"
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
            <Button asChild variant="outline" className="hidden md:flex bg-white/90 hover:bg-white text-blue-800 border-transparent hover:scale-105 transition-transform">
            <Link href="/sign-in">
                Acceder
            </Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
