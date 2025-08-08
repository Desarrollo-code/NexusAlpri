// src/components/layout/public-top-bar.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Info, LogIn, BookOpenCheck } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export function PublicTopBar() {
  const pathname = usePathname();
  const { settings, user } = useAuth();

  const navItems = [
    { href: '/', label: 'Inicio' },
    { href: '/courses', label: 'Cursos' },
    { href: '/about', label: 'Nosotros' },
  ];
  
  if (user) {
      return null;
  }

  return (
    <header className={cn(
        "px-4 lg:px-6 h-20 flex items-center justify-between sticky top-0 z-50",
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
                <Link href={item.href}>{item.label}</Link>
             </Button>
          )
        })}
      </nav>
      <Button asChild>
        <Link href="/sign-in">Acceder</Link>
      </Button>
    </header>
  );
}
