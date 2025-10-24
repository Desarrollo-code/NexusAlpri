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
    iconColorClass: string;
}

export const getEventDetails = (event: SecurityLogEvent, details?: string | null): EventDetails => {
    switch (event) {
        case 'SUCCESSFUL_LOGIN':
             return {
                label: 'Inicio Exitoso',
                iconName: 'ShieldCheck',
                variant: 'secondary' as BadgeVariant,
                details: 'Acceso concedido a la cuenta.',
                iconColorClass: 'text-green-500'
            };
        case 'FAILED_LOGIN_ATTEMPT':
            return {
                label: 'Intento Fallido',
                iconName: 'ShieldX',
                variant: 'destructive' as BadgeVariant,
                details: 'Credenciales incorrectas o usuario no encontrado.',
                iconColorClass: 'text-destructive'
            };
        case 'PASSWORD_CHANGE_SUCCESS':
             return {
                label: 'Cambio Contraseña',
                iconName: 'KeyRound',
                variant: 'default' as BadgeVariant,
                details: 'La contraseña del usuario fue actualizada.',
                iconColorClass: 'text-primary'
            };
        case 'TWO_FACTOR_ENABLED':
            return {
                label: '2FA Activado',
                iconName: 'ShieldCheck',
                variant: 'default' as BadgeVariant,
                details: 'El usuario activó la autenticación de dos factores.',
                iconColorClass: 'text-green-500'
            };
        case 'TWO_FACTOR_DISABLED':
            return {
                label: '2FA Desactivado',
                iconName: 'ShieldAlert',
                variant: 'destructive' as BadgeVariant,
                details: 'El usuario desactivó la autenticación de dos factores.',
                iconColorClass: 'text-orange-500'
            };
         case 'USER_ROLE_CHANGED':
            return {
                label: 'Cambio de Rol',
                iconName: 'UserCog',
                variant: 'default' as BadgeVariant,
                details: details || 'El rol del usuario ha sido modificado.',
                iconColorClass: 'text-blue-500'
            };
        default:
            return {
                label: event.replace(/_/g, ' ').toLowerCase(),
                iconName: 'ShieldAlert',
                variant: 'outline' as BadgeVariant,
                details: details || 'Evento de seguridad general.',
                iconColorClass: 'text-muted-foreground'
            };
    }
};

export const parseUserAgent = (userAgent: string | null | undefined): { browser: string; os: string } => {
    if (!userAgent) return { browser: 'Desconocido', os: 'Desconocido' };
    
    let browser = 'Desconocido';
    let os = 'Desconocido';

    // OS detection
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    // Browser detection
    if (userAgent.includes('Edg/')) browser = 'Edge';
    else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) browser = 'Chrome';
    else if (userAgent.includes('Firefox/')) browser = 'Firefox';
    else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) browser = 'Safari';

    return { browser, os };
};