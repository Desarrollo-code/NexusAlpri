// src/lib/nav-items.ts
import type { NavItem, UserRole, PlatformSettings } from '@/types';
import {
  LayoutGrid,
  BookOpen,
  GraduationCap,
  Notebook,
  Folder,
  CalendarDays,
  FileText,
  Shield,
  BookMarked,
  BarChart3,
  UsersRound,
  ShieldAlert,
  Settings,
  Library,
  Briefcase,
  Trophy,
  Network,
  Sparkles,
  Award,
  Megaphone,
  Rocket,
} from 'lucide-react';
import { GradientIcon } from '@/components/ui/gradient-icon';

const NAVIGATION_ITEMS: NavItem[] = [
  // --- General Items ---
  {
    id: 'dashboard',
    label: 'Panel Principal',
    icon: LayoutGrid,
    path: '/dashboard',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']
  },

  // --- Competition Section ---
  {
    id: 'competition',
    label: 'Competición',
    icon: Trophy,
    path: '/leaderboard',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']
  },

  // --- Communications Section ---
  {
    id: 'communications',
    label: 'Comunicaciones',
    icon: Megaphone,
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT'],
    children: [
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
    ]
  },

  // --- Learning Section ---
  {
    id: 'learning',
    label: 'Formación',
    icon: GraduationCap,
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT'],
    children: [
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
        icon: Library,
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
    ],
  },

  // --- Organization Section ---
  {
    id: 'organization',
    label: 'Organización',
    icon: Briefcase,
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT'],
    children: [
      {
        id: 'resources',
        label: 'Biblioteca',
        icon: Folder,
        path: '/resources',
        roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']
      },
      {
        id: 'forms',
        label: 'Formularios',
        icon: FileText,
        path: '/forms',
        roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT'],
      },
    ]
  },

  // --- Admin Section ---
  {
    id: 'admin',
    label: 'Administración',
    icon: Shield,
    roles: ['ADMINISTRATOR', 'INSTRUCTOR'],
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
        icon: UsersRound,
        path: '/enrollments',
        roles: ['ADMINISTRATOR', 'INSTRUCTOR']
      },
      {
        id: 'motivations',
        label: 'Motivaciones',
        icon: Sparkles,
        path: '/admin/motivations',
        roles: ['ADMINISTRATOR', 'INSTRUCTOR'],
      },
      {
        id: 'certificates',
        label: 'Certificados',
        icon: Award,
        path: '/admin/certificates',
        roles: ['ADMINISTRATOR'],
      },
      {
        id: 'users',
        label: 'Usuarios',
        icon: Network,
        path: '/users',
        roles: ['ADMINISTRATOR']
      },
      {
        id: 'analytics',
        label: 'Analíticas',
        icon: BarChart3,
        path: '/analytics',
        roles: ['ADMINISTRATOR']
      },
      {
        id: 'roadmap',
        label: 'Ruta del Proyecto',
        icon: Rocket,
        path: '/roadmap',
        roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']
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

export const getNavItemsForRole = (role: UserRole, settings?: PlatformSettings | null): NavItem[] => {
  const filterByRole = (items: NavItem[]): NavItem[] => {
    return items
      .filter(item => {
        // Regla general: el rol del usuario debe estar en la lista de roles del item.
        const hasRoleAccess = item.roles.includes(role);

        // Regla específica para la hoja de ruta
        if (item.id === 'roadmap' && settings?.roadmapVisibleTo) {
          return settings.roadmapVisibleTo.includes(role);
        }

        return hasRoleAccess;
      })
      .map(item => {
        // Si el item tiene hijos, filtramos los hijos también.
        if (item.children) {
          const filteredChildren = filterByRole(item.children);
          // Solo devolvemos el item padre si tiene hijos visibles para este rol.
          return filteredChildren.length > 0 ? { ...item, children: filteredChildren } : null;
        }
        return item;
      })
      .filter((item): item is NavItem => item !== null);
  };

  return filterByRole(NAVIGATION_ITEMS);
};
