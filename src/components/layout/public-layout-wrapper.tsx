'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { PublicTopBar } from '@/components/layout/public-top-bar';
import { cn } from '@/lib/utils';

export function PublicLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isPublicPage = !pathname.startsWith('/dashboard') && 
                       !pathname.startsWith('/courses/') &&
                       !pathname.startsWith('/my-courses') &&
                       !pathname.startsWith('/manage-courses') &&
                       !pathname.startsWith('/resources') &&
                       !pathname.startsWith('/announcements') &&
                       !pathname.startsWith('/calendar') &&
                       !pathname.startsWith('/profile') &&
                       !pathname.startsWith('/settings') &&
                       !pathname.startsWith('/users') &&
                       !pathname.startsWith('/analytics') &&
                       !pathname.startsWith('/security-audit') &&
                       !pathname.startsWith('/enrollments') &&
                       !pathname.startsWith('/notifications');

  return (
    <>
      {isPublicPage && <PublicTopBar />}
      <div className={cn("flex-1 flex flex-col w-full", !isPublicPage && "h-screen")}>
        {children}
      </div>
    </>
  );
}