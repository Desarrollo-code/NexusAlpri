// src/lib/security-log-utils.tsx
'use client';

import type { SecurityLogEvent, UserRole } from '@/types';
import { ShieldCheck, ShieldX, KeyRound, UserCog, ShieldAlert, Monitor, Globe, Smartphone, HelpCircle } from 'lucide-react';
import React from 'react';
import type { VariantProps } from "class-variance-authority";
import type { BadgeProps } from '@/components/ui/badge';
import { IconBrandWindows } from '@/components/icons/icon-brand-windows';
import { IconBrandLinux } from '@/components/icons/icon-brand-linux';
import { Apple, Chrome } from 'lucide-react';


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

export const getEventDetails = (event: SecurityLogEvent, details?: string | null) => {
    switch (event) {
        case 'SUCCESSFUL_LOGIN':
             return {
                label: 'Inicio Exitoso',
                icon: <ShieldCheck className="h-4 w-4 text-green-500" />,
                variant: 'secondary' as BadgeVariant,
                details: 'Acceso concedido a la cuenta.'
            };
        case 'FAILED_LOGIN_ATTEMPT':
            return {
                label: 'Intento Fallido',
                icon: <ShieldX className="h-4 w-4 text-destructive" />,
                variant: 'destructive' as BadgeVariant,
                details: 'Credenciales incorrectas o usuario no encontrado.'
            };
        case 'PASSWORD_CHANGE_SUCCESS':
             return {
                label: 'Cambio Contraseña',
                icon: <KeyRound className="h-4 w-4 text-primary" />,
                variant: 'default' as BadgeVariant,
                details: 'La contraseña del usuario fue actualizada.'
            };
        case 'TWO_FACTOR_ENABLED':
            return {
                label: '2FA Activado',
                icon: <ShieldCheck className="h-4 w-4 text-green-500" />,
                variant: 'default' as BadgeVariant,
                details: 'El usuario activó la autenticación de dos factores.'
            };
        case 'TWO_FACTOR_DISABLED':
            return {
                label: '2FA Desactivado',
                icon: <ShieldAlert className="h-4 w-4 text-orange-500" />,
                variant: 'destructive' as BadgeVariant,
                details: 'El usuario desactivó la autenticación de dos factores.'
            };
         case 'USER_ROLE_CHANGED':
            return {
                label: 'Cambio de Rol',
                icon: <UserCog className="h-4 w-4 text-blue-500" />,
                variant: 'default' as BadgeVariant,
                details: details || 'El rol del usuario ha sido modificado.'
            };
        default:
            return {
                label: event.replace(/_/g, ' ').toLowerCase(),
                icon: <ShieldAlert className="h-4 w-4 text-muted-foreground" />,
                variant: 'outline' as BadgeVariant,
                details: details || 'Evento de seguridad general.'
            };
    }
};

const parseUserAgent = (userAgent: string | null | undefined): { browser: string; os: string } => {
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

export default parseUserAgent;
