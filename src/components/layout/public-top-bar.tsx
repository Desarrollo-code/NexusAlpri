// src/components/layout/public-top-bar.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Info, LogIn } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function PublicTopBar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/courses', label: 'Classroom' },
    { href: '/about', label: 'About' },
  ];

  return (
    <header className={cn(
        "px-4 lg:px-6 h-20 flex items-center justify-between sticky top-0 z-50",
        "bg-background/80 backdrop-blur-sm"
    )}>
      <Link href="/" className="flex items-center justify-center gap-3" prefetch={false}>
        <span className="text-xl font-bold font-headline text-foreground">
          Online Learning
        </span>
      </Link>
      <nav className="hidden items-center gap-2 sm:gap-4 lg:flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
             <Button key={item.href} variant={isActive ? "default" : "secondary"} asChild>
                <Link href={item.href}>{item.label}</Link>
             </Button>
          )
        })}
      </nav>
      <Button variant="outline" asChild>
        <Link href="/sign-in">Contact</Link>
      </Button>
    </header>
  );
}
