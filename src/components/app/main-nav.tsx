'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import UserNav from './user-nav';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const getPathLabel = (path: string) => {
  switch (path) {
    case 'dashboard': return 'Dashboard';
    case 'courses': return 'Cursos';
    case 'resources': return 'Recursos';
    case 'announcements': return 'Anuncios';
    case 'calendar': return 'Calendario';
    case 'settings': return 'Ajustes';
    default: return 'NexusAlpri';
  }
}

export default function MainNav({ role }: { role: string }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <>
      <div className="hidden flex-col items-start gap-2 sm:flex">
         <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {segments.map((segment, index) => {
                  const href = `/${segments.slice(0, index + 1).join('/')}`;
                  const isLast = index === segments.length - 1;
                  return (
                    <BreadcrumbItem key={href}>
                       <BreadcrumbSeparator />
                      <BreadcrumbLink asChild>
                        {isLast ? (
                           <BreadcrumbPage className="capitalize">{getPathLabel(segment)}</BreadcrumbPage>
                        ) : (
                          <Link href={href} className="capitalize">{getPathLabel(segment)}</Link>
                        )}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  )
              })}
            </BreadcrumbList>
          </Breadcrumb>
      </div>
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar..."
          className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px]"
        />
      </div>
      <UserNav role={role} />
    </>
  );
}
