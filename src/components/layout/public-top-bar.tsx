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
  
  // No mostrar esta barra si el usuario está logueado o si aún está cargando la sesión.
  if (isLoading || user) {
      return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-blue-900 via-blue-700 to-blue-900 backdrop-blur-sm border-b border-blue-700/80">
      <div className="container mx-auto flex items-center justify-between px-4 lg:px-6 h-20">
        <div className="flex items-center justify-start flex-1">
          <Link href="/" className="flex items-center justify-center gap-3" prefetch={false}>
            <div className={cn("w-12 h-12 flex items-center justify-center flex-shrink-0 rounded-lg relative overflow-hidden", !settings?.logoUrl && "p-2 bg-white/20")}>
              {settings?.logoUrl ? <div className="relative w-full h-full"><Image src={settings.logoUrl} alt="Logo" fill data-ai-hint="logo" quality={100} className="object-contain p-1" /></div> : <div className="w-full h-full rounded-md bg-muted" />}
            </div>
            <span className="text-xl font-bold font-headline tracking-wide whitespace-nowrap !text-white">
              {settings?.platformName || 'NexusAlpri'}
            </span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center justify-center flex-1">
          <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 shadow-sm">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Button key={item.href} variant="ghost" asChild className={cn(
                    "transition-colors rounded-full h-9",
                    isActive 
                      ? "bg-amber-400 text-gray-900 font-semibold shadow" 
                      : "text-white/80 hover:bg-white/10 hover:text-white"
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
            <Button asChild className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white font-bold border-transparent hover:scale-105 transition-transform shadow-lg shadow-blue-500/20">
            <Link href="/sign-in">
                Acceder
            </Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
