import type { NavItem, UserRole } from '@/types';
import {
  LayoutGrid,
  BookOpen,
  GraduationCap,
  Notebook,
  Folder,
  Megaphone,
  CalendarDays,
  FileText,
  Shield,
  BookMarked,
  TrendingUp,
  Sparkles,
  Award,
  BarChart3,
  UsersRound,
  ShieldAlert,
  Settings, 
  MessageSquare,
  Library,
  Briefcase,
} from 'lucide-react';

const NAVIGATION_ITEMS: NavItem[] = [
  // --- General Items ---
  {
    id: 'dashboard',
    label: 'Panel Principal',
    icon: LayoutGrid,
    path: '/dashboard',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']
  },
  {
    id: 'messages',
    label: 'Mensajes',
    icon: MessageSquare,
    path: '/messages',
    roles: ['ADMINISTRATOR', 'INSTRUCTOR', 'STUDENT']
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
        id: 'communications',
        label: 'Comunicaciones',
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
        icon: TrendingUp,
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
        id: 'analytics',
        label: 'Analíticas',
        icon: BarChart3,
        path: '/analytics',
        roles: ['ADMINISTRATOR']
      },
      {
        id: 'users',
        label: 'Usuarios',
        icon: UsersRound,
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