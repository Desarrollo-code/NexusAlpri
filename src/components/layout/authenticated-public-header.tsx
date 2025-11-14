// src/components/layout/authenticated-public-header.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutGrid } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '../ui/skeleton';

export function AuthenticatedPublicHeader() {
  const { settings, user, isLoading } = useAuth();

  // Solo mostrar esta barra si el usuario está autenticado
  if (!user && !isLoading) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background border-b shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 lg:px-6 h-20">
        <div className="flex items-center justify-start flex-1">
          <Link href="/dashboard" className="flex items-center justify-center gap-3" prefetch={false}>
            <div className={cn("w-12 h-12 flex items-center justify-center flex-shrink-0 rounded-lg relative overflow-hidden", !settings?.logoUrl && "p-2 bg-muted")}>
              {isLoading ? <Skeleton className="h-full w-full" /> : 
                settings?.logoUrl ? <div className="relative w-full h-full"><Image src={settings.logoUrl} alt="Logo" fill data-ai-hint="logo" quality={100} className="object-contain p-1" /></div> : <div className="w-full h-full rounded-md bg-muted" />
              }
            </div>
            <span className="text-xl font-bold font-headline tracking-wide whitespace-nowrap text-foreground">
              {isLoading ? <Skeleton className="h-6 w-32" /> : settings?.platformName || 'NexusAlpri'}
            </span>
          </Link>
        </div>
        
        <div className="flex items-center justify-end flex-1">
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-transparent hover:scale-105 transition-transform shadow-lg shadow-primary/20">
            <Link href="/dashboard">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Ir al Panel Principal
            </Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
