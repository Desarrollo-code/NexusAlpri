import type { NavItem, UserRole } from '@/types';
import {
  Bell,
  GitCommitHorizontal,
  Settings,
} from 'lucide-react';
import { 
    IconLayoutGrid, 
    IconBookOpen,
    IconGraduationCap,
    IconNotebook,
    IconFolder,
    IconMegaphone,
    IconCalendarDays,
    IconFileText,
    IconShield,
    IconBookMarked,
    IconTrendingUp,
    IconSparkles,
    IconAward,
    IconBarChart3,
    IconUsersRound,
    IconServer,
    IconShieldAlert,
    IconSettings, 
} from '@/components/icons';

const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Panel Principal',
    icon: IconLayoutGrid,
    path: '/dashboard',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']
  },
  {
    id: 'courses',
    label: 'Catálogo de Cursos',
    icon: IconBookOpen,
    path: '/courses',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT'],
  },
  {
    id: 'my-courses',
    label: 'Mis Cursos',
    icon: IconGraduationCap,
    path: '/my-courses',
    roles: ['STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR']
  },
  {
    id: 'my-notes',
    label: 'Mis Apuntes',
    icon: IconNotebook,
    path: '/my-notes',
    roles: ['STUDENT', 'INSTRUCTOR', 'ADMINISTRATOR'],
  },
  {
    id: 'resources',
    label: 'Biblioteca',
    icon: IconFolder,
    path: '/resources',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']
  },
  {
    id: 'communications',
    label: 'Comunicaciones',
    icon: IconMegaphone,
    path: '/announcements',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']
  },
  {
    id: 'calendar',
    label: 'Calendario',
    icon: IconCalendarDays,
    path: '/calendar',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']
  },
   {
    id: 'forms',
    label: 'Formularios',
    icon: IconFileText,
    path: '/forms',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT'],
  },
  {
    id: 'admin',
    label: 'Administración',
    icon: IconShield,
    roles: ['ADMINISTRATOR', 'INSTRUCTOR'],
    color: 'hsl(var(--destructive))',
    children: [
      {
        id: 'manage-courses',
        label: 'Gestionar Cursos',
        icon: IconBookMarked,
        path: '/manage-courses',
        roles: ['ADMINISTRATOR', 'INSTRUCTOR']
      },
      {
        id: 'enrollments',
        label: 'Inscripciones',
        icon: IconTrendingUp,
        path: '/enrollments',
        roles: ['ADMINISTRATOR', 'INSTRUCTOR']
      },
       {
        id: 'motivations',
        label: 'Motivaciones',
        icon: IconSparkles,
        path: '/admin/motivations',
        roles: ['ADMINISTRATOR', 'INSTRUCTOR'],
      },
      {
        id: 'certificates',
        label: 'Certificados',
        icon: IconAward,
        path: '/admin/certificates',
        roles: ['ADMINISTRATOR'],
      },
      {
        id: 'analytics',
        label: 'Analíticas',
        icon: IconBarChart3,
        path: '/analytics',
        roles: ['ADMINISTRATOR']
      },
      {
        id: 'users',
        label: 'Usuarios',
        icon: IconUsersRound,
        path: '/users',
        roles: ['ADMINISTRATOR']
      },
      {
        id: 'security-audit',
        label: 'Seguridad',
        icon: IconShieldAlert,
        path: '/security-audit',
        roles: ['ADMINISTRATOR']
      },
      {
        id: 'settings',
        label: 'Configuración',
        icon: IconSettings,
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
