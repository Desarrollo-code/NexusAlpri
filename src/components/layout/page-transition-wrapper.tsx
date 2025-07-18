
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== lastPathname.current) {
      // Check if View Transitions API is supported
      // @ts-ignore
      if (document.startViewTransition) {
        // @ts-ignore
        document.startViewTransition(() => {});
      }
      lastPathname.current = pathname;
    }
  }, [pathname]);

  return (
    <div style={{ viewTransitionName: 'page-content' }}>
      {children}
    </div>
  );
}
