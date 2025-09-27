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
  ShieldAlert,
  TrendingUp,
  CalendarDays,
  Shield,
  BarChart3,
  Bell,
  GitCommitHorizontal,
  LayoutGrid,
  Notebook,
  FileText,
  AlertTriangle, 
  ServerCrash, // Ícono para el error 500
  Trophy, // Ícono para Leaderboard
} from 'lucide-react';

const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Panel Principal',
    icon: LayoutGrid,
    path: '/dashboard',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']
  },
  {
    id: 'leaderboard',
    label: 'Progreso y Ranking',
    icon: Trophy,
    path: '/leaderboard',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']
  },
  {
    id: 'courses',
    label: 'Catálogo de Cursos',
    icon: BookOpen,
    path: '/courses',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT'],
  },
  {
    id: 'my-courses',
    label: 'Mis Cursos',
    icon: GraduationCap,
    path: '/my-courses',
    roles: ['STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR']
  },
  {
    id: 'my-notes',
    label: 'Mis Apuntes',
    icon: Notebook,
    path: '/my-notes',
    roles: ['STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR'],
  },
  {
    id: 'resources',
    label: 'Biblioteca',
    icon: Folder,
    path: '/resources',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']
  },
  {
    id: 'announcements',
    label: 'Anuncios',
    icon: Megaphone,
    path: '/announcements',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']
  },
  {
    id: 'calendar',
    label: 'Calendario',
    icon: CalendarDays,
    path: '/calendar',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']
  },
  {
    id: 'notifications',
    label: 'Notificaciones',
    icon: Bell,
    path: '/notifications',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']
  },
   {
    id: 'forms',
    label: 'Formularios',
    icon: FileText,
    path: '/forms',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT'],
  },
  {
    id: 'admin',
    label: 'Administración',
    icon: Shield,
    roles: ['ADMINISTRATOR', 'INSTRUCTOR'],
    color: 'hsl(var(--destructive))',
    children: [
      {
        id: 'manage-courses',
        label: 'Gestionar Cursos',
        icon: BookMarked,
        path: '/manage-courses',
        roles: ['ADMINISTRATOR', 'INSTRUCTOR']
      },
      {
        id: 'enrollments',
        label: 'Inscripciones',
        icon: TrendingUp,
        path: '/enrollments',
        roles: ['ADMINISTRATOR', 'INSTRUCTOR']
      },
      {
        id: 'analytics',
        label: 'Analíticas',
        icon: BarChart3,
        path: '/analytics',
        roles: ['ADMINISTRATOR']
      },
      {
        id: 'users',
        label: 'Usuarios',
        icon: Users,
        path: '/users',
        roles: ['ADMINISTRATOR']
      },
      {
        id: 'security-audit',
        label: 'Seguridad',
        icon: ShieldAlert,
        path: '/security-audit',
        roles: ['ADMINISTRATOR']
      },
      {
        id: 'settings',
        label: 'Configuración',
        icon: Settings,
        path: '/settings',
        roles: ['ADMINISTRATOR']
      },
    ]
  }
];

export const getNavItemsForRole = (role: UserRole): NavItem[] => {
  return NAVIGATION_ITEMS
    .filter(item => item.roles.includes(role))
    .map(item => {
        if (item.children) {
            return {
                ...item,
                children: item.children.filter(sub => sub.roles.includes(role))
            }
        }
        return item;
    })
    .filter(item => !item.children || item.children.length > 0);
};
