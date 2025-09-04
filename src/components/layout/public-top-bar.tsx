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
    <header className={cn(
        "relative top-0 left-0 right-0 z-40",
        "bg-transparent"
    )}>
      {/* Desktop Top Bar */}
      <div className="flex items-center justify-between px-4 lg:px-6 h-20">
        <Link href="/" className="flex items-center justify-center gap-3" prefetch={false}>
          <div className={cn("w-12 h-12 bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-inner flex-shrink-0 rounded-lg relative overflow-hidden", !settings?.logoUrl && "p-2")}>
            {settings?.logoUrl ? <div className="relative w-full h-full"><Image src={settings.logoUrl} alt="Logo" fill data-ai-hint="logo" className="object-contain p-1" quality={100}/></div> : <div className="w-full h-full rounded-md bg-muted" />}
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
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center px-4 h-16 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
          <Link href="/" className="flex items-center justify-center gap-3" prefetch={false}>
            <div className={cn("w-10 h-10 bg-white/20 flex items-center justify-center shadow-inner flex-shrink-0 rounded-lg relative overflow-hidden p-1")}>
              {settings?.logoUrl ? <div className="relative w-full h-full"><Image src={settings.logoUrl} alt="Logo" fill data-ai-hint="logo" className="object-contain" quality={100}/></div> : <div className="w-full h-full rounded-md bg-muted" />}
            </div>
            <span className="text-lg font-bold font-headline-alt tracking-wide whitespace-nowrap">
              {settings?.platformName || 'NexusAlpri'}
            </span>
        </Link>
      </div>
    </header>
  );
}
