'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  BookOpen,
  Library,
  Megaphone,
  Calendar,
  Settings,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavLink = {
  href: string;
  icon: React.ElementType;
  label: string;
  roles: string[];
};

const navLinks: NavLink[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['administrator', 'instructor', 'student'] },
  { href: '/courses', icon: BookOpen, label: 'Cursos', roles: ['administrator', 'instructor', 'student'] },
  { href: '/resources', icon: Library, label: 'Recursos', roles: ['administrator', 'instructor', 'student'] },
  { href: '/announcements', icon: Megaphone, label: 'Anuncios', roles: ['administrator', 'instructor', 'student'] },
  { href: '/calendar', icon: Calendar, label: 'Calendario', roles: ['administrator', 'instructor', 'student'] },
  { href: '/settings', icon: Settings, label: 'Ajustes', roles: ['administrator'] },
];

export default function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname();

  const getSubPath = (path: string) => `/${path.split('/')[1]}`;
  const currentSubPath = getSubPath(pathname);

  const filteredLinks = navLinks.filter(link => link.roles.includes(role));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold font-headline text-primary">
          <GraduationCap className="h-6 w-6" />
          <span>NexusAlpri</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start p-2 text-sm font-medium lg:px-4">
          <SidebarMenu>
            {filteredLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                <Link href={link.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    className={cn(
                      'justify-start',
                      getSubPath(link.href) === currentSubPath && 'bg-accent text-accent-foreground'
                    )}
                    isActive={getSubPath(link.href) === currentSubPath}
                    asChild
                  >
                    <a>
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </nav>
      </div>
    </div>
  );
}
