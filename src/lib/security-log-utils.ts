
import type { SecurityLogEvent } from '@/types';
import { ShieldCheck, ShieldX, KeyRound, UserCog, ShieldAlert } from 'lucide-react';
import React from 'react';

export const getEventDetails = (event: SecurityLogEvent, details?: string | null) => {
    switch (event) {
        case 'SUCCESSFUL_LOGIN': return { label: 'Inicio Sesión Exitoso', variant: 'secondary' as const };
        case 'FAILED_LOGIN_ATTEMPT': return { label: 'Intento Fallido', variant: 'destructive' as const };
        case 'PASSWORD_CHANGE_SUCCESS': return { label: 'Cambio de Contraseña', variant: 'default' as const };
        case 'TWO_FACTOR_ENABLED': return { label: '2FA Activado', variant: 'default' as const };
        case 'TWO_FACTOR_DISABLED': return { label: '2FA Desactivado', variant: 'destructive' as const };
        case 'USER_ROLE_CHANGED': return { label: 'Cambio de Rol', variant: 'default' as const };
        default: return { label: 'Evento Desconocido', variant: 'outline' as const };
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
