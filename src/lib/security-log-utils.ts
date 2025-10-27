// src/lib/security-log-utils.ts
import type { SecurityLogEvent, UserRole } from '@/types';
import type { VariantProps } from "class-variance-authority";
import type { BadgeProps } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';

type BadgeVariant = BadgeProps['variant'];

export const getRoleInSpanish = (role: UserRole) => {
    switch (role) {
      case 'ADMINISTRATOR': return 'Administrador';
      case 'INSTRUCTOR': return 'Instructor';
      case 'STUDENT': return 'Estudiante';
      default: return role;
    }
};

export const getRoleBadgeVariant = (role: UserRole): BadgeVariant => {
    switch(role) {
      case 'ADMINISTRATOR': return 'destructive';
      case 'INSTRUCTOR': return 'default';
      case 'STUDENT': return 'secondary';
      default: return 'outline';
    }
};

interface EventDetails {
    label: string;
    iconName: keyof typeof import('lucide-react');
    variant: BadgeVariant;
    details: string;
}

export const getEventDetails = (event: SecurityLogEvent, details?: string | null): EventDetails => {
    switch (event) {
        case 'SUCCESSFUL_LOGIN':
             return { label: 'Inicio Exitoso', iconName: 'ShieldCheck', variant: 'secondary', details: 'Acceso concedido a la cuenta.' };
        case 'FAILED_LOGIN_ATTEMPT':
            return { label: 'Intento Fallido', iconName: 'ShieldX', variant: 'destructive', details: 'Credenciales incorrectas o usuario no encontrado.' };
        case 'PASSWORD_CHANGE_SUCCESS':
             return { label: 'Cambio Contraseña', iconName: 'KeyRound', variant: 'default', details: 'La contraseña del usuario fue actualizada.' };
        case 'TWO_FACTOR_ENABLED':
            return { label: '2FA Activado', iconName: 'ShieldCheck', variant: 'default', details: 'El usuario activó la autenticación de dos factores.' };
        case 'TWO_FACTOR_DISABLED':
            return { label: '2FA Desactivado', iconName: 'ShieldAlert', variant: 'destructive', details: 'El usuario desactivó la autenticación de dos factores.' };
         case 'USER_ROLE_CHANGED':
            return { label: 'Cambio de Rol', iconName: 'UserCog', variant: 'default', details: details || 'El rol del usuario ha sido modificado.' };
        case 'COURSE_CREATED':
            return { label: 'Curso Creado', iconName: 'BookMarked', variant: 'default', details: details || 'Se ha creado un nuevo curso.' };
        case 'COURSE_UPDATED':
            return { label: 'Curso Actualizado', iconName: 'BookMarked', variant: 'secondary', details: details || 'Se ha modificado un curso.' };
        case 'COURSE_DELETED':
            return { label: 'Curso Eliminado', iconName: 'BookMarked', variant: 'destructive', details: details || 'Se ha eliminado un curso.' };
        case 'USER_SUSPENDED':
            return { label: 'Usuario Suspendido', iconName: 'UserX', variant: 'destructive', details: details || 'La cuenta de un usuario ha sido inactivada.' };
        default:
            return { label: event.replace(/_/g, ' ').toLowerCase(), iconName: 'ShieldAlert', variant: 'outline', details: details || 'Evento de seguridad general.' };
    }
};
