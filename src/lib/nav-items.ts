
import type { NavItem, UserRole } from '@/types';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Folder,
  Megaphone,
  Users,
  Settings,
  BookMarked,
  ShieldCheck,
  TrendingUp,
  CalendarDays,
  ShieldAlert,
} from 'lucide-react';


const navItems: NavItem[] = [
      {
        href: '/dashboard',
        label: 'Panel Principal',
        icon: LayoutDashboard,
        roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT'],
      },
      {
        href: '/courses',
        label: 'Catálogo de Cursos',
        icon: BookOpen,
        roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT'],
      },
      {
        href: '/my-courses',
        label: 'Mis Cursos',
        icon: GraduationCap,
        roles: ['STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR'],
      },
      {
        href: '/resources',
        label: 'Recursos Empresa',
        icon: Folder,
        roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT'],
      },
      {
        href: '/announcements',
        label: 'Anuncios',
        icon: Megaphone,
        roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT'],
      },
      {
        href: '/calendar',
        label: 'Calendario',
        icon: CalendarDays,
        roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT'],
      },
      {
        label: 'Administración',
        href: '#', // Required for key, not used for navigation
        icon: ShieldCheck,
        roles: ['ADMINISTRATOR', 'INSTRUCTOR'],
        subItems: [
            { href: '/manage-courses', label: 'Gestionar Cursos', icon: BookMarked, roles: ['ADMINISTRATOR', 'INSTRUCTOR'] },
            { href: '/enrollments', label: 'Inscritos y Progreso', icon: TrendingUp, roles: ['ADMINISTRATOR', 'INSTRUCTOR'] },
            { href: '/users', label: 'Gestión de Usuarios', icon: Users, roles: ['ADMINISTRATOR'] },
            { href: '/security-audit', label: 'Auditoría de Seguridad', icon: ShieldAlert, roles: ['ADMINISTRATOR'] },
            { href: '/settings', label: 'Configuración', icon: Settings, roles: ['ADMINISTRATOR'] },
        ]
    }
];


export const getNavItemsForRole = (role: UserRole): NavItem[] => {
  return navItems
    .filter(item => item.roles.includes(role))
    .map(item => {
        if (item.subItems) {
            return {
                ...item,
                subItems: item.subItems.filter(sub => sub.roles.includes(role))
            }
        }
        return item;
    })
    .filter(item => !item.subItems || item.subItems.length > 0);
};
