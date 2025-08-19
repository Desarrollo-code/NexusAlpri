// src/lib/security-log-utils.tsx
'use client';

import type { SecurityLogEvent } from '@/types';
import { ShieldCheck, ShieldX, KeyRound, UserCog, ShieldAlert } from 'lucide-react';
import React from 'react';

export const getEventDetails = (event: SecurityLogEvent, details?: string | null) => {
    switch (event) {
        case 'SUCCESSFUL_LOGIN':
             return {
                label: 'Inicio Exitoso',
                icon: <ShieldCheck className="h-4 w-4 text-green-500" />,
                variant: 'secondary',
                details: 'Acceso concedido a la cuenta.'
            };
        case 'FAILED_LOGIN_ATTEMPT':
            return {
                label: 'Intento Fallido',
                icon: <ShieldX className="h-4 w-4 text-destructive" />,
                variant: 'destructive',
                details: 'Credenciales incorrectas o usuario no encontrado.'
            };
        case 'PASSWORD_CHANGE_SUCCESS':
             return {
                label: 'Cambio Contraseña',
                icon: <KeyRound className="h-4 w-4 text-primary" />,
                variant: 'default',
                details: 'La contraseña del usuario fue actualizada.'
            };
        case 'TWO_FACTOR_ENABLED':
            return {
                label: '2FA Activado',
                icon: <ShieldCheck className="h-4 w-4 text-green-500" />,
                variant: 'default',
                details: 'El usuario activó la autenticación de dos factores.'
            };
        case 'TWO_FACTOR_DISABLED':
            return {
                label: '2FA Desactivado',
                icon: <ShieldAlert className="h-4 w-4 text-orange-500" />,
                variant: 'destructive',
                details: 'El usuario desactivó la autenticación de dos factores.'
            };
         case 'USER_ROLE_CHANGED':
            return {
                label: 'Cambio de Rol',
                icon: <UserCog className="h-4 w-4 text-purple-500" />,
                variant: 'default',
                details: details || 'El rol del usuario ha sido modificado.'
            };
        default:
            return {
                label: event.replace(/_/g, ' ').toLowerCase(),
                icon: <ShieldAlert className="h-4 w-4 text-muted-foreground" />,
                variant: 'outline',
                details: details || 'Evento de seguridad general.'
            };
    }
};

export const getInitials = (name?: string | null) => {
  if (!name) return '??';
  const names = name.split(' ');
  if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  if (names.length === 1 && names[0]) return names[0].substring(0, 2).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};
